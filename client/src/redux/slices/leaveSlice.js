import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const applyLeave = createAsyncThunk('leave/apply', async (leaveData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/leaves/apply', leaveData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Leave application failed');
  }
});

export const getMyLeaves = createAsyncThunk('leave/getMyLeaves', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/leaves/me', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const getAllLeaves = createAsyncThunk('leave/getAllLeaves', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/leaves', { params });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const leaveAction = createAsyncThunk('leave/action', async ({ id, action, remark }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/leaves/${id}/action`, { action, remark });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const cancelLeave = createAsyncThunk('leave/cancel', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/leaves/${id}/cancel`);
    return { id, ...data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    myLeaves: [],
    allLeaves: [],
    leaveBalance: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearLeaveError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyLeave.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves.unshift(action.payload.leave);
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getMyLeaves.pending, (state) => { state.loading = true; })
      .addCase(getMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves = action.payload.leaves;
        state.leaveBalance = action.payload.leaveBalance;
      })
      .addCase(getAllLeaves.pending, (state) => { state.loading = true; })
      .addCase(getAllLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.allLeaves = action.payload.leaves;
      })
      .addCase(leaveAction.fulfilled, (state, action) => {
        const idx = state.allLeaves.findIndex((l) => l._id === action.payload.leave._id);
        if (idx !== -1) state.allLeaves[idx] = action.payload.leave;
      })
      .addCase(cancelLeave.fulfilled, (state, action) => {
        const idx = state.myLeaves.findIndex((l) => l._id === action.payload.id);
        if (idx !== -1) state.myLeaves[idx].status = 'cancelled';
      });
  },
});

export const { clearLeaveError } = leaveSlice.actions;
export default leaveSlice.reducer;
