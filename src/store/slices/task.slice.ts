import { CreateTaskPayload, Task, TaskState } from '@/types/task.type'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

const BASE_URL = 'https://api.taskgrid.xyz'

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
}

export const createTaskAction = createAsyncThunk<Task, CreateTaskPayload, { state: RootState; rejectValue: string }>(
  'task/create',
  async (task, { getState, rejectWithValue }) => {
    try {
      const { access_token } = getState().auth
      const res = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
        body: JSON.stringify(task),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return rejectWithValue(err?.message ?? 'Failed to create task')
      }
      return (await res.json()) as Task
    } catch (error) {
      return rejectWithValue('Failed to create task')
    }
  }
)

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createTaskAction.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTaskAction.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false
        state.tasks.push(action.payload)
      })
      .addCase(createTaskAction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to create task'
      })
  },
})

export default taskSlice.reducer
