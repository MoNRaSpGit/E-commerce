import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiFetch } from "../services/apiFetch";

// Thunk: trae reposición desde backend
export const fetchReposicion = createAsyncThunk(
  "reposicion/fetchReposicion",
  async ({ dispatch, navigate } = {}, { rejectWithValue }) => {
    try {
      const res = await apiFetch(
        "/api/reposicion",
        { method: "GET" },
        {
          dispatch, navigate,
          onForbidden: () => {
            // si querés: toast + redirect (si usás toast acá, importalo)
            navigate?.("/productos");
          }
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        return rejectWithValue(data?.error || "Error al obtener reposición");
      }

      // Si tu controller devuelve { ok:true, items:[...], total }
      const items =
        Array.isArray(data) ? data :
          (data?.data || data?.items || []);


      return { items, raw: data };
    } catch (err) {
      return rejectWithValue("Error de red o servidor");
    }
  }
);

const reposicionSlice = createSlice({
  name: "reposicion",
  initialState: {
    items: [],
    status: "idle",   // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    clearReposicionError(state) {
      state.error = null;
    },
    clearReposicion(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReposicion.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchReposicion.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
      })
      .addCase(fetchReposicion.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error desconocido";
      });
  },
});

export const { clearReposicionError, clearReposicion } = reposicionSlice.actions;

export default reposicionSlice.reducer;
