import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: undefined,
  authenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (state, { payload }) => {
      state.user = payload.user;
      state.authenticated = payload.authenticated ?? true;
    },
    userLoggedOut: (state) => {
      state.user = undefined;
      state.authenticated = false;
    },
  },
});

export const { userLoggedIn, userLoggedOut } = authSlice.actions;
export default authSlice.reducer;
