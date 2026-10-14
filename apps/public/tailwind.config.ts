import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF9',
        ink: '#0F0F0F',
        wa: {
          DEFAULT: '#25D366',
          deep: '#128C7E',
        },
        success: '#16A34A',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15,15,15,0.04)',
        sm: '0 1px 3px rgba(15,15,15,0.06), 0 1px 2px rgba(15,15,15,0.04)',
        md: '0 2px 8px rgba(15,15,15,0.06), 0 16px 40px -20px rgba(15,15,15,0.18)',
        lift: '0 12px 32px -12px rgba(15,15,15,0.18)',
        cta: '0 1px 2px rgba(15,15,15,0.1), 0 12px 28px -10px rgba(37,211,102,0.5)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;