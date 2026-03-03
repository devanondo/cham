import { UserIcon, SettingsIcon, BellIcon, LogOutIcon, CreditCardIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppSelector } from '@/store'

const Header = () => {
  const { userInfo } = useAppSelector((state) => state.auth)

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

  return (
    <div className="flex items-center justify-between w-full py-1">
      <div className="w-10 h-10 flex items-center justify-center">
        <img src="/logo.svg" alt="logo" className="w-full h-full object-contain" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="overflow-hidden rounded-full">
            <img
              src={userInfo?.avatar || 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png'}
              alt="Hallie Richards"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
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
  )
}

export default Header
