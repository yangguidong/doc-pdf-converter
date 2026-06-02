/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        troll: {
          bg: '#1a1a2e',
          card: '#16213e',
          accent: '#e94560',
          gold: '#ffd700',
          poop: '#8B4513',
        },
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
        float: 'float 3s ease-in-out infinite',
        bounce: 'bounce 0.6s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px) rotate(-2deg)' },
          '50%': { transform: 'translateX(10px) rotate(2deg)' },
          '75%': { transform: 'translateX(-6px) rotate(-1deg)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounce: {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
