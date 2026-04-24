import React from 'react'
import { renderToString } from 'react-dom/server'

function installStubs() {
  globalThis.window = {
    location: { search: '', href: 'https://www.farmsavior.com', hash: '' },
    addEventListener() {}, removeEventListener() {},
    open() {}, print() {},
  }
  globalThis.document = {
    createElement() {
      return {
        getContext() { return { clearRect(){}, drawImage(){} } },
        toDataURL() { return 'data:image/jpeg;base64,x' }
      }
    },
    querySelectorAll() { return [] },
  }
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem(){ return null }, setItem(){}, removeItem(){} }, configurable: true })
  globalThis.alert = () => {}
  class FR { readAsDataURL(){ if (this.onload) this.onload({}) } }
  globalThis.FileReader = FR
  class Img { set src(v){ if (this.onload) this.onload() } }
  globalThis.Image = Img
}

async function main() {
  installStubs()
  const mod = await import('./src/App.jsx')
  const App = mod.default
  const html = renderToString(React.createElement(App))
  if (!html || html.length < 100) {
    throw new Error('Smoke render produced empty output')
  }
  console.log('Smoke render OK:', html.slice(0, 120).replace(/\s+/g, ' '))
}

main().catch((err) => {
  console.error('Smoke render failed:', err)
  process.exit(1)
})
