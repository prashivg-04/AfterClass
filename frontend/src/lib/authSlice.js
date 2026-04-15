import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  session: null,
  user: null,
  role: null,
  needsProfile: false,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload;
      state.user = action.payload?.user || null;
      state.loading = false;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setNeedsProfile: (state, action) => {
      state.needsProfile = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearAuth: (state) => {
      state.session = null;
      state.user = null;
      state.role = null;
      state.needsProfile = false;
      state.loading = false;
    },
  },
});

export const { setSession, setRole, setNeedsProfile, setLoading, clearAuth } = authSlice.actions;

export default authSlice.reducer;
