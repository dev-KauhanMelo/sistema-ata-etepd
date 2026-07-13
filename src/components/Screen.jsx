import AmbientBackground from './AmbientBackground'

// Contêiner padrão de tela: mobile-first, conteúdo limitado a largura de
// celular e centralizado em telas maiores.
export default function Screen({ children, className = '' }) {
  return (
    <div className="relative min-h-dvh">
      <AmbientBackground />
      <div className={`relative mx-auto w-full max-w-md px-5 pb-28 pt-6 ${className}`}>
        {children}
      </div>
    </div>
  )
}
