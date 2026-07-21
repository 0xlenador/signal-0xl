/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./js/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#05050A', /* Obsidiana Profunda */
        'bg-secondary': '#0A0A10',
        'surface-1': 'rgba(20, 20, 30, 0.4)',
        'surface-2': 'rgba(30, 30, 45, 0.6)',
        'accent-primary': '#00E5FF', /* Neon Cyan */
        'accent-primary-dim': '#00B3CC',
        'accent-runestone': '#FF007F', /* Neon Pink/Magenta */
        'accent-success': '#00E676',
        'accent-warning': '#FFD600',
        'accent-error': '#FF1744',
        'text-primary': '#F8FAFC',
        'text-muted': '#94A3B8',
        'border-color': 'rgba(255, 255, 255, 0.08)',
        'border-light': 'rgba(255, 255, 255, 0.15)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Space Grotesk', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.4)',
        'glow-cyan-lg': '0 0 35px rgba(0, 229, 255, 0.6)',
        'glow-magenta': '0 0 20px rgba(255, 0, 127, 0.4)',
        'glow-magenta-lg': '0 0 35px rgba(255, 0, 127, 0.6)',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
