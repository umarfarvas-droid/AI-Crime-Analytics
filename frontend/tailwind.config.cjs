/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        dark: {
          950: '#05070d',
          900: '#080d1a',
          850: '#0c1426',
          800: '#121d36',
          750: '#182749',
          700: '#20345e',
          600: '#2d487e',
        },
        forensic: {
          bg: '#05070d',
          panel: '#080d1a',
          surface: '#0d162a',
          card: '#111c36',
          border: 'rgba(148, 163, 184, 0.12)',
          highlight: 'rgba(6, 182, 212, 0.18)',
        },
        brand: {
          cyan: '#06b6d4',
          teal: '#14b8a6',
          blue: '#3b82f6',
          indigo: '#6366f1',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          crimson: '#e11d48',
        }
      },
      boxShadow: {
        'forensic-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'forensic-md': '0 8px 24px -4px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'forensic-lg': '0 16px 36px -6px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(6, 182, 212, 0.25)',
        'cyan-glow': '0 0 25px -3px rgba(6, 182, 212, 0.4)',
        'cyan-glow-intense': '0 0 35px 2px rgba(6, 182, 212, 0.6)',
        'amber-glow': '0 0 25px -3px rgba(245, 158, 11, 0.4)',
        'rose-glow': '0 0 25px -3px rgba(244, 63, 94, 0.4)',
        'threat-glow': '0 0 30px -2px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'threat-pulse': 'threatPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'warning-pulse': 'warningPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'verified-pulse': 'verifiedPulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanlineSweep 6s linear infinite',
        'laser': 'laserScan 3s ease-in-out infinite alternate',
        'grid-drift': 'cyberGridDrift 20s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'beacon': 'beaconPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.99)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
        threatPulse: {
          '0%, 100%': { 
            borderColor: 'rgba(239, 68, 68, 0.35)', 
            boxShadow: '0 0 15px -3px rgba(239, 68, 68, 0.2)' 
          },
          '50%': { 
            borderColor: 'rgba(239, 68, 68, 0.7)', 
            boxShadow: '0 0 25px 2px rgba(239, 68, 68, 0.45)' 
          },
        },
        warningPulse: {
          '0%, 100%': { 
            borderColor: 'rgba(245, 158, 11, 0.35)', 
            boxShadow: '0 0 15px -3px rgba(245, 158, 11, 0.2)' 
          },
          '50%': { 
            borderColor: 'rgba(245, 158, 11, 0.7)', 
            boxShadow: '0 0 25px 2px rgba(245, 158, 11, 0.4)' 
          },
        },
        verifiedPulse: {
          '0%, 100%': { 
            borderColor: 'rgba(16, 185, 129, 0.35)', 
            boxShadow: '0 0 12px -3px rgba(16, 185, 129, 0.2)' 
          },
          '50%': { 
            borderColor: 'rgba(16, 185, 129, 0.65)', 
            boxShadow: '0 0 20px 0 rgba(16, 185, 129, 0.35)' 
          },
        },
        scanlineSweep: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        laserScan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        cyberGridDrift: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 48px' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        beaconPulse: {
          '0%': { transform: 'scale(1)', opacity: '0.9' },
          '70%': { transform: 'scale(2.4)', opacity: '0' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
};
