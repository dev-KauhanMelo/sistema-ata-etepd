import { getDB, mutate, uid, agora } from './storage.js'

// Página primitiva de coordenação: fora do RBAC, protegida por senha única
// compartilhada (contexto §4.5). Configurável via .env (VITE_COORD_SENHA).
const SENHA_PADRAO = 'etepd2026'
const COORD_SESSION_KEY = 'ata-etepd-coord'

export function validarSenhaCoordenacao(senha) {
  const esperada = import.meta.env.VITE_COORD_SENHA || SENHA_PADRAO
  if (senha !== esperada) return false
  sessionStorage.setItem(COORD_SESSION_KEY, '1')
  return true
}

export function coordenacaoAutenticada() {
  return sessionStorage.getItem(COORD_SESSION_KEY) === '1'
}

export function sairCoordenacao() {
  sessionStorage.removeItem(COORD_SESSION_KEY)
}

// ---- Turmas ----

export function listarTurmas() {
  return getDB().turmas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function criarTurma(nome, codigoPlanilha = null) {
  if (!nome.trim()) throw new Error('Informe o nome da turma.')
  return mutate((db) => {
    if (db.turmas.some((t) => t.nome.toLowerCase() === nome.trim().toLowerCase()))
      throw new Error('Já existe uma turma com esse nome.')
    const turma = { id: uid(), nome: nome.trim(), codigoPlanilha, criadoEm: agora() }
    db.turmas.push(turma)
    return turma
  })
}

// ---- Alunos (CRUD manual — mecanismo de TODA manutenção contínua, §3.7) ----

export function listarAlunos(turmaId) {
  return getDB()
    .alunos.filter((a) => a.turmaId === turmaId && a.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function adicionarAluno(turmaId, matricula, nome) {
  if (!String(matricula).trim() || !nome.trim()) throw new Error('Informe matrícula e nome.')
  return mutate((db) => {
    if (db.alunos.some((a) => a.matricula === String(matricula).trim() && a.ativo !== false))
      throw new Error('Já existe um aluno ativo com esta matrícula.')
    const aluno = {
      id: uid(),
      matricula: String(matricula).trim(),
      nome: nome.trim(),
      turmaId,
      ativo: true,
      criadoEm: agora(),
    }
    db.alunos.push(aluno)
    return aluno
  })
}

export function editarAluno(alunoId, { matricula, nome }) {
  return mutate((db) => {
    const aluno = db.alunos.find((a) => a.id === alunoId)
    if (!aluno) throw new Error('Aluno não encontrado.')
    if (matricula) aluno.matricula = String(matricula).trim()
    if (nome) aluno.nome = nome.trim()
    return aluno
  })
}

// Remoção segue o padrão deactivate-not-delete quando há histórico de
// presença — preserva integridade referencial dos registros passados.
export function removerAluno(alunoId) {
  return mutate((db) => {
    const aluno = db.alunos.find((a) => a.id === alunoId)
    if (!aluno) throw new Error('Aluno não encontrado.')
    const temHistorico = db.presencas.some((p) => p.alunoId === alunoId)
    if (temHistorico) {
      aluno.ativo = false
    } else {
      db.alunos = db.alunos.filter((a) => a.id !== alunoId)
    }
  })
}

// ---- Códigos de matrícula (whitelist de cadastro) ----
// No desenho original os códigos vêm de um programa externo; esta seção da
// coordenação cumpre esse papel de geração para o bootstrap da v1.

export function listarCodigos() {
  const db = getDB()
  const usuarios = new Map(db.usuarios.map((u) => [u.id, u]))
  return db.codigos
    .map((c) => ({ ...c, usadoPor: c.usadoPorUsuarioId ? usuarios.get(c.usadoPorUsuarioId) : null }))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
}

export function gerarCodigo(cargo) {
  return mutate((db) => {
    let codigo
    do {
      codigo = String(Math.floor(100000 + Math.random() * 900000))
    } while (db.codigos.some((c) => c.codigo === codigo))
    const registro = { codigo, cargo, usado: false, usadoPorUsuarioId: null, criadoEm: agora() }
    db.codigos.push(registro)
    return registro
  })
}

// Troca de representante: desativa o vínculo, nunca deleta (contexto §2.4).
export function desativarRepresentante(representanteId) {
  return mutate((db) => {
    const rep = db.representantes.find((r) => r.id === representanteId)
    if (!rep) throw new Error('Representante não encontrado.')
    rep.ativo = false
    rep.fimEm = agora()
  })
}

export function listarRepresentantes(turmaId) {
  const db = getDB()
  const usuarios = new Map(db.usuarios.map((u) => [u.id, u]))
  return db.representantes
    .filter((r) => r.turmaId === turmaId)
    .map((r) => ({ ...r, usuario: usuarios.get(r.usuarioId) }))
}
