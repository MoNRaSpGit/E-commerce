import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "eco_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

const initialState = {
  items: loadCart(), // [{ id, name, price, qty, image }]
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action) {
      const p = action.payload; // producto
      const id = p.id;

      const found = state.items.find((x) => x.id === id);
      if (found) {
        found.qty += 1;
      } else {
        state.items.push({
          id,
          name: p.name,
          price: Number(p.price) || 0,
          image: p.image || null,
          qty: 1,
        });
      }
      saveCart(state.items);
    },

    removeItem(state, action) {
      const id = action.payload;
      state.items = state.items.filter((x) => x.id !== id);
      saveCart(state.items);
    },

    incQty(state, action) {
      const id = action.payload;
      const found = state.items.find((x) => x.id === id);
      if (found) found.qty += 1;
      saveCart(state.items);
    },

    decQty(state, action) {
      const id = action.payload;
      const found = state.items.find((x) => x.id === id);
      if (!found) return;

      found.qty -= 1;
      if (found.qty <= 0) {
        state.items = state.items.filter((x) => x.id !== id);
      }
      saveCart(state.items);
    },

    clearCart(state) {
      state.items = [];
      saveCart(state.items);
    },
  },
});

export const { addItem, removeItem, incQty, decQty, clearCart } = cartSlice.actions;

export const selectCartItems = (s) => s.cart.items;
export const selectCartTotalItems = (s) =>
  s.cart.items.reduce((acc, it) => acc + (it.qty || 0), 0);

export const selectCartTotalPrice = (s) =>
  s.cart.items.reduce((acc, it) => acc + (Number(it.price) || 0) * (it.qty || 0), 0);

export default cartSlice.reducer;
