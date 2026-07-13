/** @type {import('tailwindcss').Config} */
// Tokens extraídos de design-sistema.md — fonte da verdade visual do projeto.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0C0E', // fundo geral — nunca preto puro
        tile: '#17181C', // superfície sólida (tiles, avatar, badges)
        copper: '#E8935F', // acento primário — energia, foco, CTA
        moss: '#93A87E', // acento secundário — estado calmo/positivo
        info: '#8AA0C7', // estados neutros/informativos (uso pontual)
        rosewood: '#C98AA3', // variedade extra em grids (uso pontual)
        ink: {
          DEFAULT: '#F5F3EF', // textPrimary — off-white quente
          secondary: '#9A9B9F',
          muted: '#6B6C70',
        },
        danger: '#C97A6F', // falta / chamada não feita (derivado da família quente)
      },
      backgroundColor: {
        glass: 'rgba(255,255,255,0.045)',
      },
      borderColor: {
        glass: 'rgba(255,255,255,0.09)',
        tile: 'rgba(255,255,255,0.06)',
        divider: 'rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}
