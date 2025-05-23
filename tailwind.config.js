/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/**/*.{js,css}"],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#36393f',
          darker: '#2f3136',
          darkest: '#202225',
          light: '#dcddde',
          blurple: '#5865f2',
          blurpleHover: '#4752c4',
          success: '#43b581',
          error: '#f04747',
          input: '#40444b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} 