/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0E4536",
        "primary-dark": "#082E24",
        gold: "#A9782E",
        paper: "#F5EFDE",
        card: "#FFFCF5",
        ink: "#23281F",
        maroon: "#7A2A2A",
      },
      fontFamily: {
        urdu: ["var(--font-urdu)", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
