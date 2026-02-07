/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // A sophisticated, paper-like palette
        paper: '#FAFAF9', // Warm off-white, like Stone
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',  // Muted steel
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',  // Deep Navy charcoal
          950: '#020617',
        },
        // Accent color: A professional indigo/violet, distinct but not neon
        accent: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1', // Primary accent
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        // Semantic colors
        success: { DEFAULT: '#10B981', light: '#D1FAE5', dark: '#047857' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#B45309' },
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2', dark: '#B91C1C' },
        // Legacy support (mapping to new system or keeping for backup)
        brand: {
          500: '#0369A1',
          600: '#0284C7',
        },
        surface: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Crimson Pro', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'hard': '0 8px 30px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'gentle-pulse': 'gentlePulse 3s infinite ease-in-out',
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        gentlePulse: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: .8, transform: 'scale(1.05)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
