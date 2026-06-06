export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172026',
        app: {
          ink: '#111827',
          text: '#1F2937',
          paper: '#F8F7F2'
        },
        brand: {
          DEFAULT: '#7A0A45',
          700: '#5E0736',
          950: '#2A061A'
        },
        deal: {
          orange: '#C27600',
          amber: '#F59E0B',
          green: '#0B7A37'
        },
        citrus: '#f3b63f',
        mint: '#2fbf8f'
      }
    }
  },
  plugins: []
};
