import { Button } from '@/components/ui/button'
import './App.css'
import Header from './_components/header'
import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAppDispatch, useAppSelector } from '@/store'
import { login, logout, getUserInfo } from '@/store/slices/authSlice'
import { UserInfoResponse } from '@/types/auth.type'

export default function App() {
  const dispatch = useAppDispatch()
  const { isLoggedIn, loading: isLoading, error, access_token, userInfo } = useAppSelector((state) => state.auth)

  const handleCapture = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id
      if (!activeTabId) return

      chrome.tabs.sendMessage(activeTabId, {
        type: 'START_AREA_SELECTION',
        access_token: access_token as string,
        userInfo: userInfo as UserInfoResponse,
      })
    })

    window.close()
  }

  const [email, setEmail] = useState('priantibanik@gmail.com')
  const [password, setPassword] = useState('123456789Aa@')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    const result = await dispatch(login({ email, password }))
    console.log('🚀 ~ handleLogin ~ result:', result)
    if (result?.payload?.access_token) {
      dispatch(getUserInfo())
    }
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(getUserInfo())
    }
  }, [])

  return (
    <div className="p-3 min-w-[320px] h-[400px]">
      {isLoggedIn ? (
        <div className="rounded-md border p-4 w-full flex flex-col items-center gap-3 h-full justify-between">
          <Header />

          <div className="flex flex-col gap-3 w-full">
            <p className="text-sm text-muted-foreground font-medium text-center">
              Capture the visible tab and create an issue
            </p>

            <Button type="button" onClick={handleCapture} className="w-full">
              Capture visible tab
            </Button>

            <Button type="button" variant="outline" onClick={handleLogout} className="w-full">
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border p-4 w-full flex flex-col items-center gap-3">
          <Header />

          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">Welcome to TaskGrid</h1>
            <p className="text-sm text-muted-foreground">Please login to continue</p>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs hover:bg-accent transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="#EA4335"
                d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.1-6.1C34.46 3.05 29.52 1 24 1 14.82 1 7.01 6.48 3.58 14.18l7.13 5.54C12.4 13.67 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v8.99h12.64c-.55 2.96-2.2 5.47-4.68 7.16l7.18 5.58C43.25 37.27 46.52 31.35 46.52 24.5z"
              />
              <path
                fill="#FBBC05"
                d="M10.71 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.71-4.28L3.08 14.18A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.58 10.75l8.13-6.47z"
              />
              <path
                fill="#34A853"
                d="M24 47c5.52 0 10.16-1.83 13.55-4.97l-7.18-5.58c-1.83 1.23-4.17 1.95-6.37 1.95-6.26 0-11.6-4.17-13.29-9.84l-8.13 6.47C7.01 41.52 14.82 47 24 47z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center w-full gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email input */}
          <Input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pb-2 font-medium text-foreground placeholder:text-muted-foreground"
          />

          {/* Password input */}
          <div className="relative w-full">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pb-2 font-medium text-muted-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          {error && <p className="text-xs text-destructive text-center w-full">{error}</p>}

          {/* Login button */}
          <Button type="button" onClick={handleLogin} disabled={isLoading} className="w-full">
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      )}
    </div>
  )
}
