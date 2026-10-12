import { describe, expect, it } from 'vitest'
import { styleguideHref, styleguideOptions } from './options'

describe('styleguideOptions', () => {
  it('is off unless the styleguide parameter is present', () => {
    expect(styleguideOptions('')).toBeUndefined()
    expect(styleguideOptions('?palette=b')).toBeUndefined()
  })

  it('opens with defaults however the parameter is written', () => {
    const defaults = { palette: 'a', px: 3, type: 1 }
    expect(styleguideOptions('?styleguide')).toEqual(defaults)
    expect(styleguideOptions('?styleguide=1')).toEqual(defaults)
    expect(styleguideOptions('?x=y&styleguide')).toEqual(defaults)
  })

  it('reads valid choices and ignores invalid ones', () => {
    expect(styleguideOptions('?styleguide&palette=b&px=4&type=3')).toEqual({ palette: 'b', px: 4, type: 3 })
    expect(styleguideOptions('?styleguide&palette=z&px=99&type=')).toEqual({ palette: 'a', px: 3, type: 1 })
  })

  it('round-trips through a link', () => {
    const options = { palette: 'b', px: 2, type: 3 } as const
    expect(styleguideOptions(styleguideHref(options))).toEqual(options)
  })
})
