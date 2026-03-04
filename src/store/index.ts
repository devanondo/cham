import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { api } from '@/store/api/api'
import authReducer from './slices/authSlice'
import workspaceReducer from './slices/workspaceSlice'
import taskReducer from './slices/task.slice'
import attachmentReducer from './slices/attachment.slice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    task: taskReducer,
    attachment: attachmentReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  devTools: { name: 'TaskGrid · Popup' },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
