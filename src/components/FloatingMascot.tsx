import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MascotCompanion, MascotMood, getRandomMoodMessage } from './MascotCompanion'
import { FlameBurst } from './FlameBurst'
import { playFlameSpeak } from '@/lib/sound'

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const CORNER_STYLES: Record<Corner, string> = {
  'top-left': 'top-16 left-3',
  'top-right': 'top-16 right-3',
  'bottom-left': 'bottom-20 left-3',
  'bottom-right': 'bottom-20 right-3',
}

const BUBBLE_POSITION: Record<Corner, string> = {
  'top-left': 'top-full left-0 mt-2',
  'top-right': 'top-full right-0 mt-2',
  'bottom-left': 'bottom-full left-0 mb-2',
  'bottom-right': 'bottom-full right-0 mb-2',
}

const ALL_CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

interface FloatingMascotProps {
  mood?: MascotMood
}

export function FloatingMascot({ mood = 'happy' }: FloatingMascotProps) {
  const [corner, setCorner] = useState<Corner>(() => {
    return ALL_CORNERS[Math.floor(Math.random() * ALL_CORNERS.length)]
  })
  const [visible, setVisible] = useState(true)
  const [showMessage, setShowMessage] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [isBursting, setIsBursting] = useState(false)
  const [exiting, setExiting] = useState(false)

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pickNewCorner = useCallback(() => {
    const available = ALL_CORNERS.filter((c) => c !== corner)
    return available[Math.floor(Math.random() * available.length)]
  }, [corner])

  const clearAllTimers = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
  }, [])

  const startCycle = useCallback(() => {
    clearAllTimers()
    hideTimerRef.current = setTimeout(() => {
      setExiting(true)
      setTimeout(() => {
        setVisible(false)
        setExiting(false)
        showTimerRef.current = setTimeout(() => {
          setCorner(pickNewCorner())
          setVisible(true)
          startCycle()
        }, 12000)
      }, 300)
    }, 8000)
  }, [clearAllTimers, pickNewCorner])

  useEffect(() => {
    startCycle()
    return clearAllTimers
  }, [startCycle, clearAllTimers])

  const handleTouch = useCallback(() => {
    clearAllTimers()
    const msg = getRandomMoodMessage(mood)
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
    setCorner(pickNewCorner())
    startCycle()
  }, [pickNewCorner, startCycle])

  const positionClass = useMemo(() => CORNER_STYLES[corner], [corner])
  const bubbleClass = useMemo(() => BUBBLE_POSITION[corner], [corner])

  return (
    <>
      {isBursting && <FlameBurst onComplete={handleBurstComplete} />}

      {visible && (
        <div
          className={`fixed z-50 ${positionClass} ${
            exiting ? 'corner-exit' : 'corner-enter'
          }`}
          onClick={handleTouch}
          onTouchStart={handleTouch}
          role="button"
          tabIndex={0}
          aria-label="Flamme compagnon — touche pour interagir"
        >
          {showMessage && (
            <div className={`absolute z-50 w-52 ${bubbleClass}`}>
              <div className="relative rounded-xl border border-sable/60 bg-white px-3 py-2 text-xs leading-snug text-bordeaux shadow-lg dark:bg-slate-800 dark:text-slate-200 dark:border-white/10">
                {currentMessage}
                <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-sable/60 bg-white dark:bg-slate-800 dark:border-white/10" />
              </div>
            </div>
          )}
          <div className="float-drift cursor-pointer transition-transform hover:scale-110 active:scale-95">
            <MascotCompanion mood={mood} size={90} message={undefined} />
          </div>
        </div>
      )}
    </>
  )
}
