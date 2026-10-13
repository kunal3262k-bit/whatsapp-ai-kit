import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2dd4bf',
          dark: '#0d9488',
        },
      },
    },
  },
  plugins: [],
};

export default config;
