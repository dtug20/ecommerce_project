import { apiSlice } from "@/redux/api/apiSlice";
import { userLoggedIn } from "./authSlice";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // get user profile from backend (syncs Keycloak user with MongoDB)
    getUserProfile: builder.query({
      query: () => "/api/user/me",
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              user: result.data,
              authenticated: true,
            })
          );
        } catch (err) {
          // do nothing
        }
      },
    }),
    // update profile (business data only)
    updateProfile: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/user/update-user/${id}`,
        method: "PUT",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              user: result.data,
              authenticated: true,
            })
          );
        } catch (err) {
          // do nothing
        }
      },
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateProfileMutation,
} = authApi;
