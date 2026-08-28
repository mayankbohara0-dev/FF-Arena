/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '360px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        'ff-yellow': '#FFE600',
        'ff-bg': '#050507',
        'ff-card': '#0E0E12',
        'ff-card-hover': '#1b2438',
        'ff-surface': '#1e293b',
        'ff-border': '#24324d',
        'ff-border-bright': '#3b82f6',
        'ff-orange': '#ff5e14',
        'ff-orange-glow': '#ff7a38',
        'ff-amber': '#ffb020',
        'ff-cyan': '#00e5ff',
        'ff-purple': '#9333ea',
        'ff-red': '#f43f5e',
        'ff-green': '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Teko', 'Rajdhani', 'Impact', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px -3px rgba(255, 94, 20, 0.45)',
        'glow-cyan': '0 0 20px -3px rgba(0, 229, 255, 0.45)',
        'glow-amber': '0 0 20px -3px rgba(255, 176, 32, 0.45)',
        'glow-purple': '0 0 20px -3px rgba(147, 51, 234, 0.45)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2.5s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.02)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
