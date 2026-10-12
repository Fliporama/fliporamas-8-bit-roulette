import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import './styleguide.css'
import Sprite from '../components/Sprite'
import { CHIP_VALUES } from '../lib/chips'
import { CHIP_SHADOW, CHIP_SPRITES } from '../sprites/chips'
import { ICONS } from '../sprites/icons'
import { RAIL } from '../sprites/table'
import { LAMP } from './sprites'

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

function Swatch({ token }: { token: string }) {
  const chip = useRef<HTMLDivElement>(null)
  const [hex, setHex] = useState('')
  // Read back from the page, so the label can never disagree with tokens.css.
  useLayoutEffect(() => {
    if (chip.current) setHex(getComputedStyle(chip.current).getPropertyValue(`--${token}`).trim())
  }, [token])
  return (
    <div className="sg-swatch">
      <div className="sg-swatch-chip" ref={chip} style={{ background: `var(--${token})` }} />
      <code>--{token}</code>
      <span>{hex}</span>
    </div>
  )
}

function TypeFace({ label, font, steps }: { label: string; font: string; steps: number[] }) {
  const sample = useRef<HTMLParagraphElement>(null)
  const [family, setFamily] = useState('')
  useLayoutEffect(() => {
    if (sample.current) setFamily(getComputedStyle(sample.current).fontFamily.split(',')[0].replaceAll('"', ''))
  }, [font])
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
function LightPool() {
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
  }, [])
  return <canvas className="sg-light" ref={canvas} width={FELT.cols} height={FELT.rows} />
}

function ChipStack() {
  return (
    <div className="sg-stack">
      <Sprite className="sg-stack-shadow" data={CHIP_SHADOW} />
      {CHIP_VALUES.map((value, index) => (
        <Sprite key={value} className="sg-stack-chip" data={CHIP_SPRITES[value]} style={{ '--level': index } as CSSProperties} />
      ))}
    </div>
  )
}

/** One small scene drawn with the lighting rules: the proof that the look works in the DOM. */
function LitSample() {
  return (
    <div className="sg-lit">
      <Sprite className="sg-lit-lamp" data={LAMP} />
      <div className="sg-lit-rail">
        {Array.from({ length: FELT.cols / RAIL.width }, (_, index) => (
          <Sprite key={index} data={RAIL} />
        ))}
      </div>
      <div className="sg-lit-felt">
        <LightPool />
        <ChipStack />
      </div>
    </div>
  )
}

export default function Styleguide() {
  return (
    <main className="styleguide">
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
              <Swatch key={step} token={`${ramp.name}-${step}`} />
            ))}
          </div>
        ))}
      </Section>

      <Section title="Lit sample">
        <LitSample />
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
          {CHIP_VALUES.map((value) => (
            <Sprite key={value} data={CHIP_SPRITES[value]} scale={2} />
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
            <Sprite data={CHIP_SPRITES[25]} scale={scale} />
          </div>
        ))}
        <div className="sg-row sg-icons">
          {Object.entries(ICONS).map(([name, icon]) => (
            <Sprite key={name} data={icon} scale={2} />
          ))}
        </div>
      </Section>

      <Section title="Type">
        <TypeFace label="Display" font="--font-display" steps={DISPLAY_STEPS} />
        <TypeFace label="Text" font="--font-text" steps={TEXT_STEPS} />
      </Section>
    </main>
  )
}
