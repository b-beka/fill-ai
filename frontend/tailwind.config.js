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
        'brand-blue': '#2A46C7',
        'acid-green': '#AEDB00',
        'graphite': '#111318',
        'cream': '#F5F2E8',
        'fill-bg': 'var(--bg)',
        'fill-surface': 'var(--surface)',
        'fill-surface-alt': 'var(--surface-alt)',
        'fill-border': 'var(--border)',
        'fill-text': 'var(--text)',
        'fill-text-muted': 'var(--text-muted)',
        'fill-text-faint': 'var(--text-faint)',
        'fill-blue': '#2A46C7',
        'fill-blue-text': '#FFFFFF',
        'fill-blue-soft': '#1e3399',
        'fill-green': '#AEDB00',
        'fill-green-deep': '#88ab00',
        'fill-green-soft': '#d9f75b',
        'fill-success': '#AEDB00',
        'fill-success-soft': '#d9f75b',
        'fill-warning': '#f59e0b',
        'fill-warning-soft': 'var(--warning-soft)',
        'fill-danger': '#ef4444',
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
