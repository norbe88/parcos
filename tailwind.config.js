/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme-mode="dark"]'],
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
        },
        mpi: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          'surface-2': 'var(--surface-2)',
          'surface-brand': 'var(--surface-brand)',
          text: 'var(--text)',
          'text-muted': 'var(--text-muted)',
          line: 'var(--line)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          'accent-text': 'var(--accent-text)',
          'on-accent': 'var(--on-accent)',
          metal: 'var(--metal)',
          success: 'var(--success)',
          whatsapp: 'var(--whatsapp)',
        }
      },
      borderRadius: {
        'r-sm': 'var(--r-sm, 8px)',
        'r-md': 'var(--r-md, 14px)',
        'r-lg': 'var(--r-lg, 24px)',
        'r-pill': 'var(--r-pill, 999px)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'cta': 'var(--shadow-cta, 0 12px 32px -12px rgba(216,51,51,.45))',
      },
      opacity: {
        '98': '0.98',
      },
      fontFamily: {
        sans: ['"Open Sans"', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        montserrat: ['"Montserrat"', 'sans-serif'],
        'open-sans': ['"Open Sans"', 'sans-serif'],
        serif: ['"Montserrat"', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Montserrat"', '"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
        mono: ['"Montserrat"', 'ui-monospace', 'monospace'],
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
