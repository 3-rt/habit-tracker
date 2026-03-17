import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f1a',
        surface: '#1a1a2e',
        'surface-light': '#252540',
        done: '#4ade80',
        partial: '#fbbf24',
        pending: '#f87171',
        info: '#60a5fa',
      },
    },
  },
  plugins: [],
};
export default config;
