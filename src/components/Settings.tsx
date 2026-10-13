import { useId } from 'react'
import type { Effects } from '../lib/effects'
import { ICONS } from '../sprites/icons'
import Sprite from './Sprite'

const ON_OFF = [
  { value: true, label: 'On' },
  { value: false, label: 'Off' },
]
const LEVELS: { value: Effects; label: string }[] = [
  { value: 'full', label: 'Full' },
  { value: 'low', label: 'Low' },
  { value: 'off', label: 'Off' },
]

interface ChoiceProps<Value> {
  label: string
  options: readonly { value: Value; label: string }[]
  value: Value
  onChange: (value: Value) => void
}

/** One setting: a name and a button for each thing it can be. */
function Choice<Value extends string | boolean>({ label, options, value, onChange }: ChoiceProps<Value>) {
  const id = useId()
  return (
    <div className="setting">
      <span className="control-label" id={id}>{label}</span>
      <div className="setting-options" role="group" aria-labelledby={id}>
        {options.map((option) => (
          <button
            className={option.value === value ? 'button is-primary' : 'button'}
            type="button"
            aria-pressed={option.value === value}
            key={String(option.value)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface SettingsProps {
  sound: boolean
  onSound: (on: boolean) => void
  scene: boolean
  onScene: (on: boolean) => void
  effects: Effects
  onEffects: (level: Effects) => void
  onReplay: () => void
}

/** The top bar's settings button and the panel it opens: a native popover, so the browser handles Escape and clicking away. */
export default function Settings({ sound, onSound, scene, onScene, effects, onEffects, onReplay }: SettingsProps) {
  const id = useId()
  return (
    <>
      <button className="button icon-action" type="button" title="Settings" aria-label="Settings" popoverTarget={id}>
        <Sprite data={ICONS.gear} />
      </button>
      <div className="settings" id={id} popover="auto" aria-label="Settings">
        <Choice label="SOUND" options={ON_OFF} value={sound} onChange={onSound} />
        <Choice label="ROOM ANIMATION" options={ON_OFF} value={scene} onChange={onScene} />
        <Choice label="SCREEN EFFECTS" options={LEVELS} value={effects} onChange={onEffects} />
        <button className="button" type="button" popoverTarget={id} popoverTargetAction="hide" onClick={onReplay}>Replay intro</button>
      </div>
    </>
  )
}
