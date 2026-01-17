import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import MobileTracker from './MobileTracker.tsx'

// Simple routing based on URL path
const path = window.location.pathname

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {path === '/mobile' || path === '/mobile/' ? <MobileTracker /> : <App />}
  </StrictMode>,
)
