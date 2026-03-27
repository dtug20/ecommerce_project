import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  shipping_info: {},
  stripe_client_secret:"",
};

export const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    set_shipping: (state, { payload }) => {
      state.shipping_info = payload;
      localStorage.setItem(
        "shipping_info",
        JSON.stringify(payload)
      );
    },
    set_client_secret:(state,{payload}) => {
      state.stripe_client_secret = payload;
    }
  },
});

export const {set_shipping,set_client_secret} = orderSlice.actions;
export default orderSlice.reducer;
