/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#f8fafc', 
        'bg-secondary': '#ffffff',
        'surface-1': '#ffffff',
        'surface-2': '#f1f5f9',
        'accent-primary': '#000000', /* Negro Puro */
        'accent-primary-dim': '#1e293b',
        'accent-runestone': '#863bff', /* Púrpura Vibrante */
        'accent-success': '#22c55e',
        'accent-warning': '#eab308',
        'accent-error': '#ef4444',
        'accent-vip': '#863bff',
        'accent-fork': '#f97316',
        'text-primary': '#0f172a',
        'text-muted': '#0f172a',
        'border-color': '#e2e8f0',
        'border-light': '#f1f5f9',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Space Grotesk', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glow-cyan-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glow-magenta': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glow-magenta-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
