import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563EB',
          skyblue: '#0EA5E9',
          lightskyblue: '#E0F2FE',
          purple: '#8B5CF6',
          lightpurple: '#F3E8FF',
          pink: '#EC4899',
          accent: '#06B6D4',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Pretendard"',
          'sans-serif',
        ],
      },
      boxShadow: {
        subtle: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        card: '0 8px 30px rgba(0, 0, 0, 0.08)',
        float: '0 14px 35px rgba(37, 99, 235, 0.15)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
export default config;
