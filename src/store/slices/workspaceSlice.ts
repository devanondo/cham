import type { RootState } from '@/store'
import type { WorkspaceResponse, WorkspaceState } from '@/types/workspace.type'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { chromeStorage } from '@/lib/chrome-storage'
import { sendToBackground } from '@/lib/messages'

const BASE_URL = 'https://api.taskgrid.xyz'

const initialState: WorkspaceState = {
  workspaces: {
    myWorkspaces: [],
    guestWorkspaces: [],
  },
  loading: false,
  error: null,
}

export const initWorkspaces = createAsyncThunk('workspace/init', async () => {
  const workspaces = await chromeStorage.get<WorkspaceResponse>('workspaces')
  return workspaces
})

export const getWorkspaces = createAsyncThunk<WorkspaceResponse, void, { state: RootState; rejectValue: string }>(
  'workspace/getWorkspaces',
  async (_, { getState, rejectWithValue }) => {
    try {
      const access_token = getState().auth.access_token
      const res = await fetch(`${BASE_URL}/api/workspaces`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return rejectWithValue(err?.message ?? 'Failed to fetch workspaces')
      }
      return (await res.json()) as WorkspaceResponse
    } catch {
      return rejectWithValue('Network error')
    }
  }
)

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspaces: (state, action: PayloadAction<WorkspaceResponse>) => {
      state.workspaces = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initWorkspaces.fulfilled, (state, action) => {
        if (action.payload) {
          state.workspaces = action.payload
        }
      })
      .addCase(getWorkspaces.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getWorkspaces.fulfilled, (state, action: PayloadAction<WorkspaceResponse>) => {
        state.loading = false
        state.workspaces = action.payload
        chromeStorage.set('workspaces', action.payload)
        sendToBackground({ type: 'WORKSPACE_STATE_CHANGED', payload: action.payload })
      })
      .addCase(getWorkspaces.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to fetch workspaces'
      })
  },
})

export const { setWorkspaces } = workspaceSlice.actions
export default workspaceSlice.reducer
