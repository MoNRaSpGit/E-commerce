import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import productosReducer from "../slices/productosSlice";
import cartReducer, { setCart } from "../slices/cartSlice";

const AUTH_KEY = "eco_auth";
const CART_PREFIX = "eco_cart";

function getUserIdFromAuthStorage() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

function getCartKey(userId) {
  return userId ? `${CART_PREFIX}_${userId}` : `${CART_PREFIX}_guest`;
}

function loadCartForUser(userId) {
  try {
    const raw = localStorage.getItem(getCartKey(userId));
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveCartForUser(userId, items) {
  try {
    localStorage.setItem(getCartKey(userId), JSON.stringify(items));
  } catch {}
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    productos: productosReducer,
    cart: cartReducer,
  },
});

// ✅ 1) Hydrate inicial
const initialUserId = getUserIdFromAuthStorage();
store.dispatch(setCart(loadCartForUser(initialUserId)));

// ✅ 2) Persistir por usuario + switch automático (sin loop)
let lastUserId = initialUserId;
let lastCartJson = JSON.stringify(store.getState().cart.items);
let isHydratingCart = false;

store.subscribe(() => {
  if (isHydratingCart) return;

  const state = store.getState();
  const userId = state.auth.user?.id ?? null;
  const items = state.cart.items;

  // Si cambió el usuario: cargar su carrito
  if (userId !== lastUserId) {
    isHydratingCart = true;
    try {
      const nextItems = loadCartForUser(userId);
      store.dispatch(setCart(nextItems));
      lastUserId = userId;
      lastCartJson = JSON.stringify(nextItems);
    } finally {
      isHydratingCart = false;
    }
    return;
  }

  // Si cambió el carrito: guardar en key del usuario actual
  const json = JSON.stringify(items);
  if (json !== lastCartJson) {
    saveCartForUser(userId, items);
    lastCartJson = json;
  }
});

