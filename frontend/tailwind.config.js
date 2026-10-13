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
        sphere: {
          bg: '#0a0d14',
          card: '#111522',
          surface: '#181e30',
          border: '#232b42',
          primary: '#e50914', // Cinema Crimson accent
          primaryHover: '#b80710',
          accent: '#6366f1',  // Electric Indigo secondary
          cyan: '#06b6d4',
          gold: '#f59e0b',
          muted: '#94a3b8',
          text: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-crimson': '0 0 25px -5px rgba(229, 9, 20, 0.4)',
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.4)',
      }
    },
  },
  plugins: [],
}
