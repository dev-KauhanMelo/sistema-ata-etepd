// Contêiner principal (nível 2 da hierarquia de border-radius: rounded-3xl).
export default function GlassCard({ children, className = '' }) {
  return <div className={`glass rounded-3xl ${className}`}>{children}</div>
}
