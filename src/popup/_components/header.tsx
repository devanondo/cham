import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/store'

const Header = () => {
  const { user, userInfo } = useAppSelector((state) => state.auth)

  return (
    <div className="flex items-center justify-between w-full py-1">
      <div className="w-10 h-10 flex items-center justify-center">
        <img src="/logo.svg" alt="logo" className="w-full h-full object-contain" />
      </div>

      <Button variant="secondary" size="icon" className="overflow-hidden rounded-full">
        <img
          src={
            userInfo?.avatarThumbnail || user?.avatar || 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png'
          }
          alt="Hallie Richards"
        />
      </Button>
    </div>
  )
}

export default Header
