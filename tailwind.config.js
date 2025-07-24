/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#334155',
            a: {
              color: '#2563eb',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            h1: {
              color: '#0f172a',
            },
            h2: {
              color: '#1e293b',
            },
            h3: {
              color: '#334155',
            },
            h4: {
              color: '#475569',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            code: {
              backgroundColor: '#f1f5f9',
              color: '#334155',
              fontWeight: '400',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
            },
            pre: {
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0',
            },
            blockquote: {
              color: '#64748b',
              borderLeftColor: '#e2e8f0',
            },
          },
        },
        lg: {
          css: {
            fontSize: '18px',
            lineHeight: '1.7',
            h1: {
              fontSize: '2.25em',
            },
            h2: {
              fontSize: '1.875em',
            },
            h3: {
              fontSize: '1.5em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}