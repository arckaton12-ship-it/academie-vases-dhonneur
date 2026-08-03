import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bordeaux: '#5D2A41',
        sable: '#D9B89E',
        olive: '#8A9A5B',
        parchemin: '#F8F4E9',
        or: '#CFAF5B',
        pierre: '#6B6B6B',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '0.625rem',
      },
    },
  },
  plugins: [],
} satisfies Config
