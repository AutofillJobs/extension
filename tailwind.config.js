module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/formpage/**/*.{js,jsx,ts,tsx}",
    "./src/popup/**/*.{js,jsx,ts,tsx}",
    "./src/formpage/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        abeezee: ['ABeeZee', 'sans-serif']
      },
      colors: {
        primary: {
          DEFAULT: '#5352ed',
          light: '#6b6aef',
          dark: '#4a49d4',
        },
        background: {
          DEFAULT: 'white',
        },
        text: {
          DEFAULT: 'black',
        }
      },
    },
  },
  plugins: [],
}
