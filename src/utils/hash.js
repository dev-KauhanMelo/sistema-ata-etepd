// Hash de senha via Web Crypto (SHA-256).
// Suficiente para a v1 local-first; ao migrar para Supabase, a auth
// passa a ser a do próprio Supabase e este utilitário é descartado.
export async function hashSenha(senha) {
  const data = new TextEncoder().encode(senha)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
