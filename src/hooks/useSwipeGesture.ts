import { useRef, useCallback, TouchEvent } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onLongPress?: () => void
  threshold?: number
  longPressDelay?: number
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, onLongPress, threshold = 80, longPressDelay = 500 }: SwipeOptions) {
  const startX = useRef(0)
  const startY = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const swiped = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    swiped.current = false

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (!swiped.current) {
          onLongPress()
        }
      }, longPressDelay)
    }
  }, [onLongPress, longPressDelay])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (longPressTimer.current) {
      const dx = Math.abs(e.touches[0].clientX - startX.current)
      const dy = Math.abs(e.touches[0].clientY - startY.current)
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (swiped.current) return

    const endX = e.changedTouches[0].clientX
    const dx = endX - startX.current
    const dy = Math.abs(e.changedTouches[0].clientY - startY.current)

    if (Math.abs(dx) > threshold && dy < Math.abs(dx) * 0.5) {
      swiped.current = true
      if (dx > 0 && onSwipeRight) onSwipeRight()
      if (dx < 0 && onSwipeLeft) onSwipeLeft()
    }
  }, [onSwipeLeft, onSwipeRight, threshold])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}
