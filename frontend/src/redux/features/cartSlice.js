import { createSlice } from "@reduxjs/toolkit";
import { getLocalStorage, setLocalStorage } from "@/utils/localstorage";
import { notifyError, notifySuccess } from "@/utils/toast";

const initialState = {
  cart_products: [],
  orderQuantity: 1,
  cartMiniOpen:false,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    add_cart_product: (state, { payload }) => {
      const isExist = state.cart_products.some((i) => i._id === payload._id);
      if (!isExist) {
        // Enforce maximum stock limit even for new items
        const requestedQuantity = Number(state.orderQuantity) || 1;
        if (payload.quantity >= requestedQuantity) {
          const newItem = {
            ...payload,
            orderQuantity: requestedQuantity,
          };
          state.cart_products.push(newItem);
          notifySuccess(`${requestedQuantity} ${payload.title} added to cart`);
        } else {
          notifyError(`Cannot add more than ${payload.quantity} available in stock!`);
          state.orderQuantity = 1; // Reset local counter
        }
      } else {
        state.cart_products.map((item) => {
          if (item._id === payload._id) {
            const currentOrderQty = Number(state.orderQuantity) || 1;
            if (item.quantity >= item.orderQuantity + currentOrderQty) {
              item.orderQuantity =
                currentOrderQty !== 1
                  ? currentOrderQty + item.orderQuantity
                  : item.orderQuantity + 1;
              notifySuccess(`${currentOrderQty} ${item.title} added to cart`);
            } else {
              notifyError("No more quantity available for this product!");
              state.orderQuantity = 1;
            }
          }
          return { ...item };
        });
      }
      setLocalStorage("cart_products", state.cart_products);
    },
    increment: (state, { payload }) => {
      // payload represents the absolute global stock capacity for the item being viewed
      // If payload is not provided, decrement blindly (legacy behavior)
      if (typeof payload === 'number') {
        if (state.orderQuantity < payload) {
          state.orderQuantity += 1;
        } else {
          notifyError(`Maximum stock limit of ${payload} reached!`);
        }
      } else {
        state.orderQuantity += 1;
      }
    },
    decrement: (state, { payload }) => {
      state.orderQuantity =
        state.orderQuantity > 1
          ? state.orderQuantity - 1
          : (state.orderQuantity = 1);
    },
    quantityDecrement: (state, { payload }) => {
      state.cart_products.map((item) => {
        if (item._id === payload._id) {
          if (item.orderQuantity > 1) {
            item.orderQuantity = item.orderQuantity - 1;
          }
        }
        return { ...item };
      });
      setLocalStorage("cart_products", state.cart_products);
    },
    setOrderQuantity: (state, { payload }) => {
      const { quantity, maxStock } = payload;
      if (quantity === "" || isNaN(quantity)) {
        state.orderQuantity = "";
      } else {
        const numQty = Number(quantity);
        if (typeof maxStock === 'number' && numQty > maxStock) {
          state.orderQuantity = maxStock;
          notifyError(`Maximum stock limit of ${maxStock} reached!`);
        } else if (numQty >= 1) {
          state.orderQuantity = numQty;
        }
      }
    },
    setCartItemQuantity: (state, { payload }) => {
      const { _id, quantity, maxStock } = payload;
      state.cart_products = state.cart_products.map((item) => {
        if (item._id === _id) {
          if (quantity === "" || isNaN(quantity)) {
            item.orderQuantity = "";
          } else {
            const numQty = Number(quantity);
            if (typeof maxStock === 'number' && numQty > maxStock) {
              item.orderQuantity = maxStock;
              notifyError(`Maximum stock limit of ${maxStock} reached!`);
            } else if (numQty >= 1) {
              item.orderQuantity = numQty;
            }
          }
        }
        return item;
      });
      setLocalStorage("cart_products", state.cart_products);
    },
    remove_product: (state, { payload }) => {
      state.cart_products = state.cart_products.filter(
        (item) => item._id !== payload.id
      );
      setLocalStorage("cart_products", state.cart_products);
      notifyError(`${payload.title} Remove from cart`);
    },
    get_cart_products: (state, action) => {
      state.cart_products = getLocalStorage("cart_products");
    },
    initialOrderQuantity: (state, { payload }) => {
      state.orderQuantity = 1;
    },
    clearCart:(state) => {
      const isClearCart = window.confirm('Are you sure you want to remove all items ?');
      if(isClearCart){
        state.cart_products = []
      }
      setLocalStorage("cart_products", state.cart_products);
    },
    openCartMini:(state,{payload}) => {
      state.cartMiniOpen = true
    },
    closeCartMini:(state,{payload}) => {
      state.cartMiniOpen = false
    },
  },
});

export const {
  add_cart_product,
  increment,
  decrement,
  get_cart_products,
  remove_product,
  quantityDecrement,
  setOrderQuantity,
  setCartItemQuantity,
  initialOrderQuantity,
  clearCart,
  closeCartMini,
  openCartMini,
} = cartSlice.actions;
export default cartSlice.reducer;
