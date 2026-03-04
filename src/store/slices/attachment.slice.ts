import { Attachment, AttachmentState } from '@/types/attachment.type'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

const BASE_URL = 'https://api.taskgrid.xyz'

const initialState: AttachmentState = {
  attachments: [],
  loading: false,
  error: null,
}

//https://api.taskgrid.xyz/uploads/attachment?workspace=6948d58e08c047001cf9681d&board=6948d59c08c047001cf96846&task
export const createAttachmentAction = createAsyncThunk<
  Attachment[],
  { file: File; workspaceId: string; boardId: string; taskId: string | null },
  { state: RootState; rejectValue: string }
>('attachment/create', async ({ file, workspaceId, boardId, taskId }, { getState, rejectWithValue }) => {
  try {
    const { access_token } = getState().auth
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(
      `${BASE_URL}/uploads/attachment?workspace=${workspaceId}&board=${boardId}&task=${taskId ?? ''}`,
      {
        method: 'POST',
        headers: {
          // No Content-Type — browser sets it automatically with the correct boundary for FormData
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
        body: formData,
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return rejectWithValue(err?.message ?? 'Failed to create attachment')
    }
    return (await res.json()) as Attachment[]
  } catch (error) {
    return rejectWithValue('Failed to create attachment')
  }
})

const attachmentSlice = createSlice({
  name: 'attachment',
  initialState,

  reducers: {
    clearAttachments: (state) => {
      state.attachments = []
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAttachmentAction.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAttachmentAction.fulfilled, (state, action: PayloadAction<Attachment[]>) => {
        state.loading = false
        const attachment = [...state.attachments, ...action.payload]
        state.attachments = attachment
      })
      .addCase(createAttachmentAction.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to create attachment'
      })
  },
})

export const { clearAttachments } = attachmentSlice.actions
export default attachmentSlice.reducer
