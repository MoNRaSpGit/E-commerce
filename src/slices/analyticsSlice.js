import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiFetch } from "../services/apiFetch";

/**
 * 🔹 Top productos
 * GET /api/analytics/top-products?days=7&limit=10
 */
export const fetchTopProducts = createAsyncThunk(
  "analytics/fetchTopProducts",
  async ({ days = 7, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        `/api/analytics/top-products?days=${days}&limit=${limit}`,
        { method: "GET" }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        return rejectWithValue(data?.error || "No se pudieron cargar métricas");
      }

      return data;
    } catch {
      return rejectWithValue("No se pudo conectar con el servidor");
    }
  }
);

/**
 * 🔹 Summary + comparación
 * GET /api/analytics/summary?days=7
 */
export const fetchAnalyticsSummary = createAsyncThunk(
  "analytics/fetchSummary",
  async ({ days = 7 }, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        `/api/analytics/summary?days=${days}`,
        { method: "GET" }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        return rejectWithValue(data?.error || "No se pudo cargar el resumen");
      }

      return data;
    } catch {
      return rejectWithValue("No se pudo conectar con el servidor");
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    top: {
      data: [],
      status: "idle",
      error: null,
    },
    summary: {
      data: null,
      status: "idle",
      error: null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 🔹 top products
      .addCase(fetchTopProducts.pending, (state) => {
        state.top.status = "loading";
        state.top.error = null;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.top.status = "succeeded";
        state.top.data = action.payload.data || [];
      })
      .addCase(fetchTopProducts.rejected, (state, action) => {
        state.top.status = "failed";
        state.top.error = action.payload || "Error cargando top productos";
      })

      // 🔹 summary
      .addCase(fetchAnalyticsSummary.pending, (state) => {
        state.summary.status = "loading";
        state.summary.error = null;
      })
      .addCase(fetchAnalyticsSummary.fulfilled, (state, action) => {
        state.summary.status = "succeeded";
        state.summary.data = action.payload;
      })
      .addCase(fetchAnalyticsSummary.rejected, (state, action) => {
        state.summary.status = "failed";
        state.summary.error = action.payload || "Error cargando summary";
      });
  },
});

export const selectTopProducts = (s) => s.analytics.top.data;
export const selectTopStatus = (s) => s.analytics.top.status;
export const selectTopError = (s) => s.analytics.top.error;

export const selectSummary = (s) => s.analytics.summary.data;
export const selectSummaryStatus = (s) => s.analytics.summary.status;

export default analyticsSlice.reducer;
