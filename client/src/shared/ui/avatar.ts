function hueFromSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return (h * 137) % 360
}

export function avatarColor(seed: string): string {
  return `hsl(${hueFromSeed(seed)} 58% 52%)`
}

export function avatarGradient(seed: string): string {
  const a = hueFromSeed(seed)
  const b = (a + 40) % 360
  return `linear-gradient(135deg, hsl(${a} 70% 62%), hsl(${b} 65% 42%))`
}

export function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase()
}
