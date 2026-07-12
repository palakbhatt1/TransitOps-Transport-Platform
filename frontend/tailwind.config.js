/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          accent: 'var(--accent)',
          text: 'var(--text)',
          'text-h': 'var(--text-h)',
          bg: 'var(--bg)',
          border: 'var(--border)',
        }
      }
    },
  },
  plugins: [],
}
