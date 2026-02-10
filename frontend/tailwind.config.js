/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ===== ЦВЕТА ИЗ ДИЗАЙН-СИСТЕМЫ =====
      colors: {
        // Green family — основной акцент
        forest:    '#1B4332',
        emerald:   '#2D6A4F',
        sage:      '#40916C',
        mint:      '#52B788',

        // Warm neutrals — фоны
        cream:     '#FFFCF5',
        ivory:     '#FAF8F3',
        sand:      '#F0EBE3',
        stone:     '#E5DFD5',
        taupe:     '#C4BAA8',

        // Text
        charcoal:    '#2C2C2C',
        'dark-gray': '#4A4A4A',
        'medium-gray': '#7A7A7A',
        'light-gray':  '#A0A0A0',

        // Accent
        terracotta: {
          DEFAULT: '#C67C4E',
          dark:    '#B86B4C',
        },
        blush:  '#E8D5CC',
        olive:  '#7C8B6F',

        // System
        success: '#40916C',
        warning: '#D4A853',
        error:   '#C45B5B',

        // Telegram (сохраняем для совместимости)
        tg: {
          bg:           'var(--tg-theme-bg-color, #FFFCF5)',
          text:         'var(--tg-theme-text-color, #2C2C2C)',
          hint:         'var(--tg-theme-hint-color, #7A7A7A)',
          link:         'var(--tg-theme-link-color, #1B4332)',
          button:       'var(--tg-theme-button-color, #1B4332)',
          'button-text':'var(--tg-theme-button-text-color, #ffffff)',
          'secondary-bg':'var(--tg-theme-secondary-bg-color, #FAF8F3)',
        },
      },

      // ===== ШРИФТЫ =====
      fontFamily: {
        sans:    ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },

      // ===== BORDER RADIUS =====
      borderRadius: {
        'xl':  '14px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },

      // ===== ТЕНИ =====
      boxShadow: {
        'soft':       '0 2px 20px rgba(0, 0, 0, 0.06)',
        'card':       '0 8px 30px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.12)',
        'card-strong':'0 12px 40px rgba(0, 0, 0, 0.15)',
        'button':     '0 8px 25px rgba(0, 0, 0, 0.2)',
        'button-green':'0 4px 12px rgba(27, 67, 50, 0.25)',
        'nav':        '0 -4px 20px rgba(0, 0, 0, 0.05)',
        'toast':      '0 8px 30px rgba(0, 0, 0, 0.2)',
        'focus':      '0 0 0 4px rgba(27, 67, 50, 0.08)',
      },

      // ===== АНИМАЦИИ =====
      animation: {
        'fade-in-up':  'fadeInUp 0.6s cubic-bezier(0, 0, 0.2, 1)',
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'slide-down':  'slideDown 0.3s ease-out',
        'scale-in':    'scaleIn 0.2s ease-out',
        'bounce-in':   'bounceIn 0.5s ease-out',
        'pulse-dot':   'pulseDot 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-100%)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to:   { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '50%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.3)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },

      // ===== TRANSITION =====
      transitionTimingFunction: {
        'bounce-toast': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':       'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}