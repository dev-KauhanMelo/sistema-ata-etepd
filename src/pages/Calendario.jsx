import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getResumoMes, getDetalheDia } from '../services/chamadas'
import { MESES, DIAS_SEMANA_CURTOS, formatarDataCurta, formatarHora } from '../utils/date'
import Screen from '../components/Screen'
import GlassCard from '../components/GlassCard'

const COR_STATUS = {
  completa: '#93A87E', // verde: chamada feita/completa
  parcial: '#E8935F', // laranja: iniciada mas não finalizada
  nao_feita: '#C97A6F', // vermelho: dia letivo passado sem chamada
}

// View agregada sobre os dados completos — os detalhes de cada dia nunca são
// apagados (contexto §3.5), por isso o toque num dia abre a chamada completa.
export default function Calendario() {
  const { perfil } = useAuth()
  const turma = perfil.turma

  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [diaSelecionado, setDiaSelecionado] = useState(null)

  const resumo = useMemo(
    () => (turma ? getResumoMes(turma.id, ano, mes) : {}),
    [turma, ano, mes]
  )
  const detalhe = useMemo(
    () => (diaSelecionado && turma ? getDetalheDia(turma.id, diaSelecionado) : null),
    [diaSelecionado, turma]
  )

  function mudarMes(delta) {
    setDiaSelecionado(null)
    let m = mes + delta
    let a = ano
    if (m < 1) { m = 12; a-- }
    if (m > 12) { m = 1; a++ }
    setMes(m)
    setAno(a)
  }

  if (!turma) {
    return (
      <Screen>
        <p className="text-sm text-ink-secondary">Sem turma vinculada.</p>
      </Screen>
    )
  }

  const diasNoMes = new Date(ano, mes, 0).getDate()
  const primeiroDow = new Date(ano, mes - 1, 1).getDay()

  return (
    <Screen>
      <header className="mb-4">
        <p className="text-xs text-ink-secondary">{turma.nome}</p>
        <h1 className="mt-1 text-sm font-medium">Histórico de chamadas</h1>
      </header>

      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => mudarMes(-1)} className="tile flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary">‹</button>
          <p className="text-sm font-medium">{MESES[mes - 1]} {ano}</p>
          <button onClick={() => mudarMes(1)} className="tile flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA_CURTOS.map((d, i) => (
            <span key={i} className="py-1 text-xs text-ink-muted">{d}</span>
          ))}
          {Array.from({ length: primeiroDow }).map((_, i) => <span key={`v${i}`} />)}
          {Array.from({ length: diasNoMes }).map((_, i) => {
            const dia = i + 1
            const iso = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
            const status = resumo[iso]
            const selecionado = diaSelecionado === iso
            return (
              <button
                key={dia}
                onClick={() => setDiaSelecionado(selecionado ? null : iso)}
                className="flex flex-col items-center gap-0.5 rounded-xl py-1.5"
                style={selecionado ? { backgroundColor: 'rgba(255,255,255,0.06)' } : undefined}
              >
                <span className={`text-xs ${status ? 'text-ink' : 'text-ink-muted'}`}>{dia}</span>
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: status ? COR_STATUS[status] : 'transparent' }}
                />
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Legenda cor={COR_STATUS.completa} rotulo="Feita" />
          <Legenda cor={COR_STATUS.parcial} rotulo="Parcial" />
          <Legenda cor={COR_STATUS.nao_feita} rotulo="Não feita" />
        </div>
      </GlassCard>

      {/* Detalhe do dia selecionado — leitura dos dados brutos preservados */}
      {diaSelecionado && (
        <>
          <p className="mb-3 mt-6 text-xs font-medium text-ink-secondary">
            {formatarDataCurta(diaSelecionado)}
          </p>
          {!detalhe ? (
            <GlassCard className="p-6">
              <p className="text-xs text-ink-muted">Nenhuma chamada registrada neste dia.</p>
            </GlassCard>
          ) : (
            <GlassCard className="divider-y px-4">
              {detalhe.presencas.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{p.aluno?.nome}</p>
                  <StatusBadge status={p.status} />
                </div>
              ))}
              {detalhe.chamada.finalizadaEm && (
                <p className="py-3 text-xs text-ink-muted">
                  Finalizada às {formatarHora(detalhe.chamada.finalizadaEm)}
                  {detalhe.correcoes.length > 0 && ` · ${detalhe.correcoes.length} correção(ões) pontual(is)`}
                </p>
              )}
            </GlassCard>
          )}
        </>
      )}
    </Screen>
  )
}

function Legenda({ cor, rotulo }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} />
      {rotulo}
    </span>
  )
}

function StatusBadge({ status }) {
  const mapa = {
    presente: { rotulo: 'P', cor: '#93A87E' },
    falta: { rotulo: 'F', cor: '#E8935F' },
    falta_justificada: { rotulo: 'FJ', cor: '#8AA0C7' },
  }
  const { rotulo, cor } = mapa[status] || { rotulo: '?', cor: '#6B6C70' }
  return (
    <span
      className="flex h-7 min-w-7 items-center justify-center rounded-xl px-1.5 text-xs font-medium"
      style={{ backgroundColor: `${cor}18`, color: cor }}
    >
      {rotulo}
    </span>
  )
}
