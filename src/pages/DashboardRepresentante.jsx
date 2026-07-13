import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getChamadaDoDia, getPresencas, getAlunosDaTurma, janelaEdicao } from '../services/chamadas'
import { saudacao, hojeISO, formatarDataCurta } from '../utils/date'
import Screen from '../components/Screen'
import GlassCard from '../components/GlassCard'
import ProgressRing from '../components/ProgressRing'

export default function DashboardRepresentante() {
  const { perfil, logout } = useAuth()
  const { usuario, turma } = perfil

  const resumo = useMemo(() => {
    if (!turma) return null
    const alunos = getAlunosDaTurma(turma.id)
    const chamada = getChamadaDoDia(turma.id)
    const presencas = chamada ? getPresencas(chamada.id) : []
    const faltas = presencas.filter((p) => p.status !== 'presente').length
    return {
      total: alunos.length,
      marcados: presencas.length,
      faltas,
      chamada,
      janela: janelaEdicao(chamada),
    }
  }, [turma])

  const percentual = resumo?.total ? (resumo.marcados / resumo.total) * 100 : 0

  return (
    <Screen>
      {/* Cabeçalho */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="tile flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium text-copper">
            {usuario.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-ink-secondary">{saudacao()},</p>
            <p className="text-sm font-medium">{usuario.nome.split(' ')[0]}</p>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-ink-muted">Sair</button>
      </header>

      {!turma ? (
        <GlassCard className="p-6">
          <p className="text-sm text-ink-secondary">
            Você não está vinculado(a) como representante ativo de nenhuma turma.
            Fale com a coordenação.
          </p>
        </GlassCard>
      ) : (
        <>
          {/* Card hero: estado da chamada de hoje */}
          <GlassCard className="flex flex-col items-center p-6">
            <p className="self-start text-xs text-ink-secondary">
              {turma.nome} · {formatarDataCurta(hojeISO())}
            </p>
            <div className="mt-4">
              <ProgressRing
                percentual={percentual}
                valor={`${resumo.marcados}/${resumo.total}`}
                label="alunos marcados"
              />
            </div>
            <div className="mt-5 flex w-full gap-3">
              <Chip cor="#93A87E" rotulo="Status" valor={statusDoDia(resumo)} />
              <Chip cor="#E8935F" rotulo="Faltas hoje" valor={resumo.marcados ? resumo.faltas : '—'} />
            </div>
          </GlassCard>

          {/* Ações rápidas */}
          <p className="mb-3 mt-6 text-xs font-medium text-ink-secondary">Ações rápidas</p>
          <div className="grid grid-cols-2 gap-3">
            <Tile
              para="/chamada"
              cor="#E8935F"
              titulo={resumo.chamada ? (resumo.janela.finalizada ? 'Ver chamada' : 'Continuar chamada') : 'Fazer chamada'}
              subtitulo="do dia de hoje"
              icone={<IconeCheck />}
            />
            <Tile
              para="/correcoes"
              cor="#93A87E"
              titulo="Correções"
              subtitulo="chegada / saída"
              icone={<IconeRelogio />}
            />
            <Tile
              para="/calendario"
              cor="#8AA0C7"
              titulo="Calendário"
              subtitulo="histórico da turma"
              icone={<IconeCalendario />}
            />
          </div>
        </>
      )}
    </Screen>
  )
}

function statusDoDia(resumo) {
  if (!resumo.chamada) return 'Não feita'
  if (resumo.chamada.status === 'completa') return 'Finalizada'
  return 'Em andamento'
}

function Chip({ cor, rotulo, valor }) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-2xl p-4 tile">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} />
      <div>
        <p className="text-xs text-ink-muted">{rotulo}</p>
        <p className="text-sm font-medium">{valor}</p>
      </div>
    </div>
  )
}

function Tile({ para, cor, titulo, subtitulo, icone }) {
  return (
    <Link to={para} className="tile flex flex-col gap-3 rounded-2xl p-4 active:opacity-80">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${cor}22`, color: cor }}
      >
        {icone}
      </span>
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-xs text-ink-muted">{subtitulo}</p>
      </div>
    </Link>
  )
}

function IconeCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function IconeRelogio() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  )
}
function IconeCalendario() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}
