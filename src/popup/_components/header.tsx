import { Button } from '@/components/ui/button'
import { MoreHorizontalIcon } from 'lucide-react'

const Header = () => {
  return (
    <div className="flex items-center gap-2 justify-between w-full px-3 py-2">
      <div className="w-8 h-8 flex items-center justify-center">
        <img src="/logo.svg" alt="logo" className="w-full h-full object-contain" />
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <button className="w-6 h-6 border border-transparent hover:border-border flex items-center justify-center p-0.5 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground">
          <MoreHorizontalIcon size={16} />
        </button>
      </div>
    </div>
  )
}

export default Header
