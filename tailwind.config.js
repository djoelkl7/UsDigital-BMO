/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './constants.ts',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        morning: {
          primary: '#4A90C6',
          secondary: '#367EAF',
          deep: '#28658F',
          soft: '#F3F7FB',
          pale: '#DCEAF5',
          border: '#E2EAF1',
          slate: '#263746',
          muted: '#68798A'
        },
        brand: {
          red: '#E31B23'
        },
        status: {
          success: '#16865B',
          warning: '#D99A20',
          error: '#D93025'
        }
      }
    }
  },
  plugins: []
};
