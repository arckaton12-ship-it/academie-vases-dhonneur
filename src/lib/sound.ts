const STORAGE_KEY = 'vh-sound'

let soundEnabled =
  typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) !== 'false'

let audioCtx: AudioContext | null = null

export function isSoundEnabled(): boolean {
  return soundEnabled
}

export function setSoundEnabled(value: boolean): void {
  soundEnabled = value
  window.localStorage.setItem(STORAGE_KEY, String(value))
}

export function toggleSound(): boolean {
  setSoundEnabled(!soundEnabled)
  return soundEnabled
}

function getCtx(): AudioContext | null {
  if (!soundEnabled) return null
  if (audioCtx) return audioCtx
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  audioCtx = new Ctor()
  return audioCtx
}

function tone(frequency: number, delay = 0, duration = 0.12, volume = 0.05): void {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  osc.connect(gain)
  gain.connect(ctx.destination)
  const t = ctx.currentTime + delay
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

export function playClick(): void {
  tone(880, 0, 0.07, 0.03)
}

export function playSuccess(): void {
  tone(660, 0, 0.12)
  tone(880, 0.08, 0.12)
  tone(1100, 0.16, 0.18)
}
