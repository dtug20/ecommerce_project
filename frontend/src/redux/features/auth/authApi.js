import { apiSlice } from "@/redux/api/apiSlice";
import { userLoggedIn } from "./authSlice";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // get user profile from backend (syncs Keycloak user with MongoDB)
    getUserProfile: builder.query({
      query: () => "/api/user/me",
      async onQueryStarted(arg, { queryFulfilled, dispatch, getState }) {
        try {
          const result = await queryFulfilled;
          // Backend returns { status, data: { user } } — merge MongoDB _id with existing Keycloak user
          const mongoUser = result.data?.data?.user || result.data;
          const existingUser = getState().auth.user;
          dispatch(
            userLoggedIn({
              user: { ...existingUser, ...mongoUser },
              authenticated: true,
            })
          );
        } catch (err) {
          console.error("[Auth] Failed to sync user profile:", err);
        }
      },
    }),
    // update profile (business data only — backend uses token identity, no id needed)
    updateProfile: builder.mutation({
      query: (data) => ({
        url: `/api/user/update-user`,
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
