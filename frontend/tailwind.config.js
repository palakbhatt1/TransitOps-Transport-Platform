/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          50: '#F8F9FA',
          100: '#1F2937',  // Primary text (dark)
          200: '#374151',  // Secondary text (darker)
          300: '#4B5563',  // Medium text
          400: '#6B7280',  // Muted text
          500: '#9CA3AF',  // Gray/icon text
          600: '#D1D5DB',  // Light borders
          700: '#E5E7EB',  // Divides
          800: '#E2E8F0',  // Card borders (light gray)
          900: '#FFFFFF',  // Card background (white)
          950: '#F0F2F5',  // Page wrapper background (Odoo light gray)
        },
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
