import { useEffect, useRef } from 'react'

const SKIP_KEYS = new Set([' ', 'Enter', 'Escape'])

/** While mounted, calls the handler on any click, or on Space, Enter or Escape. */
export function useSkip(handler: () => void): void {
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })

  useEffect(() => {
    const onPointer = () => latest.current()
    // Held-down repeats are ignored so the key press that starts a spin cannot also skip it.
    const onKey = (event: KeyboardEvent) => {
      if (!event.repeat && SKIP_KEYS.has(event.key)) latest.current()
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
}
