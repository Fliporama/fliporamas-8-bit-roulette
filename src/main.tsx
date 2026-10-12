import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/press-start-2p/latin-400.css'
import '@fontsource/vt323/latin-400.css'
import './game.css'
import App from './App.tsx'
import { styleguideOptions } from './styleguide/options'

const root = createRoot(document.getElementById('root')!)
const styleguide = styleguideOptions(location.search)

if (styleguide) {
  // A hidden page at /?styleguide, loaded on demand so the game stays the same size.
  const { default: Styleguide } = await import('./styleguide/Styleguide')
  root.render(
    <StrictMode>
      <Styleguide options={styleguide} />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
