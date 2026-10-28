/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Night-theme surfaces: near-black bases with cool blue lift.
        ink: {
          900: '#05070d',
          800: '#0a0e18',
          700: '#111726',
          600: '#1a2336',
          500: '#243049',
          400: '#36445f',
        },
        spark: {
          // Blue-light blue — the product's signature colour.
          400: '#5ec8ff',
          500: '#22a7f0',
          600: '#0b86cf',
        },
        danger: {
          400: '#ff6b6b',
          500: '#f03030',
          600: '#c81b1b',
        },
        safe: {
          400: '#4ade80',
          500: '#22c55e',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      // Extra alpha steps used by the night theme's layered translucency.
      opacity: {
        2: '0.02',
        8: '0.08',
        12: '0.12',
        92: '0.92',
        97: '0.97',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(94,200,255,0.35), 0 0 24px rgba(34,167,240,0.35)',
        'glow-danger': '0 0 0 1px rgba(255,107,107,0.4), 0 0 32px rgba(240,48,48,0.45)',
        panel: '0 -8px 32px rgba(0,0,0,0.6)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.9' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        beacon: {
          '0%,100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
        beacon: 'beacon 1.8s ease-in-out infinite',
        slideUp: 'slideUp 0.22s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
