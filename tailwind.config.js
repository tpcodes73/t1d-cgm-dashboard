/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        health: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          cardBorder: '#E2E8F0',
          header: '#FFFFFF',
          accent: '#2563EB',
          target: '#10B981',     // Green: 70-180 mg/dL
          high: '#F59E0B',       // Amber: 181-250 mg/dL
          veryHigh: '#EF4444',   // Red: >250 mg/dL
          low: '#EC4899',        // Pink: 54-69 mg/dL
          veryLow: '#8B5CF6',    // Purple: <54 mg/dL
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
