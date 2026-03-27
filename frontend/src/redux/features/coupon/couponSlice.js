import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  coupon_info: undefined,
};

export const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    set_coupon: (state, { payload }) => {
      state.coupon_info = payload;
      
      localStorage.setItem(
        "couponInfo",
        JSON.stringify(payload)
      );
    },
  },
});

export const { set_coupon } = couponSlice.actions;
export default couponSlice.reducer;
