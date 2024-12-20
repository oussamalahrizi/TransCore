

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'game-dark': '#1a1a2e',
        'game-accent': '#16213e',
        'game-highlight': '#0f3460',
        'game-button': '#e94560',
      }
    },
  },
  plugins: [],
}