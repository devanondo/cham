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

export interface WorkspaceState {
  workspaces: WorkspaceResponse
  loading: boolean
  error: string | null
}
