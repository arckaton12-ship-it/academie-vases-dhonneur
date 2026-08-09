import { useState, useRef, useCallback, TouchEvent } from 'react'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: PullToRefreshOptions) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isMobile) return
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    setPulling(true)
  }, [isMobile])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling || refreshing) return
    const distance = e.touches[0].clientY - startY.current
    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5))
    }
  }, [pulling, refreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return
    if (pullDistance >= threshold) {
      setRefreshing(true)
      setPullDistance(threshold)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
    setPullDistance(0)
    setPulling(false)
  }, [pulling, pullDistance, threshold, onRefresh])

  return {
    containerRef,
    pullDistance,
    refreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}
