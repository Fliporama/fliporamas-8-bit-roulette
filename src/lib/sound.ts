import { stored } from './stored'

type SoundName = 'ballClick' | 'chip' | 'tick' | 'win' | 'bigWin' | 'loss'

const STORE = stored('fliporama-muted')
const GAIN = 0.06
const NOTES: Record<Exclude<SoundName, 'tick'>, { frequencies: number[]; ms: number }> = {
  ballClick: { frequencies: [1200], ms: 25 },
  chip: { frequencies: [620, 410], ms: 18 },
  win: { frequencies: [523, 659], ms: 90 },
  bigWin: { frequencies: [523, 659, 784, 1047], ms: 90 },
  loss: { frequencies: [196, 147], ms: 140 },
}

let muted = STORE.get() === '1'

let context: AudioContext | undefined

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  STORE.set(value ? '1' : '0')
}

/** One semitone up per tally step, capped an octave above A4. */
export function tickFrequency(step: number): number {
  return 440 * 2 ** (Math.min(step, 12) / 12)
}

export function play(name: SoundName, step = 0): void {
  if (muted || typeof AudioContext === 'undefined') return
  const audio = (context ??= new AudioContext())
  void audio.resume()

  const { frequencies, ms } =
    name === 'tick' ? { frequencies: [tickFrequency(step)], ms: 70 } : NOTES[name]
  frequencies.forEach((frequency, index) => {
    const start = audio.currentTime + (index * ms) / 1000
    const end = start + ms / 1000
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'square'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(GAIN, start)
    gain.gain.linearRampToValueAtTime(0, end)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(start)
    oscillator.stop(end)
  })
}
