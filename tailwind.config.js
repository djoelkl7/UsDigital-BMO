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
    extend: {}
  },
  plugins: []
};
