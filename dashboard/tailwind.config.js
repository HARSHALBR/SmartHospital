/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        ink: '#172d3c',
        muted: '#6c7e88',
        muted2: '#91a0a8',
        line: '#e4ebee',
        canvas: '#f5f8fa',
        teal: {
          DEFAULT: '#167f78',
          dark: '#0f625f',
          light: '#e7f5f2',
          pill: '#a8ded2',
        },
        navy: {
          nav: '#112c3b',
          active: '#1d5360',
          border: '#8cd4c4',
          card: '#183746',
        }
      },
      borderRadius: {
        'theme': '14px',
      },
      boxShadow: {
        'theme': '0 8px 28px rgba(28,57,71,.055)',
        'hero': '0 14px 34px rgba(34,93,96,.24)',
      }
    },
  },
  plugins: [],
}
