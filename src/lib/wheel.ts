// European single-zero wheel, clockwise from zero.
export const WHEEL_ORDER: readonly number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]

export const POCKET_ARC = 360 / WHEEL_ORDER.length

/** Degrees clockwise from the top of the wheel to the centre of a pocket. */
export function pocketAngle(number: number): number {
  return WHEEL_ORDER.indexOf(number) * POCKET_ARC
}
