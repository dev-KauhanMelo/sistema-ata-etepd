import { getDB, mutate, uid, agora } from './storage.js'
import { hashSenha } from '../utils/hash.js'

const SESSION_KEY = 'ata-etepd-sessao'
export const MAX_REPRESENTANTES_ATIVOS = 2 // dois por turma, redundância mútua (contexto §3.9)

// Cadastro por código de matrícula: funciona como whitelist/convite —
// só quem possui um código válido (gerado na coordenação) consegue se cadastrar.
export async function cadastrar({ codigo, senha, nome, cargo, turmaId }) {
  const codigoLimpo = codigo.trim()
  if (!codigoLimpo || !senha || !nome.trim()) throw new Error('Preencha todos os campos.')
  if (senha.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
  if (cargo === 'aluno' && !turmaId) throw new Error('Selecione a sua turma.')

  const senhaHash = await hashSenha(senha)

  return mutate((db) => {
    const registro = db.codigos.find((c) => c.codigo === codigoLimpo)
    if (!registro) throw new Error('Código de matrícula inválido.')
    if (registro.usado) throw new Error('Este código já foi utilizado.')
    if (registro.cargo && registro.cargo !== cargo)
      throw new Error(`Este código é válido apenas para o cargo "${registro.cargo}".`)
    if (db.usuarios.some((u) => u.matricula === codigoLimpo))
      throw new Error('Já existe um usuário com esta matrícula.')

    if (cargo === 'aluno') {
      const ativos = db.representantes.filter((r) => r.turmaId === turmaId && r.ativo)
      if (ativos.length >= MAX_REPRESENTANTES_ATIVOS)
        throw new Error('Esta turma já possui dois representantes ativos.')
    }

    const usuario = {
      id: uid(),
      matricula: codigoLimpo,
      senhaHash,
      cargo,
      nome: nome.trim(),
      criadoEm: agora(),
    }
    db.usuarios.push(usuario)

    if (cargo === 'aluno') {
      db.representantes.push({
        id: uid(),
        usuarioId: usuario.id,
        turmaId,
        ativo: true,
        inicioEm: agora(),
        fimEm: null,
      })
    }

    registro.usado = true
    registro.usadoPorUsuarioId = usuario.id

    localStorage.setItem(SESSION_KEY, JSON.stringify({ usuarioId: usuario.id }))
    return usuario.id
  })
}

export async function login(matricula, senha) {
  const db = getDB()
  const usuario = db.usuarios.find((u) => u.matricula === matricula.trim())
  if (!usuario) throw new Error('Matrícula ou senha incorretos.')
  const senhaHash = await hashSenha(senha)
  if (usuario.senhaHash !== senhaHash) throw new Error('Matrícula ou senha incorretos.')
  // Sessão persistente no dispositivo — evita reautenticação repetida (contexto §4.2)
  localStorage.setItem(SESSION_KEY, JSON.stringify({ usuarioId: usuario.id }))
  return usuario.id
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSessao() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

// Perfil completo pós-login: usuário + (se aluno) vínculo de representante e turma.
// É a base do RBAC — o cargo vem do banco, nunca de seleção manual.
export function getPerfil(usuarioId) {
  const db = getDB()
  const usuario = db.usuarios.find((u) => u.id === usuarioId)
  if (!usuario) return null
  let representante = null
  let turma = null
  if (usuario.cargo === 'aluno') {
    representante = db.representantes.find((r) => r.usuarioId === usuario.id && r.ativo) || null
    if (representante) turma = db.turmas.find((t) => t.id === representante.turmaId) || null
  }
  return { usuario, representante, turma }
}
