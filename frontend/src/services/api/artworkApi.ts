import { baseApi } from "./baseApi";

// Types based on backend Postman collection for artwork_artist
export interface ArtworkItem {
  id: number;
  title: string;
  price: string;
  image: string;
  dimensions: string;
  medium: string;
  description: string;
  status?: "available" | "sold" | "featured";
  user_type?: string;
  no_artist?: string;
}

export interface CreateArtworkRequest {
  title: string;
  price: string;
  dimensions: string;
  medium: string;
  description: string;
  image: File;
  no_artist?: string;
  user_type?: string;
}

export interface UpdateArtworkRequest {
  id: number;
  title?: string;
  price?: string;
  dimensions?: string;
  medium?: string;
  description?: string;
  image?: File | null;
  no_artist?: string;
  user_type?: string;
}

export const artworkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyArtworks: build.query<ArtworkItem[], void>({
      query: () => ({
        url: "/market_final/artwork_artist",
        method: "GET",
      }),
      providesTags: ["Artwork"],
      transformResponse: (response: unknown): ArtworkItem[] => {
        const data = response as
          | ArtworkItem[]
          | { results?: ArtworkItem[]; data?: ArtworkItem[] }
          | null
          | undefined;

        // Support both paginated and plain list responses
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) {
          return data.results;
        }
        if (Array.isArray(data?.data)) {
          return data.data;
        }
        return [];
      },
    }),
    createArtwork: build.mutation<ArtworkItem, CreateArtworkRequest>({
      query: (body) => {
        const formData = new FormData();
        formData.append("title", body.title);
        formData.append("price", body.price);
        formData.append("dimensions", body.dimensions);
        formData.append("medium", body.medium);
        formData.append("description", body.description);
        formData.append("image", body.image);
        if (body.no_artist !== undefined) {
          formData.append("no_artist", body.no_artist);
        }
        if (body.user_type !== undefined) {
          formData.append("user_type", body.user_type);
        }

        return {
          url: "/market_final/artwork_artist/",
          method: "POST",
          body: formData,
          // Let browser set multipart boundary
          headers: {
            "Content-Type": undefined as unknown as string,
          },
        };
      },
      invalidatesTags: ["Artwork"],
      transformResponse: (response: ArtworkItem | { data?: ArtworkItem }): ArtworkItem => {
        // Backend may wrap created object
        if ("data" in response && response.data) return response.data;
        return response as ArtworkItem;
      },
    }),
    updateArtwork: build.mutation<ArtworkItem, UpdateArtworkRequest>({
      query: (body) => {
        const formData = new FormData();
        if (body.title !== undefined) formData.append("title", body.title);
        if (body.price !== undefined) formData.append("price", body.price);
        if (body.dimensions !== undefined)
          formData.append("dimensions", body.dimensions);
        if (body.medium !== undefined) formData.append("medium", body.medium);
        if (body.description !== undefined)
          formData.append("description", body.description);
        if (body.image) {
          formData.append("image", body.image);
        }
        if (body.no_artist !== undefined) {
          formData.append("no_artist", body.no_artist);
        }
        if (body.user_type !== undefined) {
          formData.append("user_type", body.user_type);
        }

        return {
          url: `/market_final/artwork_artist/${body.id}/`,
          method: "PUT",
          body: formData,
          headers: {
            "Content-Type": undefined as unknown as string,
          },
        };
      },
      invalidatesTags: ["Artwork"],
      transformResponse: (response: ArtworkItem | { data?: ArtworkItem }): ArtworkItem => {
        if ("data" in response && response.data) return response.data;
        return response as ArtworkItem;
      },
    }),
    deleteArtwork: build.mutation<void, number>({
      query: (id) => ({
        url: `/market_final/artwork_artist/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Artwork"],
    }),
  }),
});

export const {
  useGetMyArtworksQuery,
  useCreateArtworkMutation,
  useUpdateArtworkMutation,
  useDeleteArtworkMutation,
} = artworkApi;


