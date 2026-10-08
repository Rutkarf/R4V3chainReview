/** Hex CSS → couleur Three.js (0xRRGGBB). */
export function hexToThree(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}
