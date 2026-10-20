/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#121215',
        'surface-elevated': '#18181b',
        border: 'rgba(255, 255, 255, 0.08)',
        accent: {
          light: '#fde68a',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Clash Display"', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Clash Display"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [],
}
