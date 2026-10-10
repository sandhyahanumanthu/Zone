/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        plum: {
          950: '#19141D',
          900: '#29212F', // Deep Plum primary brand
          850: '#33293B',
          800: '#3E3247',
          750: '#4A3B54',
          700: '#544460',
          600: '#6D5278', // Information semantic
          500: '#8A7787', // Muted text
          400: '#A493A1',
          300: '#C5B6C3',
          200: '#E8DDE5', // Borders
          100: '#F5EDF2', // Secondary surface
          50: '#FAF4F8',
        },
        rose: {
          50: '#FDF7FA',
          100: '#F8F2F5', // Main canvas / Ivory
          200: '#F5EDF2', // Secondary surface
          300: '#F1D9E5', // Pale Rose accent
          400: '#E59FBF',
          500: '#D96C9D', // Rose Pink primary action
          600: '#C75689',
          700: '#A83C6F',
          800: '#862D57',
          900: '#642141',
        },
        semantic: {
          success: '#267A62',
          'success-bg': '#EAF5F1',
          'success-border': '#B4E0D2',
          warning: '#B7791F',
          'warning-bg': '#FDF6E7',
          'warning-border': '#F5D69E',
          error: '#B4233B',
          'error-bg': '#FDF0F2',
          'error-border': '#F8BAC2',
          info: '#6D5278',
          'info-bg': '#F5EDF6',
          'info-border': '#DCBEDF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'plum-sm': '0 1px 3px 0 rgba(41, 33, 47, 0.05), 0 1px 2px -1px rgba(41, 33, 47, 0.05)',
        'plum-md': '0 4px 16px -2px rgba(41, 33, 47, 0.06), 0 2px 6px -2px rgba(41, 33, 47, 0.04)',
        'plum-lg': '0 12px 32px -4px rgba(41, 33, 47, 0.08), 0 4px 12px -2px rgba(41, 33, 47, 0.03)',
        'rose-glow': '0 4px 16px 0 rgba(217, 108, 157, 0.32)',
        'rose-glow-sm': '0 2px 10px 0 rgba(217, 108, 157, 0.22)',
        'card-hover': '0 12px 28px -6px rgba(41, 33, 47, 0.10), 0 4px 10px -2px rgba(41, 33, 47, 0.04)',
      },
      animation: {
        'aurora-1': 'auroraOne 22s ease-in-out infinite alternate',
        'aurora-2': 'auroraTwo 26s ease-in-out infinite alternate',
        'aurora-3': 'auroraThree 30s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        auroraOne: {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1) rotate(0deg)' },
          '50%': { transform: 'translate3d(60px, -40px, 0) scale(1.15) rotate(15deg)' },
          '100%': { transform: 'translate3d(-40px, 30px, 0) scale(0.95) rotate(-10deg)' },
        },
        auroraTwo: {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1) rotate(0deg)' },
          '50%': { transform: 'translate3d(-50px, 60px, 0) scale(1.1) rotate(-15deg)' },
          '100%': { transform: 'translate3d(50px, -30px, 0) scale(0.9) rotate(20deg)' },
        },
        auroraThree: {
          '0%': { transform: 'translate3d(0, 0, 0) scale(0.95) rotate(0deg)' },
          '50%': { transform: 'translate3d(40px, 50px, 0) scale(1.2) rotate(25deg)' },
          '100%': { transform: 'translate3d(-60px, -40px, 0) scale(1.05) rotate(-15deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
