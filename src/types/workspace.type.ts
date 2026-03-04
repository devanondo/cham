export interface WorkspaceState {
  workspaces: WorkspaceResponse
  workSpaceDetails: WorkspaceDetailsType | null
  workSpaceBoards: BoardType | null
  workSpaceColumns: WorkspaceColumnType[] | null
  workspaceMembers: WorkspaceMembersResponse | null
  loading: boolean
  error: string | null
}
export interface WorkspaceOwner {
  _id: string
  name: string
  email: string
}

export interface Workspace {
  _id: string
  id: string
  name: string
  url: string
  logo: string
  plan: string
  description?: string
  owner: WorkspaceOwner
  userRole: string
}

export interface WorkspaceResponse {
  myWorkspaces: Workspace[]
  guestWorkspaces: Workspace[]
}

export interface WorkspaceDetailOwner {
  _id: string
  name: string
  email: string
  avatar: string
}

export interface WorkspaceColumn {
  _id: string
  title: string
  type: string
  color: string
  isDefault: boolean
}

export interface WorkspaceNotificationSettings {
  taskUpdates: boolean
  deadlineReminders: boolean
}

export interface WorkspaceSettings {
  notificationSettings: WorkspaceNotificationSettings
  clientDashboardEnabled: boolean
  clientFeedbackEnabled: boolean
}

export interface WorkspaceOnboarding {
  position: string
  teamSize: string
  useCase: string
}

export interface WorkspaceDetailsType {
  _id: string
  id: string
  name: string
  url: string
  logo: string
  plan: string
  status: string
  columnTypes: string[]
  owner: WorkspaceDetailOwner
  labels: string[]
  goalLabels: string[]
  defaultColumns: WorkspaceColumn[]
  settings: WorkspaceSettings
  onboarding: WorkspaceOnboarding
  stripeCustomerId: string
  currentUserRole: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface BoardPhotoUrls {
  raw: string
  full: string
  regular: string
  small: string
  thumb: string
}

export interface BoardPhotoUser {
  name: string
  username: string
  link: string
}

export interface BoardPhoto {
  id: string
  urls: BoardPhotoUrls
  user: BoardPhotoUser
}

export interface BoardBackground {
  _id: string
  type: string
  photo: BoardPhoto
}

export interface BoardMemberUser {
  _id: string
  name: string
  email: string
  username: string
  avatar: string | null
  avatarThumbnail: string | null
}

export interface BoardMember {
  _id: string
  role: string
  user: BoardMemberUser
  joinedAt: string
}

export interface BoardPreferences {
  _id: string
  board: string
  user: string
  view: string
  defaultCardProperties: string[]
  createdAt: string
  updatedAt: string
  __v: number
}

export interface BoardType {
  boards: {
    _id: string
    title: string
    visibility: string
    status: string
    folder: string
    position: number
    displayWorkingQuota: boolean
    background: BoardBackground | null
    members: BoardMember[]
    favorites: string[]
    isMember: boolean
    role: string
    columnCount: number
    joinedAt: string
    createdAt: string
    updatedAt: string
    preferences: BoardPreferences
  }[]
}

export interface WorkspaceColumnType {
  _id: string
  boardId: string
  title: string
  type: string
  color: string
  status: string
  isDefault: boolean
  position: number
  taskIds: string[]
  createdAt: string
  updatedAt: string
  __v: number
}

export interface WorkspaceMemberUser {
  _id: string
  name: string
  email: string
  username: string
  avatar: string | null
  avatarThumbnail: string | null
}

export interface WorkspaceMemberEntry {
  _id: string
  role: string
  title: string
  status: string
  position: string
  efficiency: number
  workspace: string
  user: WorkspaceMemberUser
  lastActive: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface WorkspaceMembersResponse {
  admins: WorkspaceMemberEntry[]
  managers: WorkspaceMemberEntry[]
  members: WorkspaceMemberEntry[]
  guests: WorkspaceMemberEntry[]
  clients: WorkspaceMemberEntry[]
}
