import io
import os
import threading
from typing import List, Tuple, Optional, Union

import faiss
import numpy as np
from PIL import Image

import torch
import open_clip

DIM = 512
INDEX_PATH = os.environ.get("FAISS_INDEX_PATH", "./faiss_index.cosine.idmap")
DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else ("mps" if torch.backends.mps.is_available() else "cpu")
)
MODEL_NAME = "ViT-B-32"
PRETRAINED = "laion2b_s34b_b79k"


class FaissImageIndex:
    """
    Singleton-style FAISS index + OpenCLIP embedder.
    - Accepts bytes or any file-like object with .read() (e.g., InMemoryUploadedFile).
    - Stores unit-normalized embeddings so IndexFlatIP returns cosine similarity.
    """

    _instance = None
    _lock = threading.RLock()

    def __init__(self):
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            MODEL_NAME, pretrained=PRETRAINED
        )
        self.model.eval().to(DEVICE)

        if os.path.exists(INDEX_PATH):
            idx = faiss.read_index(INDEX_PATH)
            if not isinstance(idx, (faiss.IndexIDMap, faiss.IndexIDMap2)):
                idx = faiss.IndexIDMap(idx)
            self.index = idx
        else:
            base = faiss.IndexFlatIP(DIM)
            self.index = faiss.IndexIDMap(base)

    @classmethod
    def get(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = FaissImageIndex()
            return cls._instance

    # -------- Helpers --------
    def _to_bytes(self, blob: Union[bytes, bytearray, "io.IOBase", object]) -> bytes:
        """
        Accept bytes/bytearray or any file-like with .read() (e.g., InMemoryUploadedFile).
        Returns raw bytes without consuming the original stream for later reuse when possible.
        """
        if isinstance(blob, (bytes, bytearray)):
            return bytes(blob)
        if hasattr(blob, "read"):
            try:
                pos = blob.tell()
            except Exception:
                pos = None
            data = blob.read()
            try:
                if pos is not None:
                    blob.seek(pos)
            except Exception:
                pass
            return data
        raise TypeError("image_bytes must be bytes or a file-like object with .read()")

    @torch.no_grad()
    def _embed(
        self, image_bytes_or_file: Union[bytes, bytearray, object]
    ) -> np.ndarray:
        """
        Load image, preprocess for CLIP, encode to a unit-normalized 512-D vector (float32).
        """
        b = self._to_bytes(image_bytes_or_file)
        pil = Image.open(io.BytesIO(b)).convert("RGB")
        x = self.preprocess(pil).unsqueeze(0).to(DEVICE)
        z = self.model.encode_image(x)
        z = z / z.norm(dim=-1, keepdim=True)
        return z.squeeze(0).float().cpu().numpy()

    def add_image(
        self, _id: int, image_bytes_or_file: Union[bytes, bytearray, object]
    ) -> None:
        """
        Add or update one image vector with your own integer ID.
        If the ID already exists, it's removed first and replaced with the new vector.
        """
        vec = self._embed(image_bytes_or_file).astype("float32")[None, :]  # [1,512]
        ids = np.array([_id], dtype="int64")

        with self._lock:
            try:
                self.index.remove_ids(ids)  # safe even if id not present
            except Exception:
                pass
            self.index.add_with_ids(vec, ids)
            faiss.write_index(self.index, INDEX_PATH)

    def find_top1(
        self,
        image_bytes_or_file: Union[bytes, bytearray, object],
        min_cosine: float = 0.90,
    ) -> Optional[dict]:
        """
        Convenience: return exactly one record (dict with id & cosine) if top-1 >= min_cosine; else None.
        """
        with self._lock:
            if self.index.ntotal == 0:
                return None

        q = self._embed(image_bytes_or_file).astype("float32")[None, :]  # [1,512]
        with self._lock:
            scores, ids = self.index.search(q, 1)

        s, i = float(scores[0][0]), int(ids[0][0])
        if i == -1 or s < min_cosine:
            return None
        return {"id": i, "cosine": s}

    # Optional utilities
    def remove_id(self, _id: int) -> bool:
        """Remove a vector by your ID. Returns True if something was removed."""
        with self._lock:
            n_before = self.index.ntotal
            self.index.remove_ids(np.array([_id], dtype="int64"))
            faiss.write_index(self.index, INDEX_PATH)
            return self.index.ntotal < n_before

    def count(self) -> int:
        """Number of vectors currently indexed."""
        with self._lock:
            return int(self.index.ntotal)


INDEX = FaissImageIndex.get()
