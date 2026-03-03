export interface UserInfoResponse {
  authProviders: string[]
  role: string
  status: string
  avatar: string
  avatarThumbnail: string
  lastLogin: string
  emailVerified: boolean
  lastActiveWorkspaceURL: string
  jobTitle: string
  department: string
  company: string
  timeZone: string
}
