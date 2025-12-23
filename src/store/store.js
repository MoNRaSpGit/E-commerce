import { configureStore } from "@reduxjs/toolkit";
import appReducer from "../slices/appSlice";
import authReducer from "../slices/authSlice";
import productosReducer from "../slices/productosSlice";
import cartReducer from "../slices/cartSlice";



export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    productos: productosReducer,
    cart: cartReducer,
  }
});
