import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "eco_auth";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      })
    );
  } catch {}
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

const initialStored = loadFromStorage();

const initialState = {
  user: initialStored?.user || null,
  accessToken: initialStored?.accessToken || null,
  refreshToken: initialStored?.refreshToken || null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        return rejectWithValue(data?.error || "Login inválido");
      }

      return data; // { ok, user, accessToken, refreshToken }
    } catch (e) {
      return rejectWithValue("No se pudo conectar con el servidor");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers:{
  setAuth(state, action) {
    state.user = action.payload.user;
    state.accessToken = action.payload.accessToken;
    state.refreshToken = action.payload.refreshToken;
    state.status = "succeeded";
    state.error = null;
    saveToStorage(state);
  },    
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "idle";
      state.error = null;
      clearStorage();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        saveToStorage(state);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error de login";
      });
  },
});

export const { logout, setAuth } = authSlice.actions;

export const selectAuth = (s) => s.auth;
export const selectUser = (s) => s.auth.user;
export const selectIsAuthed = (s) => Boolean(s.auth.accessToken);

export default authSlice.reducer;
