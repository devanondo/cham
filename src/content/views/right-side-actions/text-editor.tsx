import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BellIcon, CreditCardIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { getWorkspaces } from '@/store/slices/workspaceSlice'
import { logout } from '@/store/slices/authSlice'

const TextEditor = () => {
  const dispatch = useAppDispatch()

  const { access_token, user, userInfo } = useAppSelector((state) => state.auth)
  const { workspaces, loading } = useAppSelector((state) => state.workspace)

  const allWorkspaces = [...(workspaces.myWorkspaces ?? []), ...(workspaces.guestWorkspaces ?? [])]

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')

  useEffect(() => {
    if (access_token) {
      dispatch(getWorkspaces())
    }
  }, [access_token])

  useEffect(() => {
    if (allWorkspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(allWorkspaces[0].id)
    }
  }, [allWorkspaces])

  const selectedWorkspace = allWorkspaces.find((w) => w.id === selectedWorkspaceId)

  const listItems = [
    { icon: UserIcon, property: 'Profile' },
    { icon: SettingsIcon, property: 'Settings' },
    { icon: CreditCardIcon, property: 'Billing' },
    { icon: BellIcon, property: 'Notifications' },
  ]

  return (
    <div style={textEditorStyle}>
      <div style={{ flexShrink: 0, flex: 1 }}>
        {/* Top bar */}
        <div className="flex items-center gap-2 justify-between">
          {/* Workspace selector */}
          <Select
            value={selectedWorkspaceId}
            onValueChange={setSelectedWorkspaceId}
            disabled={loading || allWorkspaces.length === 0}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={loading ? 'Loading...' : 'Select workspace'}>
                {selectedWorkspace?.name ?? (loading ? 'Loading...' : 'Select workspace')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white" style={{ zIndex: 2147483648 }}>
              {workspaces.myWorkspaces.length > 0 && (
                <SelectGroup>
                  <span className="px-2 py-1 text-xs text-muted-foreground font-medium">My Workspaces</span>
                  {workspaces.myWorkspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {workspaces.guestWorkspaces.length > 0 && (
                <SelectGroup>
                  <span className="px-2 py-1 text-xs text-muted-foreground font-medium">Guest Workspaces</span>
                  {workspaces.guestWorkspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="overflow-hidden rounded-full shrink-0">
                <img
                  src={
                    userInfo?.avatarThumbnail ||
                    userInfo?.avatar ||
                    'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png'
                  }
                  alt={user?.name ?? 'User'}
                  className="w-full h-full object-cover"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56 bg-white" style={{ zIndex: 2147483648 }}>
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">{user?.name ?? 'My Account'}</p>
                <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {listItems.map((item) => (
                  <DropdownMenuItem key={item.property}>
                    <item.icon className="mr-2 h-4 w-4" />
                    <span className="text-popover-foreground">{item.property}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => dispatch(logout())} className="text-destructive focus:text-destructive">
                <LogOutIcon className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Issue form */}
        <div style={{ marginTop: '10px' }}>
          <div>
            <textarea placeholder="Issue Title" style={{ ...commonTextAreaStyle, ...textAreaStyle }} />
          </div>
          <div>
            <textarea placeholder="Write a description" rows={3} style={{ ...commonTextAreaStyle }} />
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div>
        <button style={buttonStyle} disabled={!access_token || !selectedWorkspaceId}>
          Create Issue
        </button>
      </div>
    </div>
  )
}

export default TextEditor

const commonTextAreaStyle = {
  resize: 'none',
  width: '100%',
  border: 'none',
  outline: 'none',
  padding: '4px',
  fontWeight: 600,
} as const

const textAreaStyle = {
  fieldSizing: 'content',
  minHeight: '1lh',
  resize: 'none',
  width: '100%',
} as const

const textEditorStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  justifyContent: 'space-between',
  height: '100%',
} as const

const buttonStyle = {
  width: '100%',
  border: 'none',
  outline: 'none',
  padding: '8px',
  fontWeight: 600,
  backgroundColor: 'black',
  borderRadius: '6px',
  color: 'white',
  cursor: 'pointer',
  opacity: 1,
} as const
