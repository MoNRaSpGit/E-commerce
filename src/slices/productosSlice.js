import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchProductos = createAsyncThunk(
  "productos/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/productos`);
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        return rejectWithValue(data?.error || "No se pudieron cargar productos");
      }

      return data.data || [];
    } catch (e) {
      return rejectWithValue("No se pudo conectar con el servidor");
    }
  }
);

const productosSlice = createSlice({
  name: "productos",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductos.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProductos.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProductos.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error cargando productos";
      });
  },
});

export const selectProductos = (s) => s.productos.items;
export const selectProductosStatus = (s) => s.productos.status;
export const selectProductosError = (s) => s.productos.error;

export default productosSlice.reducer;
