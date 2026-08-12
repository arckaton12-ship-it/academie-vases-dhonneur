import { useCallback, useEffect, useRef, useState } from 'react'
import { MascotCompanion, MascotMood } from './MascotCompanion'
import { FlameBurst } from './FlameBurst'
import { playFlameSpeak } from '@/lib/sound'

const MOOD_MESSAGES: Record<MascotMood, string[]> = {
  happy: ['Je suis content !', 'On continue !', 'Bon travail !'],
  proud: ['Fier de toi !', 'Continue comme ça !', 'Tu es le meilleur !'],
  attentive: ['Je t\'écoute.', 'Dis-moi.', 'Je suis là.'],
  welcoming: ['Salut !', 'Bienvenue !', 'Ravi de te voir !'],
}

interface FloatingMascotProps {
  mood?: MascotMood
}

export function FloatingMascot({ mood = 'happy' }: FloatingMascotProps) {
  const [visible, setVisible] = useState(true)
  const [showMessage, setShowMessage] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [isBursting, setIsBursting] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAllTimers = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current)
  }, [])

  const startCycle = useCallback(() => {
    clearAllTimers()
    hideTimerRef.current = setTimeout(() => {
      setExiting(true)
      setTimeout(() => {
        setVisible(false)
        setExiting(false)
        showTimerRef.current = setTimeout(() => {
          setVisible(true)
          startCycle()
        }, 12000)
      }, 300)
    }, 8000)
  }, [clearAllTimers])

  useEffect(() => {
    startCycle()
    return clearAllTimers
  }, [startCycle, clearAllTimers])

  const handleTouch = useCallback(() => {
    clearAllTimers()
    const messages = MOOD_MESSAGES[mood] || MOOD_MESSAGES.happy
    const msg = messages[Math.floor(Math.random() * messages.length)]
    setCurrentMessage(msg)
    setShowMessage(true)
    playFlameSpeak()

    messageTimerRef.current = setTimeout(() => {
      setShowMessage(false)
      setIsBursting(true)
    }, 1500)
  }, [clearAllTimers, mood])

  const handleBurstComplete = useCallback(() => {
    setIsBursting(false)
    startCycle()
  }, [startCycle])

  const size = isExpanded ? 80 : 60

  return (
    <>
      {isBursting && <FlameBurst onComplete={handleBurstComplete} />}

      {visible && (
        <div
          className={`fixed bottom-20 right-3 z-50 transition-all duration-300 ${
            exiting ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
          onClick={handleTouch}
          onTouchStart={handleTouch}
          onMouseEnter={() => {
            clearAllTimers()
            setIsExpanded(true)
          }}
          onMouseLeave={() => {
            setIsExpanded(false)
            startCycle()
          }}
          role="button"
          tabIndex={0}
          aria-label="Flamme compagnon — touche pour interagir"
        >
          {showMessage && (
            <div className="absolute bottom-full right-0 z-50 mb-2 w-48">
              <div className="relative rounded-xl border border-sable/60 bg-white px-3 py-2 text-xs leading-snug text-bordeaux shadow-lg dark:bg-slate-800 dark:text-slate-200 dark:border-white/10">
                {currentMessage}
                <div className="absolute -bottom-1.5 right-4 h-3 w-3 rotate-45 border-b border-r border-sable/60 bg-white dark:bg-slate-800 dark:border-white/10" />
              </div>
            </div>
          )}
          <div className={`cursor-pointer transition-transform duration-300 ${
            isExpanded ? 'scale-110' : 'hover:scale-105'
          } active:scale-95`}>
            <MascotCompanion mood={mood} size={size} message={undefined} />
          </div>
        </div>
      )}
    </>
  )
}
