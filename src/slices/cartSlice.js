import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // [{ id, name, price, qty, image, stock }]
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

      if (found) {
        // ✅ refrescar stock si viene desde productos (por si el item viejo no lo tenía)
        if (p?.stock !== undefined) found.stock = Number(p.stock ?? found.stock ?? 0);

        const limit = Number(found.stock ?? 0);

        // sin stock o sin info → no permitir sumar (modo demo)
        if (!Number.isFinite(limit) || limit <= 0) return;

        if (found.qty < limit) found.qty += 1;
        return;
      }

      const stock = Number(p.stock ?? 0);

      // si no hay stock, no agregamos
      if (!Number.isFinite(stock) || stock <= 0) return;

      state.items.push({
        id,
        name: p.name,
        price: Number(p.price) || 0,
        image: p.image || null,
        stock, // ✅ clave
        qty: 1,
      });
    },

    removeItem(state, action) {
      const id = action.payload;
      state.items = state.items.filter((x) => x.id !== id);
    },

    incQty(state, action) {
      const id = action.payload;
      const found = state.items.find((x) => x.id === id);
      if (!found) return;

      const limit = Number(found.stock ?? 0);
      if (!Number.isFinite(limit) || limit <= 0) return;

      if (found.qty < limit) found.qty += 1;
    },

    decQty(state, action) {
      const id = action.payload;
      const found = state.items.find((x) => x.id === id);
      if (!found) return;

      found.qty -= 1;
      if (found.qty <= 0) {
        state.items = state.items.filter((x) => x.id !== id);
      }
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
