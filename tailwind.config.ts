import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bordeaux: '#1B6B63',
        sable: '#D9B89E',
        olive: '#14524D',
        parchemin: '#FFFFFF',
        or: '#D4A017',
        pierre: '#6B6B6B',
        teal: '#1B6B63',
        'teal-dark': '#14524D',
        'or-light': '#E8C547',
        rouge: '#A82A2E',
        'rouge-dark': '#8B2124',
        blanc: '#FFFFFF',
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
