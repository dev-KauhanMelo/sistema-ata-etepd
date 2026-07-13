import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getChamadaDoDia,
  getPresencas,
  getAlunosDaTurma,
  aplicarCorrecaoPontual,
  getCorrecoesDaChamada,
} from '../services/chamadas'
import { hojeISO, formatarDataCurta, formatarHora } from '../utils/date'
import Screen from '../components/Screen'
import GlassCard from '../components/GlassCard'

// Correções pontuais: ação separada da chamada, sempre disponível,
// independente da trava de 20 minutos (contexto §3.4/§4.3.4).
export default function Correcoes() {
  const { perfil } = useAuth()
  const turma = perfil.turma
  const representanteId = perfil.representante?.id

  const [chamada] = useState(() => (turma ? getChamadaDoDia(turma.id) : null))
  const [presencas, setPresencas] = useState(() => (chamada ? getPresencas(chamada.id) : []))
  const [correcoes, setCorrecoes] = useState(() => (chamada ? getCorrecoesDaChamada(chamada.id) : []))
  const [erro, setErro] = useState('')

  const alunos = useMemo(() => (turma ? getAlunosDaTurma(turma.id) : []), [turma])
  const alunosPorId = useMemo(() => new Map(alunos.map((a) => [a.id, a])), [alunos])
  const presencasPorId = useMemo(() => new Map(presencas.map((p) => [p.id, p])), [presencas])

  function aplicar(presencaId, tipo) {
    setErro('')
    try {
      aplicarCorrecaoPontual({ presencaId, tipo, representanteId })
      setPresencas(getPresencas(chamada.id))
      setCorrecoes(getCorrecoesDaChamada(chamada.id))
    } catch (err) {
      setErro(err.message)
    }
  }

  if (!turma) {
    return (
      <Screen>
        <p className="text-sm text-ink-secondary">Sem turma vinculada.</p>
      </Screen>
    )
  }

  return (
    <Screen>
      <header className="mb-4">
        <p className="text-xs text-ink-secondary">{turma.nome} · {formatarDataCurta(hojeISO())}</p>
        <h1 className="mt-1 text-sm font-medium">Correções pontuais</h1>
      </header>

      {!chamada ? (
        <GlassCard className="p-6">
          <p className="text-sm text-ink-secondary">
            A chamada de hoje ainda não foi iniciada. Faça a chamada primeiro —
            correções se aplicam sobre os alunos já marcados.
          </p>
        </GlassCard>
      ) : (
        <>
          {erro && <p className="mb-3 text-xs text-danger">{erro}</p>}

          <GlassCard className="divider-y px-4">
            {presencas.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-muted">Nenhum aluno marcado ainda.</p>
            )}
            {[...presencas]
              .sort((a, b) =>
                (alunosPorId.get(a.alunoId)?.nome || '').localeCompare(alunosPorId.get(b.alunoId)?.nome || '', 'pt-BR')
              )
              .map((p) => {
                const aluno = alunosPorId.get(p.alunoId)
                if (!aluno) return null
                const presente = p.status === 'presente'
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{aluno.nome}</p>
                      <p className="text-xs" style={{ color: presente ? '#93A87E' : '#E8935F' }}>
                        {p.status === 'presente' ? 'Presente' : p.status === 'falta' ? 'Falta' : 'Falta justificada'}
                      </p>
                    </div>
                    {presente ? (
                      <BotaoCorrecao cor="#E8935F" onClick={() => aplicar(p.id, 'saida_antecipada')}>
                        Saída antecipada
                      </BotaoCorrecao>
                    ) : (
                      <BotaoCorrecao cor="#93A87E" onClick={() => aplicar(p.id, 'chegada_tardia')}>
                        Chegou agora
                      </BotaoCorrecao>
                    )}
                  </div>
                )
              })}
          </GlassCard>

          {/* Registro de auditoria do dia */}
          {correcoes.length > 0 && (
            <>
              <p className="mb-3 mt-6 text-xs font-medium text-ink-secondary">Registradas hoje</p>
              <GlassCard className="divider-y px-4">
                {correcoes.map((c) => {
                  const presenca = presencasPorId.get(c.presencaId)
                  const aluno = presenca ? alunosPorId.get(presenca.alunoId) : null
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-medium"
                        style={{
                          backgroundColor: c.tipo === 'chegada_tardia' ? '#93A87E18' : '#E8935F18',
                          color: c.tipo === 'chegada_tardia' ? '#93A87E' : '#E8935F',
                        }}
                      >
                        {c.tipo === 'chegada_tardia' ? '→' : '←'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{aluno?.nome || 'Aluno'}</p>
                        <p className="text-xs text-ink-muted">
                          {c.tipo === 'chegada_tardia' ? 'Chegada tardia' : 'Saída antecipada'} · {formatarHora(c.horario)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </GlassCard>
            </>
          )}
        </>
      )}
    </Screen>
  )
}

function BotaoCorrecao({ cor, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium active:opacity-80"
      style={{ backgroundColor: `${cor}14`, border: `1px solid ${cor}55`, color: cor }}
    >
      {children}
    </button>
  )
}
