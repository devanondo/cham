import { store } from '@/store'
import { initAuth } from '@/store/slices/authSlice'
import { initWorkspaces } from '@/store/slices/workspaceSlice'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './views/App.tsx'

const container = document.createElement('div')
container.id = 'crxjs-app'
document.body.appendChild(container)

// Hydrate both slices from chrome.storage before rendering
Promise.all([store.dispatch(initAuth()), store.dispatch(initWorkspaces())]).finally(() => {
  createRoot(container).render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>
  )
})
