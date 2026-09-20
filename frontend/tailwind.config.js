/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0F17',
          card: '#111827',
          panel: '#151D2A',
          border: '#1F293D',
          hover: '#1B2436',
          green: '#10B981',
          greenSoft: 'rgba(16, 185, 129, 0.12)',
          red: '#F43F5E',
          redSoft: 'rgba(244, 63, 94, 0.12)',
          blue: '#3B82F6',
          gold: '#F59E0B',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
