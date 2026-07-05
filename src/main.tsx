import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/service-worker.js')
  })
}

if ('serviceWorker' in navigator && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const resetKey = 'memoring-dev-service-worker-reset'
    const hadController = Boolean(navigator.serviceWorker.controller)

    void Promise.all([
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister())
      }),
      'caches' in window
        ? caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('memoring-cache')).map((key) => caches.delete(key))))
        : Promise.resolve([]),
    ]).then(() => {
      if (hadController && sessionStorage.getItem(resetKey) !== 'done') {
        sessionStorage.setItem(resetKey, 'done')
        window.location.reload()
      }
    })
  })
}
