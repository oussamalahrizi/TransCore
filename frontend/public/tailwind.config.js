module.exports = {
  content: [
    './public/*.html', // include all HTML files in the root directory
    './js/**/*.js', // include all JavaScript files in the js directory and subdirectories
    './public/pages/**/*.js', // include all JavaScript files in the pages directory and subdirectories
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}