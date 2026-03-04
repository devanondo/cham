import type { RootState } from '@/store'
import type {
  BoardType,
  WorkspaceColumnType,
  WorkspaceDetailsType,
  WorkspaceMembersResponse,
  WorkspaceResponse,
  WorkspaceState,
} from '@/types/workspace.type'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { cookieStorage } from '@/lib/cookie-storage'

const BASE_URL = 'https://api.taskgrid.xyz'

const initialState: WorkspaceState = {
  workspaces: {
    myWorkspaces: [],
    guestWorkspaces: [],
  },
  workSpaceDetails: null,
  workSpaceBoards: null,
  workSpaceColumns: null,
  workspaceMembers: null,
  loading: false,
  error: null,
}

export const initWorkspaces = createAsyncThunk('workspace/init', async () => {
  const workspaces = await cookieStorage.get<WorkspaceResponse>('workspaces')
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

export const getWorkSpaceDetails = createAsyncThunk<
  WorkspaceDetailsType,
  string,
  { state: RootState; rejectValue: string }
>('workspace/getWorkSpaceDetails', async (workspaceSlug, { getState, rejectWithValue }) => {
  try {
    const access_token = getState().auth.access_token
    const res = await fetch(`${BASE_URL}/api/workspaces/${workspaceSlug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return rejectWithValue(err?.message ?? 'Failed to fetch workspace details')
    }
    return (await res.json()) as WorkspaceDetailsType
  } catch {
    return rejectWithValue('Network error')
  }
})

export const getWorkSpaceBoards = createAsyncThunk<BoardType, string, { state: RootState; rejectValue: string }>(
  'workspace/getWorkSpaceBoards',
  async (workspaceId, { getState, rejectWithValue }) => {
    try {
      const access_token = getState().auth.access_token
      const res = await fetch(`${BASE_URL}/api/boards?workspaceId=${workspaceId}&status=active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return rejectWithValue(err?.message ?? 'Failed to fetch workspace boards')
      }
      return (await res.json()) as BoardType
    } catch {
      return rejectWithValue('Network error')
    }
  }
)

// https://api.taskgrid.xyz/api/boards/6923ed23feda85001d53ee13/columns
export const getBoardColumns = createAsyncThunk<
  WorkspaceColumnType[],
  string,
  { state: RootState; rejectValue: string }
>('workspace/getBoardColumns', async (boardId, { getState, rejectWithValue }) => {
  try {
    const access_token = getState().auth.access_token
    const res = await fetch(`${BASE_URL}/api/boards/${boardId}/columns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return rejectWithValue(err?.message ?? 'Failed to fetch board columns')
    }
    return (await res.json()) as WorkspaceColumnType[]
  } catch {
    return rejectWithValue('Network error')
  }
})

// https://api.taskgrid.xyz/api/workspaces/6948d58e08c047001cf9681d/members
export const getWorkspaceMembers = createAsyncThunk<
  WorkspaceMembersResponse,
  string,
  { state: RootState; rejectValue: string }
>('workspace/getWorkspaceMembers', async (workspaceId, { getState, rejectWithValue }) => {
  try {
    const access_token = getState().auth.access_token
    const res = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return rejectWithValue(err?.message ?? 'Failed to fetch workspace members')
    }
    return (await res.json()) as WorkspaceMembersResponse
  } catch {
    return rejectWithValue('Network error')
  }
})

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
        cookieStorage.set('workspaces', action.payload)
      })
      .addCase(getWorkspaces.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to fetch workspaces'
      })

      // getWorkSpaceDetails
      .addCase(getWorkSpaceDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getWorkSpaceDetails.fulfilled, (state, action: PayloadAction<WorkspaceDetailsType>) => {
        state.loading = false
        state.workSpaceDetails = action.payload
      })
      .addCase(getWorkSpaceDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to fetch workspace details'
      })

      // getWorkSpaceBoards
      .addCase(getWorkSpaceBoards.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getWorkSpaceBoards.fulfilled, (state, action: PayloadAction<BoardType>) => {
        state.loading = false
        state.workSpaceBoards = action.payload
      })
      .addCase(getWorkSpaceBoards.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to fetch workspace boards'
      })

      // getBoardColumns
      .addCase(getBoardColumns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getBoardColumns.fulfilled, (state, action: PayloadAction<WorkspaceColumnType[]>) => {
        state.loading = false
        state.workSpaceColumns = action.payload
      })
      .addCase(getBoardColumns.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to fetch board columns'
      })

      // getWorkspaceMembers
      .addCase(getWorkspaceMembers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getWorkspaceMembers.fulfilled, (state, action: PayloadAction<WorkspaceMembersResponse>) => {
        state.loading = false
        state.workspaceMembers = action.payload
      })
      .addCase(getWorkspaceMembers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to fetch workspace members'
      })
  },
})

export const { setWorkspaces } = workspaceSlice.actions
export default workspaceSlice.reducer
