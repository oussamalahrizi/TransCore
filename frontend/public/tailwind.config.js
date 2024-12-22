module.exports = {
  content: [
    "./public/**/*.{html,js}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'global-bg': "url('/img/maptexture2.webp'), linear-gradient(var(--gray-950), var(--gray-900))",
      },
      backgroundBlendMode: {
        'overlay': 'overlay',
      },
    }
  },
  plugins: [],
}
