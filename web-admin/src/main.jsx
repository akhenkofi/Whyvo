import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

const BUILD_ID = '2026-04-20-marketplace-pwa-sync-v101'

async function clearClientCaches() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  }

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
  }
}

async function forceFreshClient() {
  try {
    const prev = localStorage.getItem('farmsavior_build_id')
    if (prev !== BUILD_ID) {
      localStorage.setItem('farmsavior_build_id', BUILD_ID)
      await clearClientCaches()
      const url = new URL(window.location.href)
      url.searchParams.set('v', BUILD_ID)
      window.location.replace(url.toString())
      return false
    }
  } catch (err) {
    console.error('Fresh client bootstrap failed:', err)
  }
  return true
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event?.data?.type !== 'FARMSAVIOR_SW_UPDATED') return
    try {
      await clearClientCaches()
      const url = new URL(window.location.href)
      url.searchParams.set('v', BUILD_ID)
      window.location.replace(url.toString())
    } catch (err) {
      console.error('Service worker update sync failed:', err)
    }
  })
}

window.addEventListener('error', async (event) => {
  const message = String(event?.message || '')
  if (!message.includes('Importing a module script failed')) return
  try {
    const recovered = sessionStorage.getItem('farmsavior_module_recovery')
    if (recovered === BUILD_ID) return
    sessionStorage.setItem('farmsavior_module_recovery', BUILD_ID)
    await clearClientCaches()
    const url = new URL(window.location.href)
    url.searchParams.set('v', BUILD_ID)
    window.location.replace(url.toString())
  } catch (err) {
    console.error('Module recovery failed:', err)
  }
})

forceFreshClient().then((okToRender) => {
  if (!okToRender) return
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
