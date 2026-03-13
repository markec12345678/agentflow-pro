import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          600: '#2563EB',
        },
        emerald: {
          500: '#10B981',
        },
        amber: {
          500: '#F59E0B',
        },
        red: {
          500: '#EF4444',
        },
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};

export default config;