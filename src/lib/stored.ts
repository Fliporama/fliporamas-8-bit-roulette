/** A setting kept in localStorage. Where storage is missing or blocked it reads as null and simply doesn't persist. */
export function stored(key: string) {
  return {
    get(): string | null {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    /** Null forgets it. */
    set(value: string | null): void {
      try {
        if (value === null) localStorage.removeItem(key)
        else localStorage.setItem(key, value)
      } catch {
        // No storage: see above.
      }
    },
  }
}

/** Whether the system asks for reduced motion. Where it cannot be asked, motion is assumed welcome. */
export function prefersReducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
