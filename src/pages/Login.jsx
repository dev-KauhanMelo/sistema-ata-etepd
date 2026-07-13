import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Screen from '../components/Screen'
import GlassCard from '../components/GlassCard'

export default function Login() {
  const { login } = useAuth()
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function aoEnviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await login(matricula, senha)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Screen className="flex min-h-dvh flex-col justify-center pb-6">
      <div className="mb-8 text-center">
        <p className="text-xs text-ink-secondary">ETEPD · Chamada digital</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ata Digital</h1>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={aoEnviar} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="Matrícula"
            inputMode="numeric"
            autoComplete="username"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Senha"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro && <p className="text-xs text-danger">{erro}</p>}
          <button className="btn-primary mt-2" disabled={enviando || !matricula || !senha}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </GlassCard>

      <p className="mt-6 text-center text-xs text-ink-secondary">
        Primeira vez aqui?{' '}
        <Link to="/cadastro" className="font-medium text-copper">
          Criar conta com código
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-ink-muted">
        <Link to="/coordenacao">Acesso da coordenação</Link>
      </p>
    </Screen>
  )
}
