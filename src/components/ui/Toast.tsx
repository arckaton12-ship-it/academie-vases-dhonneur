import { useEffect, useState } from 'react'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

let _nextId = 0
let _listeners: ((toasts: ToastItem[]) => void)[] = []
let _toasts: ToastItem[] = []

function notify(msg: string, type: ToastItem['type'] = 'success') {
  const id = ++_nextId
  _toasts = [..._toasts, { id, message: msg, type }]
  _listeners.forEach((fn) => fn(_toasts))
  setTimeout(() => dismiss(id), 3500)
}

function dismiss(id: number) {
  _toasts = _toasts.filter((t) => t.id !== id)
  _listeners.forEach((fn) => fn(_toasts))
}

export function toast(msg: string) { notify(msg, 'success') }
export function toastError(msg: string) { notify(msg, 'error') }
export function toastInfo(msg: string) { notify(msg, 'info') }

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    _listeners.push(setToasts)
    return () => { _listeners = _listeners.filter((fn) => fn !== setToasts) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2" style={{ maxWidth: '360px' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-in-right ${
            t.type === 'success'
              ? 'bg-olive/90 text-white'
              : t.type === 'error'
              ? 'bg-red-600/90 text-white'
              : 'bg-bordeaux/90 text-white'
          }`}
        >
          {t.type === 'success' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          )}
          {t.type === 'error' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          {t.type === 'info' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
    </div>
  )
}
