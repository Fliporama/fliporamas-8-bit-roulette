import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import '@fontsource/pixelify-sans/latin-400.css'
import '@fontsource/jersey-10/latin-400.css'
import '@fontsource/silkscreen/latin-400.css'
import '../tokens.css'
import './styleguide.css'
import Sprite from '../components/Sprite'
import type { StyleguideOptions } from './options'
import { CHIP_SHADOW, LAMP, RAIL, chip } from './sprites'
import type { ChipValue } from './sprites'

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
const CHIPS: ChipValue[] = [1, 5, 10, 25, 100]
const BUTTON_STATES = ['rest', 'hover', 'pressed', 'disabled']
const SCALES = [1, 2, 4]

// The lit sample, in art pixels.
const FELT = { cols: 96, rows: 44 }
const POOL = { x: 0.5, y: 0.2, reachX: 0.66, reachY: 1.05 } // centre and reach, as fractions of the felt
const BAND = 0.3 // share of each light step given to the dithered band at its edge
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

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

/**
 * Lamp light on felt, one canvas pixel per art pixel. Light falls off in four flat steps of the
 * felt ramp; where two steps meet, an ordered dither blends them. Never a smooth gradient.
 */
function LightPool({ look }: { look: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!canvas.current || !context) return
    const style = getComputedStyle(canvas.current)
    const felt = [0, 1, 2, 3].map((step) => style.getPropertyValue(`--felt-${step}`).trim())
    for (let y = 0; y < FELT.rows; y++) {
      for (let x = 0; x < FELT.cols; x++) {
        const distance = Math.hypot(
          ((x + 0.5) / FELT.cols - POOL.x) / POOL.reachX,
          ((y + 0.5) / FELT.rows - POOL.y) / POOL.reachY,
        )
        const light = Math.max(0, Math.min(2.999, (1 - distance) * 3))
        const step = Math.floor(light)
        // 0 across the flat part of a step, rising to 1 through the band at its bright edge.
        const blend = Math.max(0, (light - step - (1 - BAND)) / BAND)
        const dithered = blend > (BAYER[y % 4][x % 4] + 0.5) / 16
        context.fillStyle = felt[step + (dithered ? 1 : 0)]
        context.fillRect(x, y, 1, 1)
      }
    }
  }, [look])
  return <canvas className="sg-light" ref={canvas} width={FELT.cols} height={FELT.rows} />
}

function ChipStack() {
  return (
    <div className="sg-stack">
      <Sprite className="sg-stack-shadow" data={CHIP_SHADOW} />
      {CHIPS.map((value, index) => (
        <Sprite key={value} className="sg-stack-chip" data={chip(value)} style={{ '--level': index } as CSSProperties} />
      ))}
    </div>
  )
}

/** One small scene drawn with the lighting rules: the proof that the look works in the DOM. */
export function LitSample({ look }: { look: string }) {
  return (
    <div className="sg-lit">
      <Sprite className="sg-lit-lamp" data={LAMP} />
      <div className="sg-lit-rail">
        {Array.from({ length: FELT.cols / RAIL.width }, (_, index) => (
          <Sprite key={index} data={RAIL} />
        ))}
      </div>
      <div className="sg-lit-felt">
        <LightPool look={look} />
        <ChipStack />
      </div>
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

      <Section title="Lit sample">
        <LitSample look={look} />
      </Section>

      <Section title="Components">
        <div className="sg-row">
          {BUTTON_STATES.map((state) => (
            <button key={state} type="button" className={`sg-button is-primary is-${state}`} disabled={state === 'disabled'}>
              {state}
            </button>
          ))}
        </div>
        <div className="sg-row">
          {BUTTON_STATES.map((state) => (
            <button key={state} type="button" className={`sg-button is-${state}`} disabled={state === 'disabled'}>
              {state}
            </button>
          ))}
        </div>
        <div className="sg-row">
          <span className="sg-tile is-red">7</span>
          <span className="sg-tile is-black">8</span>
          <span className="sg-tile is-zero">0</span>
        </div>
        <div className="sg-row sg-felt">
          {CHIPS.map((value) => (
            <Sprite key={value} data={chip(value)} scale={2} />
          ))}
          <div className="sg-stack-stage">
            <ChipStack />
          </div>
        </div>
        <div className="sg-panel">
          <h3>Panel</h3>
          <p>A raised surface: lit along its top edge, with a hard shadow below.</p>
        </div>
      </Section>

      <Section title="Sprites">
        {SCALES.map((scale) => (
          <div className="sg-row" key={scale}>
            <small className="sg-scale">{scale}x</small>
            <Sprite data={LAMP} scale={scale} />
            <Sprite data={RAIL} scale={scale} />
            <Sprite data={chip(25)} scale={scale} />
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
