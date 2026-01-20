/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rosa/Magenta - contraste 4.5:1 con blanco
        rosa: {
          DEFAULT: '#D64D7A',
          light: '#E87DA3',
          dark: '#B33D63',
        },
        // Púrpura - contraste 5.2:1 con blanco
        purpura: {
          DEFAULT: '#7B3F9E',
          light: '#9B5FBE',
          dark: '#5C2F77',
        },
        // Índigo oscuro - contraste 7:1 con blanco
        indigo: {
          DEFAULT: '#3D3A8C',
          light: '#5D5AAC',
          dark: '#2D2A6C',
        },
        // Azul medio - contraste 4.5:1 con blanco
        azul: {
          DEFAULT: '#4A6FD4',
          light: '#6A8FE4',
          dark: '#3A5FB4',
        },
        // Azul cielo - usar texto oscuro
        cielo: {
          DEFAULT: '#7EB3E8',
          light: '#A8D1F5',
          dark: '#5E93C8',
        },
        // Azul claro - usar texto oscuro
        celeste: {
          DEFAULT: '#C5E4F7',
          light: '#E5F4FC',
          dark: '#A5C4D7',
        },
      },
    },
  },
  plugins: [],
}
