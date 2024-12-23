module.exports = {
  content: [
    './*.html', // include all HTML files in the root directory
    './js/**/*.js', // include all JavaScript files in the js directory and subdirectories
    './pages/**/*.js', // include all JavaScript files in the pages directory and subdirectories
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#1a1a1a',
          900: '#1f1f1f',
        },
      },
      backgroundImage: {
        'blue-pattern': "url('/assets/bg-image.webp'), linear-gradient(var(--gray-950), var(--gray-900))",
      },
      backgroundBlendMode: {
        'overlay': 'overlay',
      },
    },
  },
  plugins: [],
}