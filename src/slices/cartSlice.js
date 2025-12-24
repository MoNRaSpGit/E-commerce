import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // [{ id, name, price, qty, image }]
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart(state, action) {
      state.items = Array.isArray(action.payload) ? action.payload : [];
    },
    addItem(state, action) {
      const p = action.payload;
      const id = p.id;

      const found = state.items.find((x) => x.id === id);
      if (found) found.qty += 1;
      else {
        state.items.push({
          id,
          name: p.name,
          price: Number(p.price) || 0,
          image: p.image || null,
          qty: 1,
        });
      }
    },
    removeItem(state, action) {
      const id = action.payload;
      state.items = state.items.filter((x) => x.id !== id);
    },
    incQty(state, action) {
      const id = action.payload;
      const found = state.items.find((x) => x.id === id);
      if (found) found.qty += 1;
    },
    decQty(state, action) {
      const id = action.payload;
      const found = state.items.find((x) => x.id === id);
      if (!found) return;
      found.qty -= 1;
      if (found.qty <= 0) state.items = state.items.filter((x) => x.id !== id);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { setCart, addItem, removeItem, incQty, decQty, clearCart } =
  cartSlice.actions;

export const selectCartItems = (s) => s.cart.items;
export const selectCartTotalItems = (s) =>
  s.cart.items.reduce((acc, it) => acc + (it.qty || 0), 0);
export const selectCartTotalPrice = (s) =>
  s.cart.items.reduce((acc, it) => acc + (Number(it.price) || 0) * (it.qty || 0), 0);

export default cartSlice.reducer;
