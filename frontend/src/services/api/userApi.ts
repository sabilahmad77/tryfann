import { baseApi } from './baseApi';
import type { User } from './types';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get user profile
    getUserProfile: builder.query<User, string>({
      query: (userId) => `/users/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),

    // Update user profile
    updateUserProfile: builder.mutation<User, { userId: string; data: Partial<User> }>({
      query: ({ userId, data }) => ({
        url: `/users/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    // Get all users (example)
    getUsers: builder.query<User[], { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetUsersQuery,
} = userApi;

