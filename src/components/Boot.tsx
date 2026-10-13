import { useEffect, useRef, useState } from 'react'
import { useSkip } from '../lib/useSkip'

const BLACK_MS = 300 // nothing
const LINE_MS = 250 // the line snaps across
const OPEN_MS = 400 // it opens to full height, in OPEN_STEPS hard steps
const FLICKER_MS = 120
const CHECK_MS = 1200 // FLIPORAMA and the row of blocks filling, CHECK_BLOCKS of them
const CHECK_BLOCKS = 8
// about 2.5 s in all, as the spec asks

const PHASES = [
  ['black', BLACK_MS],
  ['line', LINE_MS],
  ['open', OPEN_MS],
  ['flicker', FLICKER_MS],
  ['check', CHECK_MS],
] as const

type BootPhase = (typeof PHASES)[number][0]

// App mounts this only on a first visit without reduced motion, so it has no reduced-motion path of its own.
export default function Boot({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<BootPhase>('black')
  useSkip(onDone)
  const latest = useRef(onDone)
  useEffect(() => {
    latest.current = onDone
  })

  useEffect(() => {
    const index = PHASES.findIndex(([name]) => name === phase)
    const timer = setTimeout(() => {
      if (index === PHASES.length - 1) latest.current()
      else setPhase(PHASES[index + 1][0])
    }, PHASES[index][1])
    return () => clearTimeout(timer)
  }, [phase])

  return (
    <div className="boot" data-phase={phase} aria-hidden="true">
      {phase === 'check' && (
        <>
          <p className="boot-name">FLIPORAMA</p>
          <div className="boot-blocks">
            {Array.from({ length: CHECK_BLOCKS }, (_, index) => (
              <i key={index} style={{ animationDelay: `${(index * CHECK_MS) / CHECK_BLOCKS}ms` }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
