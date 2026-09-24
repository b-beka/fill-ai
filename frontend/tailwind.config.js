/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="board"]'],
  theme: {
    extend: {
      colors: {
        /* Тетрадь и чернила */
        'paper': '#FBF7EA',
        'paper-2': '#F2ECD6',
        'ink': '#0E1A4B',
        'grid': '#C7D6F2',

        /* Цвета бренда FILL */
        'blue': '#2340E0',
        'sky': '#BBD4FF',
        'sun': '#FFC72C',
        'sun-soft': '#FFE9A3',

        /* Смысловые акценты */
        'pen-red': '#E5383B',
        'stamp-green': '#1F9D63',

        /* Режим «Доска» (для эфира преподавателя) */
        'board': '#0B1440',
        'chalk': '#F4F1E6',
      },
      fontFamily: {
        heading: ['Unbounded', 'sans-serif'],
        body: ['Onest', 'sans-serif'],
        sans: ['Onest', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      borderRadius: {
        'card': '20px',
        'pill': '999px',
      },
      boxShadow: {
        'hard': '4px 4px 0 0 #0E1A4B',
        'hard-lg': '8px 8px 0 0 #0E1A4B',
        'hard-sun': '4px 4px 0 0 #FFC72C',
        'hard-board': '4px 4px 0 0 #F4F1E6',
        'hard-board-lg': '8px 8px 0 0 #F4F1E6',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
