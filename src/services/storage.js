// Camada de persistência local (localStorage).
// Esta é a implementação v1 da camada de dados. Toda a lógica de domínio
// (services/*.js) fala apenas com estas funções — quando o backend
// Supabase/Prisma for plugado, só esta camada e os services mudam de
// implementação interna; as telas não são afetadas.

const DB_KEY = 'ata-etepd-db-v1'

const DB_VAZIO = {
  turmas: [],
  alunos: [],
  usuarios: [],
  representantes: [],
  chamadas: [],
  presencas: [],
  correcoes: [],
  codigos: [],
}

export function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return structuredClone(DB_VAZIO)
    return { ...structuredClone(DB_VAZIO), ...JSON.parse(raw) }
  } catch {
    return structuredClone(DB_VAZIO)
  }
}

export function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

// Atualização atômica: lê, aplica a mutação e grava de uma vez.
export function mutate(fn) {
  const db = getDB()
  const result = fn(db)
  saveDB(db)
  return result
}

export function uid() {
  return crypto.randomUUID()
}

export function agora() {
  return new Date().toISOString()
}
