import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// GitHub Pages puede quedar controlado por un Service Worker antiguo (caché vieja / addAll fallando).
// Para evitar que rompa la app, intentamos desregistrar SWs dentro del scope /GANTT/.
if (import.meta.env.PROD && typeof window !== 'undefined') {
  const isGithubPages = window.location.hostname.endsWith('github.io');
  const isGanttPath = window.location.pathname.includes('/GANTT');
  if (isGithubPages && isGanttPath && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) =>
        Promise.all(
          regs
            .filter((r) => r.scope.includes('/GANTT/'))
            .map((r) => r.unregister())
        )
      )
      .catch(() => {
        // noop
      });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
