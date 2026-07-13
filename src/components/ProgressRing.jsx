// Anel de progresso com gradiente cobre→musgo — elemento de assinatura da
// interface (design-sistema.md §3.3). Único ponto onde as duas cores de
// acento se misturam intencionalmente.
export default function ProgressRing({
  percentual = 0,
  size = 148,
  strokeWidth = 10,
  valor,
  label,
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, percentual)) / 100)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* halo local atrás do anel */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          backgroundColor: '#E8935F',
          opacity: 0.4,
        }}
        aria-hidden="true"
      />
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} className="relative">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8935F" />
            <stop offset="100%" stopColor="#93A87E" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'all 700ms ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold tracking-tight text-ink">{valor}</span>
        {label && <span className="text-xs text-ink-secondary">{label}</span>}
      </div>
    </div>
  )
}
