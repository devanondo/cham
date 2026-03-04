import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UserInfoResponse } from '@/types/auth.type'
import type { RootState } from '@/store'
import { cookieStorage } from '@/lib/cookie-storage'

const BASE_URL = 'https://api.taskgrid.xyz'

export interface LoginRequest {
  email: string
  password: string
}

// //
// Create Issue
// priantibanik
// {
//   "_id": "691d5fab83113b001dddf468",
//   "avatar": "https://cdn.egshop.dev/taskgrid/avatars/Turna-01-1765282905012-e3d42d47.jpg",
//   "email": "priantibanik@gmail.com",
//   "emailVerified": true,
//   "lastActiveWorkspaceURL": "priantibaniks-workspace",
//   "name": "priantibanik",
//   "role": "user",
//   "username": "priantibanik"
// }
export interface LoginResponse {
  access_token: string
  user: {
    _id: string
    email: string
    name: string
    avatar: string
    emailVerified: boolean
    lastActiveWorkspaceURL: string
    role: string
    username: string
  }
}

interface AuthState {
  user: LoginResponse['user'] | null
  userInfo: UserInfoResponse | null
  access_token: string | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  userInfo: null,
  access_token: null,
  isLoggedIn: false,
  loading: false,
  error: null,
}

// Hydrates the store from chrome.storage.local — call this on every context startup
export const initAuth = createAsyncThunk('auth/init', async () => {
  const access_token = await cookieStorage.get<string>('access_token')
  const user = await cookieStorage.get<LoginResponse['user']>('user')
  const userInfo = await cookieStorage.get<UserInfoResponse>('userInfo')
  return { access_token, user, userInfo }
})

export const login = createAsyncThunk<LoginResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return rejectWithValue(err?.message ?? 'Login failed')
      }
      return (await res.json()) as LoginResponse
    } catch {
      return rejectWithValue('Network error')
    }
  }
)

export const getUserInfo = createAsyncThunk<UserInfoResponse, void, { state: RootState; rejectValue: string }>(
  'auth/getUserInfo',
  async (_, { getState, rejectWithValue }) => {
    try {
      const access_token = getState().auth.access_token
      const res = await fetch(`${BASE_URL}/api/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return rejectWithValue(err?.message ?? 'Failed to fetch user info')
      }
      return (await res.json()) as UserInfoResponse
    } catch {
      return rejectWithValue('Network error')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.userInfo = null
      state.access_token = null
      state.isLoggedIn = false
      state.error = null
      cookieStorage.clear()
    },
    clearError(state) {
      state.error = null
    },
    setTokenAndUserInfo(state, action: PayloadAction<{ access_token: string; userInfo: UserInfoResponse }>) {
      state.access_token = action.payload.access_token
      state.userInfo = action.payload.userInfo

      cookieStorage.set('access_token', action.payload.access_token)
      cookieStorage.set('userInfo', action.payload.userInfo)
    },
  },
  extraReducers: (builder) => {
    builder
      // initAuth — hydrate store from chrome.storage on startup
      .addCase(initAuth.fulfilled, (state, action) => {
        const { access_token, user, userInfo } = action.payload
        if (access_token) {
          state.access_token = access_token
          state.user = user
          state.userInfo = userInfo ?? null
          state.isLoggedIn = true
        }
      })
      // login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.loading = false
        state.isLoggedIn = true
        state.access_token = action.payload.access_token
        state.user = action.payload.user
        cookieStorage.set('access_token', action.payload.access_token)
        cookieStorage.set('user', action.payload.user)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Login failed'
      })
      // getUserInfo
      .addCase(getUserInfo.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getUserInfo.fulfilled, (state, action: PayloadAction<UserInfoResponse>) => {
        state.loading = false
        state.userInfo = action.payload
        state.isLoggedIn = true
        cookieStorage.set('userInfo', action.payload)
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to fetch user info'
        state.isLoggedIn = false
      })
  },
})

export const { logout, clearError, setTokenAndUserInfo } = authSlice.actions
export default authSlice.reducer
