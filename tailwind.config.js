/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0b0f14',
        surface: '#151b23',
        border: '#26303c',
        primary: '#38bdf8',
        accent: '#f97316',
        muted: '#8b98a5',
        online: '#34d399',
        offline: '#64748b',
      },
    },
  },
  plugins: [],
};
