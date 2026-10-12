import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import '@fontsource/pixelify-sans/latin-400.css'
import '@fontsource/jersey-10/latin-400.css'
import '@fontsource/silkscreen/latin-400.css'
import '../tokens.css'
import './styleguide.css'
import type { StyleguideOptions } from './options'

const RAMPS = [
  { name: 'ink', steps: 3, job: 'outlines, deepest shadow, background' },
  { name: 'felt', steps: 4, job: 'the table, from shadow to lamp-lit' },
  { name: 'wood', steps: 3, job: 'rails, wheel body, panelling' },
  { name: 'brass', steps: 4, job: 'metal, gold, the primary button' },
  { name: 'oxblood', steps: 3, job: 'red pockets, danger, loss' },
  { name: 'smoke', steps: 3, job: 'muted text, haze, disabled' },
  { name: 'paper', steps: 2, job: 'text, the ball, chip faces' },
  { name: 'lamp', steps: 2, job: 'light itself: glow and win flashes' },
]
// The text face has a small x-height: below --type-3 it stops being readable, so it is never set smaller.
const DISPLAY_STEPS = [1, 2, 3, 4, 5]
const TEXT_STEPS = [3, 4, 5]
const SAMPLE = 'FLIPORAMA ROULETTE 0123456789'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sg-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

/** `look` changes whenever the palette or fonts do, so labels read from the page are re-read. */
function Swatch({ token, look }: { token: string; look: string }) {
  const chip = useRef<HTMLDivElement>(null)
  const [hex, setHex] = useState('')
  // Read back from the page, so the label can never disagree with tokens.css.
  useLayoutEffect(() => {
    if (chip.current) setHex(getComputedStyle(chip.current).getPropertyValue(`--${token}`).trim())
  }, [token, look])
  return (
    <div className="sg-swatch">
      <div className="sg-swatch-chip" ref={chip} style={{ background: `var(--${token})` }} />
      <code>--{token}</code>
      <span>{hex}</span>
    </div>
  )
}

function TypeFace({ label, font, steps, look }: { label: string; font: string; steps: number[]; look: string }) {
  const sample = useRef<HTMLParagraphElement>(null)
  const [family, setFamily] = useState('')
  useLayoutEffect(() => {
    if (sample.current) setFamily(getComputedStyle(sample.current).fontFamily.split(',')[0].replaceAll('"', ''))
  }, [font, look])
  return (
    <div className="sg-face">
      <h3>
        {label}: {family}
      </h3>
      {steps.map((step) => (
        <p key={step} ref={step === steps[0] ? sample : undefined} style={{ fontFamily: `var(${font})`, fontSize: `var(--type-${step})` }}>
          <small>--type-{step}</small>
          {SAMPLE}
        </p>
      ))}
    </div>
  )
}

export default function Styleguide({ options }: { options: StyleguideOptions }) {
  const look = `${options.palette}-${options.type}`
  return (
    <main
      className="styleguide"
      data-palette={options.palette}
      data-type={options.type}
      style={{ '--px': `${options.px}px` } as CSSProperties}
    >
      <header className="sg-header">
        <h1>Art bible</h1>
        <p>Fliporama Roulette: a back-room speakeasy, one lamp over the felt. The rules are in docs/art-bible.md.</p>
      </header>

      <Section title="Palette">
        {RAMPS.map((ramp) => (
          <div className="sg-ramp" key={ramp.name}>
            <div className="sg-ramp-label">
              <h3>{ramp.name}</h3>
              <p>{ramp.job}</p>
            </div>
            {Array.from({ length: ramp.steps }, (_, step) => (
              <Swatch key={step} token={`${ramp.name}-${step}`} look={look} />
            ))}
          </div>
        ))}
      </Section>

      <Section title="Type">
        <TypeFace label="Display" font="--font-display" steps={DISPLAY_STEPS} look={look} />
        <TypeFace label="Text" font="--font-text" steps={TEXT_STEPS} look={look} />
      </Section>
    </main>
  )
}
