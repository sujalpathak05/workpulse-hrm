import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const checkIn = createAsyncThunk('attendance/checkIn', async (location, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/attendance/checkin', location);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Check-in failed');
  }
});

export const checkOut = createAsyncThunk('attendance/checkOut', async (location, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/attendance/checkout', location);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Check-out failed');
  }
});

export const getTodayStatus = createAsyncThunk('attendance/today', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/attendance/today');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const getMyAttendance = createAsyncThunk('attendance/getMyAttendance', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/attendance/me', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    today: null,
    hasCheckedIn: false,
    hasCheckedOut: false,
    records: [],
    summary: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAttendanceError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkIn.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.loading = false;
        state.today = action.payload.attendance;
        state.hasCheckedIn = true;
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkOut.pending, (state) => { state.loading = true; })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.loading = false;
        state.today = action.payload.attendance;
        state.hasCheckedOut = true;
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getTodayStatus.fulfilled, (state, action) => {
        state.today = action.payload.attendance;
        state.hasCheckedIn = action.payload.hasCheckedIn;
        state.hasCheckedOut = action.payload.hasCheckedOut;
      })
      .addCase(getMyAttendance.pending, (state) => { state.loading = true; })
      .addCase(getMyAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.summary = action.payload.summary;
      })
      .addCase(getMyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
