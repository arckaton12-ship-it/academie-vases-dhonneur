import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type AccentColor = 'bordeaux' | 'olive' | 'or'

interface ThemeContextType {
  accent: AccentColor
  setAccent: (c: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType>({ accent: 'bordeaux', setAccent: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>(() => {
    try { return (localStorage.getItem('accent_color') as AccentColor) || 'bordeaux' }
    catch { return 'bordeaux' }
  })

  useEffect(() => {
    localStorage.setItem('accent_color', accent)
    const root = document.documentElement
    const colors: Record<AccentColor, string> = {
      bordeaux: '#A82A2E',
      olive: '#1B6B63',
      or: '#D4A017',
    }
    root.style.setProperty('--accent', colors[accent])
  }, [accent])

  const setAccent = (c: AccentColor) => setAccentState(c)

  return (
    <ThemeContext.Provider value={{ accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
