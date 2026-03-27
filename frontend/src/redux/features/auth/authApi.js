import { apiSlice } from "@/redux/api/apiSlice";
import { userLoggedIn } from "./authSlice";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // get user profile from backend (syncs Keycloak user with MongoDB)
    getUserProfile: builder.query({
      query: () => "/api/v1/user/profile",
      async onQueryStarted(arg, { queryFulfilled, dispatch, getState }) {
        try {
          const result = await queryFulfilled;
          // Backend returns { success, data: user } or { status, data: { user } }
          const mongoUser = result.data?.data?.user || result.data?.data || result.data;
          const existingUser = getState().auth.user;
          // Merge: MongoDB provides _id, addresses, vendorProfile, etc.
          // Keycloak identity (name, email, keycloakId, roles) takes precedence
          dispatch(
            userLoggedIn({
              user: {
                ...mongoUser,
                ...existingUser,
                _id: mongoUser._id || existingUser?._id,
              },
              authenticated: true,
            })
          );
        } catch (err) {
          // Failed to sync user profile — user can still browse
        }
      },
    }),
    // update profile (business data only — backend uses token identity, no id needed)
    updateProfile: builder.mutation({
      query: (data) => ({
        url: `/api/v1/user/profile`,
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
