export type EnergySnapshot = {
  energy: number
  energyMax: number
  regenPerSec: number
  at: number
}

export function regeneratedEnergy(snapshot: EnergySnapshot, now = Date.now()): number {
  const elapsedSec = Math.max(0, Math.floor((now - snapshot.at) / 1000))
  return Math.min(snapshot.energyMax, snapshot.energy + elapsedSec * snapshot.regenPerSec)
}
