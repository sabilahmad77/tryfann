import { baseApi } from './baseApi';

export interface Region {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export const regionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all regions - matches Postman: GET /api/market_final/regions
    getRegions: builder.query<Region[], void>({
      query: () => '/market_final/regions',
      providesTags: ['Region'],
      transformResponse: (response: unknown): Region[] => {
        // Handle both direct array response and wrapped response
        if (Array.isArray(response)) {
          return response;
        }
        if (response && typeof response === 'object' && 'data' in response) {
          const data = (response as { data: unknown }).data;
          return Array.isArray(data) ? data : [];
        }
        return [];
      },
    }),
  }),
});

export const { useGetRegionsQuery } = regionApi;
