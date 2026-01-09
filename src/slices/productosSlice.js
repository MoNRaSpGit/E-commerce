import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiFetch } from "../services/apiFetch"; // ✅ nuevo

export const fetchProductos = createAsyncThunk(
  "productos/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/productos",
        { method: "GET" },
        { auth: false } // ✅ público: NO manda Authorization
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        return rejectWithValue(data?.error || "No se pudieron cargar productos");
      }

      return data.data || [];
    } catch {
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
  reducers: {
    productoStockActualizado: (state, action) => {
      const { productoId, stock } = action.payload || {};
      const idNum = Number(productoId);

      const p = state.items.find((x) => Number(x.id) === idNum);
      if (p) {
        p.stock = Number(stock ?? 0);
      }
    },
  },

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

export const { productoStockActualizado } = productosSlice.actions;
export const selectProductos = (s) => s.productos.items;
export const selectProductosStatus = (s) => s.productos.status;
export const selectProductosError = (s) => s.productos.error;

export default productosSlice.reducer;
