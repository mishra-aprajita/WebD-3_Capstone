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
        instagram: {
          bg: '#000000',
          card: '#121212',
          cardHover: '#181818',
          border: '#262626',
          borderLight: '#363636',
          text: '#f5f5f5',
          textMuted: '#a8a8a8',
          blue: '#0095f6',
          blueHover: '#1877f2',
          red: '#ed4956',
          green: '#00ba7c',
          greenHover: '#10b981',
          highlight: '#efefef',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
