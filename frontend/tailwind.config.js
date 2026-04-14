/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.{js,ts,jsx,tsx}',
    './SocialApp.{js,ts,jsx,tsx}',
    './main.{js,ts,jsx,tsx}',
    './api/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './game/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
