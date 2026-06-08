export function formatCount(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString('en-US')
}
