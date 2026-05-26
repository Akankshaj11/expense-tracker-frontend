// Repo file header
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f8ff',
          100: '#e6f0ff',
          200: '#bfdfff',
          300: '#99ccff',
          400: '#4da6ff',
          500: '#0f4aa6',
          600: '#0b3a84',
          700: '#072c66',
          800: '#062243',
          900: '#07172b'
        },
        accent: '#0ea5a4'
      },
      boxShadow: {
        'soft-lg': '0 12px 30px rgba(16,24,40,0.12)',
        'glass': '0 8px 24px rgba(16,24,40,0.08)'
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: [],
}
