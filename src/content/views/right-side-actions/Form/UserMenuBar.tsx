import { useEffect, useRef, useState } from 'react'
import { LogOutIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface UserMenuItem {
  icon: LucideIcon
  label: string
  onClick?: () => void
}

interface UserMenuBarProps {
  userName?: string
  userEmail?: string
  avatar?: string | null
  avatarThumbnail?: string | null
  menuItems?: UserMenuItem[]
  onSignOut: () => void
}

const UserMenuBar = ({ userName, userEmail, avatar, avatarThumbnail, menuItems = [], onSignOut }: UserMenuBarProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const avatarSrc = avatarThumbnail || avatar || 'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #e2e8f0',
          padding: 0,
          cursor: 'pointer',
          background: 'none',
          outline: 'none',
          flexShrink: 0,
        }}
      >
        <img src={avatarSrc} alt={userName ?? 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: '220px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 2147483648,
            overflow: 'hidden',
          }}
        >
          {/* User info header */}
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{userName ?? 'My Account'}</p>
            {userEmail && (
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '11px',
                  color: '#94a3b8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userEmail}
              </p>
            )}
          </div>

          {/* Menu items */}
          {menuItems.length > 0 && (
            <>
              <div style={{ padding: '4px 0' }}>
                {menuItems.map((item) => (
                  <MenuItem key={item.label} item={item} onClose={() => setOpen(false)} />
                ))}
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9' }} />
            </>
          )}

          {/* Sign out */}
          <div style={{ padding: '4px 0' }}>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#ef4444',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#fff5f5')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
            >
              <LogOutIcon size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const MenuItem = ({ item, onClose }: { item: UserMenuItem; onClose: () => void }) => (
  <button
    type="button"
    onClick={() => {
      onClose()
      item.onClick?.()
    }}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 14px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#0f172a',
      textAlign: 'left',
    }}
    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#f8fafc')}
    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
  >
    <item.icon size={14} color="#64748b" />
    {item.label}
  </button>
)

export default UserMenuBar
