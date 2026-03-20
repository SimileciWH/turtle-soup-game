import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // PRD 色彩规范
        warm: {
          white: '#FDF6E3',
          brown: '#3D2B1A',
          mid: '#7A6050'
        },
        sky: '#B8E0F7',
        ocean: '#5BA3C9',
        sand: '#F0C080',
        leaf: '#6BAF7A',
        coral: '#FF8C42'
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        en: ['Nunito', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
