import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getChamadaDoDia,
  getPresencas,
  getAlunosDaTurma,
  iniciarOuRetomarChamada,
  marcarPresenca,
  finalizarChamada,
  janelaEdicao,
} from '../services/chamadas'
import { hojeISO, formatarDataCurta } from '../utils/date'
import Screen from '../components/Screen'
import GlassCard from '../components/GlassCard'

const OPCOES = [
  { status: 'presente', sigla: 'P', cor: '#93A87E' },
  { status: 'falta', sigla: 'F', cor: '#E8935F' },
  { status: 'falta_justificada', sigla: 'FJ', cor: '#8AA0C7' },
]

export default function Chamada() {
  const { perfil } = useAuth()
  const turma = perfil.turma
  const representanteId = perfil.representante?.id

  const alunos = useMemo(() => (turma ? getAlunosDaTurma(turma.id) : []), [turma])
  const [chamada, setChamada] = useState(() => (turma ? getChamadaDoDia(turma.id) : null))
  const [presencas, setPresencas] = useState(() => (chamada ? getPresencas(chamada.id) : []))
  const [erro, setErro] = useState('')
  // tick periódico só para reavaliar a janela de 20 min exibida — a trava
  // real é sempre checada na camada de serviço a cada ação
  const [, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const statusPorAluno = useMemo(() => {
    const mapa = {}
    for (const p of presencas) mapa[p.alunoId] = p.status
    return mapa
  }, [presencas])

  const janela = janelaEdicao(chamada)
  const marcados = presencas.length
  const completa = alunos.length > 0 && marcados === alunos.length
  const travada = janela.travada

  // Gravação incremental: cada toque persiste imediatamente UMA presença.
  // A Chamada do dia só é criada no primeiro toque (vira "parcial" no calendário).
  function marcar(alunoId, status) {
    setErro('')
    try {
      const c = chamada ?? iniciarOuRetomarChamada(turma.id)
      if (!chamada) setChamada(c)
      marcarPresenca({ chamadaId: c.id, alunoId, status, representanteId })
      setPresencas(getPresencas(c.id))
    } catch (err) {
      setErro(err.message)
    }
  }

  function finalizar() {
    setErro('')
    try {
      const c = finalizarChamada(chamada.id, representanteId)
      setChamada({ ...c })
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
        <h1 className="mt-1 text-sm font-medium">Chamada do dia</h1>
      </header>

      {/* Barra de progresso / estado da sessão */}
      <GlassCard className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-secondary">
            {marcados}/{alunos.length} marcados
          </p>
          {janela.finalizada && (
            <p className={`text-xs font-medium ${travada ? 'text-ink-muted' : 'text-moss'}`}>
              {travada ? 'Travada' : `Editável por ${janela.minutosRestantes} min`}
            </p>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${alunos.length ? (marcados / alunos.length) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #E8935F, #93A87E)',
            }}
          />
        </div>
        {travada && (
          <p className="mt-3 text-xs text-ink-muted">
            A janela de edição de 20 minutos encerrou. Atrasos e saídas agora entram
            pela aba <span className="text-copper">Correções</span>.
          </p>
        )}
      </GlassCard>

      {erro && <p className="mb-3 text-xs text-danger">{erro}</p>}

      {/* Lista de alunos */}
      <GlassCard className="divider-y px-4">
        {alunos.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-muted">
            Nenhum aluno cadastrado nesta turma ainda.
          </p>
        )}
        {alunos.map((aluno) => {
          const atual = statusPorAluno[aluno.id]
          return (
            <div key={aluno.id} className="flex items-center justify-between gap-3 py-3">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{aluno.nome}</p>
              <div className="flex gap-1.5">
                {OPCOES.map(({ status, sigla, cor }) => {
                  const ativo = atual === status
                  return (
                    <button
                      key={status}
                      disabled={travada}
                      onClick={() => marcar(aluno.id, status)}
                      className="h-9 min-w-9 rounded-xl px-2 text-xs font-medium transition-colors disabled:opacity-40"
                      style={
                        ativo
                          ? { backgroundColor: `${cor}22`, border: `1px solid ${cor}55`, color: cor }
                          : { backgroundColor: '#17181C', border: '1px solid rgba(255,255,255,0.06)', color: '#9A9B9F' }
                      }
                    >
                      {sigla}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </GlassCard>

      {/* Finalizar — disponível a qualquer um dos dois representantes */}
      {!janela.finalizada && alunos.length > 0 && (
        <button className="btn-primary mt-5" disabled={!completa} onClick={finalizar}>
          {completa ? 'Finalizar chamada' : `Marque todos para finalizar (${alunos.length - marcados} restantes)`}
        </button>
      )}
      {janela.finalizada && !travada && (
        <p className="mt-4 text-center text-xs text-ink-muted">
          Chamada finalizada — correções de emergência liberadas por mais {janela.minutosRestantes} min.
        </p>
      )}
    </Screen>
  )
}
