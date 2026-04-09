/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          600: "#0f766e",
          700: "#115e59",
        },
      },
    },
  },
  plugins: [],
};

