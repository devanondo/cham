import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { initAuth } from '@/store/slices/authSlice'
import App from './App.tsx'
import './index.css'

store.dispatch(initAuth()).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  )
})
