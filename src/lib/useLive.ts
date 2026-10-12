import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/** True while `on`, the tab is visible and the element is on screen: the only time it is worth animating. */
export function useLive(element: RefObject<Element | null>, on: boolean): boolean {
  const [inView, setInView] = useState(true)
  const [tabShown, setTabShown] = useState(() => !document.hidden)

  useEffect(() => {
    const target = element.current
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(target)
    return () => observer.disconnect()
  }, [element])

  useEffect(() => {
    const update = () => setTabShown(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return on && inView && tabShown
}
