import { useEffect, useRef } from 'react'
import { artPixel } from '../lib/palette'
import { burst, onEmit, step } from '../lib/particles'
import type { Particle } from '../lib/particles'
import { CHIP_SPRITES } from '../sprites/chips'

const LONGEST_STEP = 0.05 // seconds: after a stall, particles carry on from where they were instead of leaping

/**
 * Everything thrown into the air by `emit`: one canvas over the page, one canvas pixel per art pixel.
 * It draws only while something is flying. `share` thins every burst: see PARTICLE_SHARE.
 */
export default function Particles({ share }: { share: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const target = canvas.current
    const context = target?.getContext('2d')
    if (!target || !context) return
    const px = artPixel(target)
    const style = getComputedStyle(target)
    const colours = new Map<string, string>()
    const colour = (token: string) => {
      let value = colours.get(token)
      if (value === undefined) colours.set(token, (value = style.getPropertyValue(`--${token}`).trim()))
      return value
    }
    let flying: Particle[] = []
    let frame = 0
    let last = 0

    // Whole art pixels only, so the canvas scales by exactly --px; a sliver at the right and bottom goes uncovered.
    const fit = () => {
      target.width = Math.floor(window.innerWidth / px)
      target.height = Math.floor(window.innerHeight / px)
      target.style.width = `${target.width * px}px`
      target.style.height = `${target.height * px}px`
    }
    const draw = (now: number) => {
      frame = 0
      flying = step(flying, Math.min(LONGEST_STEP, (now - last) / 1000), target.height)
      last = now
      context.clearRect(0, 0, target.width, target.height)
      for (const particle of flying) {
        const x = Math.round(particle.x)
        const y = Math.round(particle.y)
        if (particle.chip === undefined) {
          context.fillStyle = colour(particle.token)
          context.fillRect(x, y, particle.size, particle.size)
          continue
        }
        const chip = CHIP_SPRITES[particle.chip]
        for (const rect of chip.rects) {
          context.fillStyle = colour(rect.token)
          context.fillRect(x - Math.floor(chip.width / 2) + rect.x, y - Math.floor(chip.height / 2) + rect.y, rect.width, 1)
        }
      }
      if (flying.length > 0) frame = requestAnimationFrame(draw)
    }
    const stop = onEmit((kind, x, y) => {
      flying.push(...burst(kind, x / px, y / px, share))
      if (frame === 0 && flying.length > 0) {
        last = performance.now()
        frame = requestAnimationFrame(draw)
      }
    })

    fit()
    window.addEventListener('resize', fit)
    return () => {
      stop()
      window.removeEventListener('resize', fit)
      cancelAnimationFrame(frame)
      context.clearRect(0, 0, target.width, target.height)
    }
  }, [share])

  return <canvas className="particles" ref={canvas} aria-hidden="true" />
}
