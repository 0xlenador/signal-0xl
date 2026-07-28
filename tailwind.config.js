/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#f8fafa',
        'bg-secondary': '#ffffff',
        'surface-1': '#ffffff',
        'surface-2': '#f1f5f9',
        'accent-primary': '#000000',
        'accent-primary-dim': '#1e293b',
        'accent-runestone': '#863bff',
        'accent-success': '#22c55e',
        'accent-warning': '#eab308',
        'accent-error': '#ef4444',
        'accent-vip': '#863bff',
        'accent-fork': '#f97316',
        'text-primary': '#0f172a',
        'text-muted': '#64748b', /* Ajustado para mejor contraste sin esfuerzo visual */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'Inter', 'sans-serif'],
        mono: ['var(--font-space-grotesk)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glow-cyan-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glow-magenta': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glow-magenta-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      keyframes: {
        'node-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          'from': { filter: 'drop-shadow(0 0 10px rgba(255, 0, 127, 0.4))' },
          'to': { filter: 'drop-shadow(0 0 35px rgba(255, 0, 127, 0.9))' },
        },
        'signal-entry': {
          'to': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'node-float': 'node-float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite alternate',
        'signal-entry': 'signal-entry 0.3s ease-out forwards',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
