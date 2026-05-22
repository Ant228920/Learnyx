/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter-extra-bold-italic': 'var(--inter-extra-bold-italic-font-family)',
        'inter-medium': 'var(--inter-medium-font-family)',
        'inter-regular': 'var(--inter-regular-font-family)',
        'inter-semi-bold': 'var(--inter-semi-bold-font-family)',
        'inter-bold-upper': 'var(--inter-bold-upper-font-family)',
        'inter-italic': 'var(--inter-italic-font-family)',
        'poppins-bold': 'var(--poppins-bold-font-family)',
      },
    },
  },
  plugins: [],
};