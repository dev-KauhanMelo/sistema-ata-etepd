import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listarTurmas } from '../services/coordenacao'
import Screen from '../components/Screen'
import GlassCard from '../components/GlassCard'

export default function Cadastro() {
  const { cadastrar } = useAuth()
  const [turmas] = useState(listarTurmas)
  const [form, setForm] = useState({ codigo: '', nome: '', senha: '', cargo: 'aluno', turmaId: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  function campo(nome) {
    return {
      value: form[nome],
      onChange: (e) => setForm((f) => ({ ...f, [nome]: e.target.value })),
    }
  }

  async function aoEnviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await cadastrar(form)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Screen className="flex min-h-dvh flex-col justify-center pb-6">
      <div className="mb-8 text-center">
        <p className="text-xs text-ink-secondary">Cadastro por convite</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Criar conta</h1>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={aoEnviar} className="flex flex-col gap-3">
          <input className="input" placeholder="Código de matrícula (fornecido pela escola)" inputMode="numeric" {...campo('codigo')} />
          <input className="input" placeholder="Nome completo" autoComplete="name" {...campo('nome')} />
          <input className="input" type="password" placeholder="Senha (mín. 6 caracteres)" autoComplete="new-password" {...campo('senha')} />

          {/* v1: apenas aluno (representante) e professor — sem coordenação/gestão */}
          <div className="grid grid-cols-2 gap-3">
            {['aluno', 'professor'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, cargo: c }))}
                className={`rounded-2xl p-4 text-sm font-medium transition-colors ${
                  form.cargo === c
                    ? 'border text-copper'
                    : 'tile text-ink-secondary'
                }`}
                style={
                  form.cargo === c
                    ? { backgroundColor: '#E8935F14', borderColor: '#E8935F55' }
                    : undefined
                }
              >
                {c === 'aluno' ? 'Representante' : 'Professor'}
              </button>
            ))}
          </div>

          {form.cargo === 'aluno' && (
            <select className="input appearance-none" {...campo('turmaId')}>
              <option value="">Selecione a sua turma…</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          )}
          {form.cargo === 'aluno' && turmas.length === 0 && (
            <p className="text-xs text-ink-muted">
              Nenhuma turma cadastrada ainda — peça à coordenação para fazer a carga inicial.
            </p>
          )}

          {erro && <p className="text-xs text-danger">{erro}</p>}
          <button className="btn-primary mt-2" disabled={enviando}>
            {enviando ? 'Criando…' : 'Criar conta'}
          </button>
        </form>
      </GlassCard>

      <p className="mt-6 text-center text-xs text-ink-secondary">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-copper">Entrar</Link>
      </p>
    </Screen>
  )
}
