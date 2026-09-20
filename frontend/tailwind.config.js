/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'fill-bg': 'var(--bg)',
        'fill-surface': 'var(--surface)',
        'fill-surface-alt': 'var(--surface-alt)',
        'fill-border': 'var(--border)',
        'fill-text': 'var(--text)',
        'fill-text-muted': 'var(--text-muted)',
        'fill-text-faint': 'var(--text-faint)',
        'fill-blue': 'var(--blue)',
        'fill-blue-text': 'var(--blue-text)',
        'fill-blue-soft': 'var(--blue-soft)',
        'fill-green': 'var(--green)',
        'fill-green-deep': 'var(--green-deep)',
        'fill-green-soft': 'var(--green-soft)',
        'fill-success': 'var(--success)',
        'fill-success-soft': 'var(--success-soft)',
        'fill-warning': 'var(--warning)',
        'fill-warning-soft': 'var(--warning-soft)',
        'fill-danger': 'var(--danger)',
        'fill-danger-soft': 'var(--danger-soft)',
      },
      fontFamily: {
        head: ['Manrope', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
      }
    },
  },
  plugins: [],
}
