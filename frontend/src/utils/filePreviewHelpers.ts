/**
 * Generic file preview utilities for handling single and multiple file uploads
 * with preview URL management and normalization
 */

import { API_BASE_URL } from "@/services/api/baseApi";

export type PreviewSourceType = "local" | "existing";

export interface PreviewItem {
  id: string;
  url: string;
  name: string;
  sourceType: PreviewSourceType;
  file?: File | null;
  size?: number;
}

/**
 * Creates a preview item from a File object
 */
export function createPreviewItemFromFile(
  file: File,
  index?: number
): PreviewItem {
  const previewUrl = URL.createObjectURL(file);
  return {
    id: `file-${Date.now()}-${index ?? 0}-${file.name}`,
    url: previewUrl,
    name: file.name,
    sourceType: "local",
    file,
    size: file.size,
  };
}

/**
 * Creates a preview item from an existing URL (from API/storage)
 */
export function createPreviewItemFromUrl(
  url: string,
  name?: string,
  index?: number
): PreviewItem {
  return {
    id: `url-${Date.now()}-${index ?? 0}-${url}`,
    url,
    name: name || url.split("/").pop() || "Image",
    sourceType: "existing",
    file: null,
  };
}

/**
 * Normalizes various input types to PreviewItem array
 */
export function normalizeToPreviewItems(
  input: File | File[] | string | string[] | null | undefined,
  existingNames?: string[] | ((index: number) => string)
): PreviewItem[] {
  if (!input) return [];

  // Handle arrays
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== null && item !== undefined)
      .map((item, index) => {
        if (item instanceof File) {
          return createPreviewItemFromFile(item, index);
        } else if (typeof item === "string") {
          const name =
            typeof existingNames === "function"
              ? existingNames(index)
              : existingNames?.[index] || undefined;
          return createPreviewItemFromUrl(item, name, index);
        }
        return null;
      })
      .filter((item): item is PreviewItem => item !== null);
  }

  // Handle single items
  if (input instanceof File) {
    return [createPreviewItemFromFile(input, 0)];
  } else if (typeof input === "string") {
    const name =
      typeof existingNames === "function"
        ? existingNames(0)
        : existingNames?.[0] || undefined;
    return [createPreviewItemFromUrl(input, name, 0)];
  }

  return [];
}

/**
 * Cleans up blob URLs from preview items
 */
export function cleanupPreviewUrls(items: PreviewItem[]): void {
  items.forEach((item) => {
    if (item.sourceType === "local" && item.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
  });
}

/**
 * Gets the full URL for a stored image path
 * Handles relative paths, full URLs, and null/empty values
 */
export function getFullImageUrl(
  imagePath: string | null | undefined,
  baseUrl?: string
): string | undefined {
  if (!imagePath || imagePath.trim() === "") {
    return undefined;
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Get base URL
  const BASE_URL = baseUrl || API_BASE_URL;
  const baseWithoutApi = BASE_URL.replace(/\/api$/, "");

  // If it's a relative path (starts with /), prepend base URL without /api
  if (imagePath.startsWith("/")) {
    return `${baseWithoutApi}${imagePath}`;
  }

  // Otherwise, treat as relative path and prepend base URL with /
  return `${baseWithoutApi}/${imagePath}`;
}

