module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fcf5ff',
          100: '#fae8ff',
          200: '#f4ccff',
          300: '#eba3ff',
          400: '#dd6eff',
          500: '#9900bf',
          600: '#7A0099',
          700: '#61007a',
          800: '#4d0061',
          900: '#360045'
        },
        accent: '#0ea5e9'
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
