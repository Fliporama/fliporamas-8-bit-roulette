import { useEffect, useRef, useState } from 'react'
import { artPixel, paletteOf } from '../lib/palette'
import { STRUGGLE_GAPS, lampGlow, struggling, vignetteBoost } from '../lib/screen'

const GRAIN_MS = 83 // twelve frames of grain a second: cheap, and the stutter suits the pixels
const SCANLINE = 0.14 // darkness of the one screen row in each art pixel
const GRAIN = 0.07 // the most an art pixel is darkened by grain
const VIGNETTE = { from: 0.7, steps: 3, step: 0.1 } // where the corners start to darken, in how many bands, and each band's darkness
const CORNER = 8 // art pixels: the radius of the tube's rounded corners
const GLOW = { steps: 3, light: 0.5 } // bands of light round an emitter, and the share of the lamp's colour added at full strength
const LAMP = { radius: 44, bulbUp: 6 } // art pixels: the reach of the lamp's glow, and how far above the sprite's foot the bulb is
const BANNER = { radius: 56, strength: 0.3 } // the win banner's glow
const SPLIT = { near: 1, far: 2 } // art pixels red and blue are pulled apart on a big win, and on a huge one

const VERTEX = `
attribute vec2 corner;
void main() {
  gl_Position = vec4(corner, 0.0, 1.0);
}`

// The layer can only add darkness (ink, by alpha) and add light (lamp, with no alpha): it cannot see the page beneath.
// Everything but the scanlines is worked out per art pixel, in flat bands joined by ordered dither, as the art bible asks.
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 size;
uniform float px;
uniform float tick;
uniform float boost;
uniform vec3 ink;
uniform vec3 lamp;
uniform vec4 glow[2];

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

// A scramble with no pattern the eye can follow, unlike the usual one built on a sine.
float scramble(vec2 p) {
  vec3 mixed = fract(vec3(p.xyx) * 0.1031);
  mixed += dot(mixed, mixed.yzx + 33.33);
  return fract((mixed.x + mixed.y) * mixed.z);
}

float dither(vec2 cell) {
  return bayer2(0.5 * cell) * 0.25 + bayer2(cell);
}

void main() {
  vec2 at = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y);
  vec2 cell = floor(at / px);
  vec2 centre = (cell + 0.5) * px;
  float threshold = dither(cell) - 0.5;

  vec2 fromCorner = abs(centre - size / 2.0) - (size / 2.0 - ${CORNER.toFixed(1)} * px);
  if (length(max(fromCorner, 0.0)) > ${CORNER.toFixed(1)} * px) {
    gl_FragColor = vec4(ink, 1.0);
    return;
  }

  float dark = mod(at.y, px) >= px - 1.0 ? ${SCANLINE.toFixed(3)} : 0.0;
  if (tick > 0.0) dark += ${GRAIN.toFixed(3)} * scramble(cell + tick * vec2(37.0, 17.0));

  // Bowed like a tube's face: darkest in the corners, clear along the middle of each edge.
  vec2 uv = centre / size * 2.0 - 1.0;
  float edge = (length(uv * uv) - ${VIGNETTE.from.toFixed(2)}) / (1.0 - ${VIGNETTE.from.toFixed(2)});
  float band = clamp(floor(edge * ${VIGNETTE.steps.toFixed(1)} + threshold + 0.5), 0.0, ${VIGNETTE.steps.toFixed(1)});
  dark += band * ${VIGNETTE.step.toFixed(3)} * (1.0 + boost);

  float light = 0.0;
  for (int which = 0; which < 2; which++) {
    float closeness = 1.0 - distance(centre, glow[which].xy) / (glow[which].z * px);
    light += clamp(floor(closeness * ${GLOW.steps.toFixed(1)} + threshold + 0.5), 0.0, ${GLOW.steps.toFixed(1)}) / ${GLOW.steps.toFixed(1)} * glow[which].w;
  }

  dark = min(dark, 1.0);
  gl_FragColor = vec4(ink * dark + lamp * light * ${GLOW.light.toFixed(2)}, dark);
}`

function program(gl: WebGLRenderingContext): WebGLProgram | undefined {
  const made = gl.createProgram()
  for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]] as const) {
    const shader = gl.createShader(type)
    if (!shader) return
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    gl.attachShader(made, shader)
  }
  gl.linkProgram(made)
  return gl.getProgramParameter(made, gl.LINK_STATUS) ? made : undefined
}

/** The middle of the first element matching `selector`, `up` art pixels above its foot, or far off screen if there is none. */
function spot(selector: string, up: number): [number, number] {
  const box = document.querySelector(selector)?.getBoundingClientRect()
  return box ? [box.left + box.width / 2, box.bottom - up] : [-1e5, -1e5]
}

const ONLY = {
  red: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  green: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  blue: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
}

/** A filter that slides the red of whatever it is put on `by` pixels left and the blue as far right. See `split` in game.css. */
function Split({ id, by }: { id: string; by: number }) {
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values={ONLY.red} />
      <feOffset dx={-by} result="red" />
      <feColorMatrix in="SourceGraphic" type="matrix" values={ONLY.blue} />
      <feOffset dx={by} result="blue" />
      <feColorMatrix in="SourceGraphic" type="matrix" values={ONLY.green} />
      <feBlend in2="red" mode="screen" />
      <feBlend in2="blue" mode="screen" />
    </filter>
  )
}

interface ScreenEffectsProps {
  /** The room's light, in light steps: see useRoomLight. */
  light: number
  /** Whether the grain moves. Still, the layer is redrawn only when something changes. */
  moving: boolean
  /** Called when the moving layer cannot keep its own pace: see `struggling`. */
  onStruggle: () => void
}

/**
 * The cathode-ray tube the game is seen through: scanlines, grain, rounded corners, a vignette that deepens
 * when the room dims, and lamp light added round the bulb and the win banner. One WebGL canvas over the page.
 * Without WebGL there is simply no layer.
 */
export default function ScreenEffects({ light, moving, onStruggle }: ScreenEffectsProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [px] = useState(() => artPixel(document.documentElement))
  const redraw = useRef(() => {})
  const latest = useRef({ light, onStruggle })
  useEffect(() => {
    latest.current = { light, onStruggle }
  })
  // The light changes with the game: the lamp's glow and the vignette follow it, and the win banner comes and goes with it.
  useEffect(() => redraw.current(), [light])

  useEffect(() => {
    const target = canvas.current
    // ponytail: a lost WebGL context is not restored; the layer stays blank until the page is reloaded.
    const gl = target?.getContext('webgl', { antialias: false, premultipliedAlpha: true })
    const made = gl && program(gl)
    if (!target || !gl || !made) return
    const px = artPixel(target)
    const palette = paletteOf(target, ['ink-0', 'lamp-0'])
    const uniform = (name: string) => gl.getUniformLocation(made, name)

    gl.useProgram(made)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW) // one triangle that covers the screen
    const corner = gl.getAttribLocation(made, 'corner')
    gl.enableVertexAttribArray(corner)
    gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0)
    gl.uniform1f(uniform('px'), px)
    gl.uniform3fv(uniform('ink'), palette['ink-0'].map((part) => part / 255))
    gl.uniform3fv(uniform('lamp'), palette['lamp-0'].map((part) => part / 255))

    let tick = 0
    let scheduled = 0
    const draw = () => {
      scheduled = 0
      // One canvas pixel per CSS pixel whatever the screen's density: a scanline is one CSS pixel tall.
      if (target.width !== target.clientWidth || target.height !== target.clientHeight) {
        target.width = target.clientWidth
        target.height = target.clientHeight
        gl.viewport(0, 0, target.width, target.height)
      }
      const banner = document.querySelector('.tally-banner') ? BANNER.strength : 0
      gl.uniform2f(uniform('size'), target.width, target.height)
      gl.uniform1f(uniform('tick'), moving ? tick : 0)
      gl.uniform1f(uniform('boost'), vignetteBoost(latest.current.light))
      gl.uniform4fv(uniform('glow[0]'), [
        ...spot('.scene-lamp', LAMP.bulbUp * px), LAMP.radius, lampGlow(latest.current.light),
        ...spot('.tally-banner', 0), BANNER.radius, banner,
      ])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    // Scrolling and resizing move the lamp under the layer: redrawn once a frame at most.
    const soon = () => {
      scheduled ||= requestAnimationFrame(draw)
    }
    redraw.current = soon

    const gaps: number[] = []
    let last = 0
    let timer = 0
    const run = () => {
      window.clearInterval(timer)
      last = 0
      if (!moving || document.hidden) return
      timer = window.setInterval(() => {
        const now = performance.now()
        if (last > 0) gaps.push(now - last)
        last = now
        if (gaps.length > STRUGGLE_GAPS) gaps.shift()
        if (struggling(gaps, GRAIN_MS)) latest.current.onStruggle()
        tick = (tick % 240) + 1
        draw()
      }, GRAIN_MS)
    }

    draw()
    run()
    window.addEventListener('resize', soon)
    window.addEventListener('scroll', soon, { passive: true })
    document.addEventListener('visibilitychange', run)
    return () => {
      redraw.current = () => {}
      window.clearInterval(timer)
      cancelAnimationFrame(scheduled)
      window.removeEventListener('resize', soon)
      window.removeEventListener('scroll', soon)
      document.removeEventListener('visibilitychange', run)
    }
  }, [moving])

  return (
    <>
      <canvas className="screen-effects" ref={canvas} aria-hidden="true" />
      <svg className="screen-filters" aria-hidden="true">
        <Split id="split-near" by={SPLIT.near * px} />
        <Split id="split-far" by={SPLIT.far * px} />
      </svg>
    </>
  )
}
