import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#c41e3a',
          green: '#228b22',
          gold: '#ffd700',
          cream: '#fffef0',
          darkRed: '#8b0000',
          darkGreen: '#006400',
        },
      },
      animation: {
        'snow-fall': 'snowfall 10s linear infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
      },
      keyframes: {
        snowfall: {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0.3' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}

export default config
