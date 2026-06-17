/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Escala al 80% los tamaños de fuente base de Tailwind
        'xs': ['0.64rem', { lineHeight: '0.8rem' }],
        'sm': ['0.72rem', { lineHeight: '1rem' }],
        'base': ['0.8rem', { lineHeight: '1.2rem' }],
        'lg': ['0.88rem', { lineHeight: '1.4rem' }],
        'xl': ['0.96rem', { lineHeight: '1.6rem' }],
        '2xl': ['1.12rem', { lineHeight: '1.8rem' }],
        '3xl': ['1.28rem', { lineHeight: '2rem' }],
        '4xl': ['1.44rem', { lineHeight: '2.2rem' }],
        '5xl': ['1.68rem', { lineHeight: '2.4rem' }],
      },
      spacing: {
        // Escala al 80% los espaciados
        'xs': '0.4rem',
        'sm': '0.6rem',
        'md': '0.8rem',
        'lg': '1.2rem',
        'xl': '1.6rem',
      }
    },
  },
  plugins: [],
}
