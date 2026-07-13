// Halo/glow ambiente (design-sistema.md §3.2): dois blobs desfocados nos
// cantos opostos, atrás de todo o conteúdo — dá atmosfera ao fundo escuro.
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute rounded-full blur-3xl"
        style={{ width: 320, height: 320, top: -60, left: -60, backgroundColor: '#E8935F', opacity: 0.25 }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{ width: 280, height: 280, bottom: -40, right: -40, backgroundColor: '#93A87E', opacity: 0.2 }}
      />
    </div>
  )
}
