export type Attachment = {
  _id: string
  name: string
  type: string
  size: number
  thumbnailUrl: string
  commentUrl: string
  previewUrl: string
  url: string
  dimensions: {
    width: number
    height: number
  }
  uploadedBy: string
  workspace: string
  board: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface AttachmentState {
  attachments: Attachment[]
  loading: boolean
  error: string | null
}
