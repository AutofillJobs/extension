module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./dist/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00df9a',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable base styles for extension
  },
  important: true, // Ensure styles override page styles
}
