
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../services/authServices";
import axiosInstance from "../utils/Axios";

let user = null;

// Register
export const register = createAsyncThunk(
  "auth/signup",
  async (userData, thunkAPI) => {
    try {
      const data = await authService.registerUser(userData);
      localStorage.setItem("user", JSON.stringify({ user: data.user }));

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      const data = await authService.loginUser(userData);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Logout
export const logout = createAsyncThunk("auth/logout", async () => {
  await authService.logoutUser();
});

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, thunkAPI) => {
    try {
      console.log("🔄 checkAuth thunk triggered...");
      const res = await axiosInstance.get("/auth/me"); 
      user = res.data.user;
      console.log("User from checkAuth:", user);
      return res.data.user;
    } catch (error) {
      console.error("❌ checkAuth error:", error);
      return thunkAPI.rejectWithValue("Session expired or not logged in");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: user,
    loading: true,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
      })

      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false
        console.log("✅ checkAuth success:", action.payload);
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.user = null;
        state.loading = false
        console.log("❌ checkAuth failed:", action.payload);
      });
  },
});

export default authSlice.reducer;