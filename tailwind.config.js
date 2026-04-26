/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        inferno: '#ff2200',
        ember: '#ff6600',
        abyss: '#050000',
        ash: '#1a0a0a',
        blood: '#8b0000',
      },
      animation: {
        flicker: 'flicker 2s infinite',
        pulse: 'pulse-border 3s infinite',
        shake: 'shake 0.5s infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1', textShadow: '0 0 10px #ff2200, 0 0 20px #ff6600' },
          '50%': { opacity: '0.8', textShadow: '0 0 5px #8b0000, 0 0 10px #ff2200' },
        },
        'pulse-border': {
          '0%, 100%': { borderColor: '#ff2200', boxShadow: '0 0 10px rgba(255,34,0,0.3)' },
          '50%': { borderColor: '#ff6600', boxShadow: '0 0 25px rgba(255,102,0,0.6)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
      },
    },
  },
  plugins: [],
};
