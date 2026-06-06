export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B1F3A',

        app: {
          ink: '#111827',      // main text
          text: '#475569',     // secondary text
          muted: '#64748B',    // softer text
          paper: '#FFF8EF',    // warm background
          card: '#FFFFFF',     // cards
          border: '#E5E7EB'    // borders
        },

        brand: {
          DEFAULT: '#0B1F3A',  // navy primary
          50: '#F1F5FF',
          100: '#E0E9FF',
          500: '#1D4ED8',
          700: '#0B1F3A',
          900: '#081A33',
          950: '#071426'
        },

        deal: {
          orange: '#FF5A1F',   // main CTA / discounts
          orangeSoft: '#FFF1E8',
          amber: '#F59E0B',    // warning / medium confidence
          amberSoft: '#FEF3C7',
          green: '#16A34A',    // active / confirmed
          greenSoft: '#DCFCE7',
          blue: '#2563EB',     // warehouse / links
          blueSoft: '#DBEAFE',
          red: '#DC2626',      // expired / danger
          redSoft: '#FEE2E2'
        },

        citrus: '#FF5A1F',
        mint: '#16A34A'
      }
    }
  },
  plugins: []
};
