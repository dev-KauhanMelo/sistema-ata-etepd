import { NavLink } from 'react-router-dom'

const ITENS = [
  { para: '/', rotulo: 'Início', icone: IconeCasa },
  { para: '/chamada', rotulo: 'Chamada', icone: IconeLista },
  { para: '/correcoes', rotulo: 'Correções', icone: IconeRelogio },
  { para: '/calendario', rotulo: 'Calendário', icone: IconeCalendario },
]

// Barra de navegação inferior (pill, nível 1 da hierarquia de radius).
export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2">
      <div className="glass flex items-center gap-1 rounded-full px-2 py-2">
        {ITENS.map(({ para, rotulo, icone: Icone }) => (
          <NavLink
            key={para}
            to={para}
            end={para === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 transition-colors ${
                isActive ? 'text-copper' : 'text-ink-muted'
              }`
            }
          >
            <Icone />
            <span className="text-xs font-medium">{rotulo}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function IconeCasa() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}
function IconeLista() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" />
    </svg>
  )
}
function IconeRelogio() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  )
}
function IconeCalendario() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}
