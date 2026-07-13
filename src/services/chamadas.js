import { getDB, mutate, uid, agora } from './storage.js'
import { hojeISO, ehFimDeSemana } from '../utils/date.js'

export const JANELA_EDICAO_MINUTOS = 20

export const STATUS_PRESENCA = {
  presente: { rotulo: 'Presente', sigla: 'P' },
  falta: { rotulo: 'Falta', sigla: 'F' },
  falta_justificada: { rotulo: 'Falta justificada', sigla: 'FJ' },
}

// A Chamada é um registro ÚNICO por turma+dia, compartilhado pelos dois
// representantes — qualquer um vê o estado parcial do colega e continua
// de onde parou (contexto §4.3).
export function getChamadaDoDia(turmaId, data = hojeISO()) {
  const db = getDB()
  return db.chamadas.find((c) => c.turmaId === turmaId && c.data === data) || null
}

export function iniciarOuRetomarChamada(turmaId, data = hojeISO()) {
  return mutate((db) => {
    let chamada = db.chamadas.find((c) => c.turmaId === turmaId && c.data === data)
    if (!chamada) {
      chamada = {
        id: uid(),
        turmaId,
        data,
        status: 'parcial',
        finalizadaEm: null,
        finalizadaPorRepresentanteId: null,
        criadaEm: agora(),
      }
      db.chamadas.push(chamada)
    }
    return chamada
  })
}

export function getPresencas(chamadaId) {
  const db = getDB()
  return db.presencas.filter((p) => p.chamadaId === chamadaId)
}

export function getAlunosDaTurma(turmaId) {
  const db = getDB()
  return db.alunos
    .filter((a) => a.turmaId === turmaId && a.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

// Estado da janela de edição pós-finalização (contexto §3.6).
// A checagem vive aqui na camada de serviço ("backend"), não em timer de tela.
export function janelaEdicao(chamada) {
  if (!chamada?.finalizadaEm) return { finalizada: false, travada: false, minutosRestantes: null }
  const decorridoMs = Date.now() - new Date(chamada.finalizadaEm).getTime()
  const restanteMs = JANELA_EDICAO_MINUTOS * 60_000 - decorridoMs
  return {
    finalizada: true,
    travada: restanteMs <= 0,
    minutosRestantes: restanteMs > 0 ? Math.ceil(restanteMs / 60_000) : 0,
  }
}

// Gravação incremental: upsert de UMA presença a cada toque (autosave
// otimista, contexto §4.3.2), sempre registrando qual representante marcou.
export function marcarPresenca({ chamadaId, alunoId, status, representanteId }) {
  return mutate((db) => {
    const chamada = db.chamadas.find((c) => c.id === chamadaId)
    if (!chamada) throw new Error('Chamada não encontrada.')
    if (janelaEdicao(chamada).travada)
      throw new Error('A chamada deste dia já está travada. Use uma correção pontual.')

    let presenca = db.presencas.find((p) => p.chamadaId === chamadaId && p.alunoId === alunoId)
    if (presenca) {
      presenca.status = status
      presenca.atualizadoEm = agora()
      presenca.ultimaAtualizacaoPorRepresentanteId = representanteId
    } else {
      presenca = {
        id: uid(),
        chamadaId,
        alunoId,
        status,
        atualizadoEm: agora(),
        ultimaAtualizacaoPorRepresentanteId: representanteId,
      }
      db.presencas.push(presenca)
    }
    return presenca
  })
}

export function finalizarChamada(chamadaId, representanteId) {
  return mutate((db) => {
    const chamada = db.chamadas.find((c) => c.id === chamadaId)
    if (!chamada) throw new Error('Chamada não encontrada.')
    const alunos = db.alunos.filter((a) => a.turmaId === chamada.turmaId && a.ativo !== false)
    const marcados = db.presencas.filter((p) => p.chamadaId === chamadaId)
    if (marcados.length < alunos.length)
      throw new Error(`Ainda faltam ${alunos.length - marcados.length} aluno(s) para marcar.`)
    chamada.status = 'completa'
    chamada.finalizadaEm = agora()
    chamada.finalizadaPorRepresentanteId = representanteId
    return chamada
  })
}

// Correção pontual: ação SEPARADA da chamada, disponível a qualquer hora do
// dia, independente da trava de 20 minutos (contexto §3.4/§4.3.4).
// Sempre gera registro de auditoria com timestamp e autoria obrigatória.
export function aplicarCorrecaoPontual({ presencaId, tipo, representanteId, observacao }) {
  if (!representanteId) throw new Error('Autoria da correção é obrigatória.')
  return mutate((db) => {
    const presenca = db.presencas.find((p) => p.id === presencaId)
    if (!presenca) throw new Error('Presença não encontrada.')

    if (tipo === 'chegada_tardia') {
      if (presenca.status === 'presente')
        throw new Error('Este aluno já está marcado como presente.')
      presenca.status = 'presente'
    } else if (tipo === 'saida_antecipada') {
      if (presenca.status !== 'presente')
        throw new Error('Saída antecipada só se aplica a aluno presente.')
      // status permanece "presente"; o registro de auditoria guarda a saída
    } else {
      throw new Error('Tipo de correção inválido.')
    }

    presenca.atualizadoEm = agora()
    presenca.ultimaAtualizacaoPorRepresentanteId = representanteId

    const correcao = {
      id: uid(),
      presencaId,
      representanteId,
      tipo,
      horario: agora(),
      observacao: observacao?.trim() || null,
    }
    db.correcoes.push(correcao)
    return correcao
  })
}

export function getCorrecoesDaChamada(chamadaId) {
  const db = getDB()
  const idsPresencas = new Set(
    db.presencas.filter((p) => p.chamadaId === chamadaId).map((p) => p.id)
  )
  return db.correcoes
    .filter((c) => idsPresencas.has(c.presencaId))
    .sort((a, b) => b.horario.localeCompare(a.horario))
}

// View agregada para o calendário — derivada dos dados completos, que são
// permanentes (nenhuma rotina de exclusão existe ou deve existir, §3.5).
// verde=completa, laranja=parcial, vermelho=dia letivo passado sem chamada.
export function getResumoMes(turmaId, ano, mes /* 1-12 */) {
  const db = getDB()
  const hoje = hojeISO()
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const resumo = {}
  for (let d = 1; d <= diasNoMes; d++) {
    const iso = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (ehFimDeSemana(iso) || iso > hoje) continue
    const chamada = db.chamadas.find((c) => c.turmaId === turmaId && c.data === iso)
    if (!chamada) resumo[iso] = 'nao_feita'
    else if (chamada.status === 'completa') resumo[iso] = 'completa'
    else resumo[iso] = 'parcial'
  }
  return resumo
}

// Detalhe de um dia passado — consulta que a coordenação também usará no
// futuro; só é possível porque os dados brutos são preservados.
export function getDetalheDia(turmaId, data) {
  const db = getDB()
  const chamada = db.chamadas.find((c) => c.turmaId === turmaId && c.data === data)
  if (!chamada) return null
  const presencas = db.presencas.filter((p) => p.chamadaId === chamada.id)
  const alunos = new Map(db.alunos.map((a) => [a.id, a]))
  return {
    chamada,
    presencas: presencas
      .map((p) => ({ ...p, aluno: alunos.get(p.alunoId) }))
      .sort((a, b) => (a.aluno?.nome || '').localeCompare(b.aluno?.nome || '', 'pt-BR')),
    correcoes: getCorrecoesDaChamada(chamada.id),
  }
}
