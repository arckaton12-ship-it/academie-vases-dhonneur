import { useState, useEffect, useCallback, useRef } from 'react'

interface SoundSettings {
  enabled: boolean
  clickVolume: number
  successVolume: number
  errorVolume: number
  notificationVolume: number
}

const DEFAULTS: SoundSettings = {
  enabled: true,
  clickVolume: 0.18,
  successVolume: 0.25,
  errorVolume: 0.2,
  notificationVolume: 0.3,
}

export function useSoundSettings() {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    try {
      const stored = localStorage.getItem('sound_settings')
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
    } catch { return DEFAULTS }
  })

  useEffect(() => {
    localStorage.setItem('sound_settings', JSON.stringify(settings))
  }, [settings])

  const audioCtxRef = useRef<AudioContext | null>(null)
  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }, [])

  const playTone = useCallback((freq: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
    if (!settings.enabled || volume <= 0) return
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.value = volume
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration / 1000)
    } catch {}
  }, [settings.enabled, getCtx])

  const playClick = useCallback(() => playTone(800, 80, settings.clickVolume), [playTone, settings.clickVolume])
  const playSuccess = useCallback(() => {
    playTone(523, 120, settings.successVolume)
    setTimeout(() => playTone(659, 120, settings.successVolume), 120)
    setTimeout(() => playTone(784, 180, settings.successVolume), 240)
  }, [playTone, settings.successVolume])
  const playError = useCallback(() => {
    playTone(200, 250, settings.errorVolume, 'sawtooth')
    setTimeout(() => playTone(150, 300, settings.errorVolume, 'sawtooth'), 150)
  }, [playTone, settings.errorVolume])
  const playNotification = useCallback(() => {
    playTone(880, 100, settings.notificationVolume)
    setTimeout(() => playTone(1175, 150, settings.notificationVolume), 100)
  }, [playTone, settings.notificationVolume])

  return { settings, setSettings, playClick, playSuccess, playError, playNotification }
}
