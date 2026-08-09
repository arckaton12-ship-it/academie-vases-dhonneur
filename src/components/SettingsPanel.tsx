import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useSoundSettings } from '@/hooks/useSoundSettings'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { accent, setAccent } = useTheme()
  const { settings, setSettings, playClick, playSuccess } = useSoundSettings()

  const accents = [
    { key: 'bordeaux' as const, label: 'Bordeaux', color: '#A82A2E' },
    { key: 'olive' as const, label: 'Olive', color: '#1B6B63' },
    { key: 'or' as const, label: 'Or', color: '#D4A017' },
  ]

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-sm rounded-2xl border border-pierre/15 bg-white p-6 shadow-xl dark:bg-slate-900 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-bordeaux dark:text-slate-100">Parametres</h3>
          <button onClick={onClose} className="text-pierre hover:text-bordeaux dark:text-slate-400 dark:hover:text-or">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-pierre dark:text-slate-400 uppercase tracking-wider">Couleur d'accent</p>
            <div className="mt-2 flex gap-2">
              {accents.map((a) => (
                <button
                  key={a.key}
                  onClick={() => { setAccent(a.key); playClick() }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    accent === a.key ? 'border-bordeaux scale-110 shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: a.color }}
                  title={a.label}
                >
                  {accent === a.key && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-pierre dark:text-slate-400 uppercase tracking-wider">Sons</p>
              <button
                onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${settings.enabled ? 'bg-olive' : 'bg-pierre/20'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.enabled ? 'left-5.5 translate-x-0' : 'left-0.5'}`} />
              </button>
            </div>
            {settings.enabled && (
              <div className="mt-3 space-y-3">
                {[
                  { key: 'clickVolume' as const, label: 'Click' },
                  { key: 'successVolume' as const, label: 'Succes' },
                  { key: 'errorVolume' as const, label: 'Erreur' },
                  { key: 'notificationVolume' as const, label: 'Notification' },
                ].map((s) => (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="w-20 text-[11px] text-pierre dark:text-slate-400">{s.label}</span>
                    <input
                      type="range"
                      min="0" max="1" step="0.05"
                      value={settings[s.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
                      className="flex-1 accent-or"
                    />
                  </div>
                ))}
                <button
                  onClick={playSuccess}
                  className="text-[11px] text-or hover:underline"
                >
                  Tester le son
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
