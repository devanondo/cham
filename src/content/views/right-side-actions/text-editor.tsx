import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BellIcon, CreditCardIcon, LogOutIcon, PlusIcon, SettingsIcon, UserIcon } from 'lucide-react'
import { useState } from 'react'
const TextEditor = () => {
  const workspaces = [
    {
      id: 1,
      name: 'Workspace 1',
      description: 'Workspace 1 description',
    },

    {
      id: 2,
      name: 'Workspace 2',
      description: 'Workspace 2 description',
    },

    {
      id: 3,
      name: 'Workspace 3',
      description: 'Workspace 3 description',
    },
  ]

  const listItems = [
    {
      icon: UserIcon,
      property: 'Profile',
    },
    {
      icon: SettingsIcon,
      property: 'Settings',
    },
    {
      icon: CreditCardIcon,
      property: 'Billing',
    },
    {
      icon: BellIcon,
      property: 'Notifications',
    },
    {
      icon: LogOutIcon,
      property: 'Sign Out',
    },
  ]

  const [workspace, setWorkspace] = useState<number>(1)

  return (
    <div style={textEditorStyle}>
      <div className="" style={{ flexShrink: 0, flex: 1 }}>
        <div className="flex items-center gap-2 justify-between">
          <Select value={workspace.toString()} onValueChange={(value) => setWorkspace(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={workspaces.find((w) => w.id === workspace)?.name} />
            </SelectTrigger>
            <SelectContent className="bg-white" style={{ zIndex: 2147483648 }}>
              <SelectGroup>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id.toString()}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="overflow-hidden rounded-full">
                <img src="https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png" alt="Hallie Richards" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56 bg-white" style={{ zIndex: 2147483648 }}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuGroup>
                {listItems.map((item, index) => (
                  <DropdownMenuItem key={index}>
                    <item.icon />
                    <span className="text-popover-foreground">{item.property}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div style={{ marginTop: '10px' }}>
          <div className="">
            <textarea placeholder="Issue Title" style={{ ...commonTextAreaStyle, ...textAreaStyle }}></textarea>
          </div>

          <div className="">
            <textarea placeholder="Write a description" rows={3} style={{ ...commonTextAreaStyle }}></textarea>
          </div>
        </div>
      </div>

      {/* bottom actions */}
      <div>
        <button style={buttonStyle}>Create Issue</button>
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
} as const
