import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme/colors.css'
import App from './App.tsx'
import { AuthGate } from './auth/AuthGate'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate surface="app">
      <App />
    </AuthGate>
  </StrictMode>,
)
