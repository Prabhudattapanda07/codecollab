/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          100: '#1e1e1e',
          200: '#252526',
          300: '#2d2d30',
          400: '#3e3e42',
          500: '#007acc',
        }
      }
    },
  },
  plugins: [],
}
