import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  validarSenhaCoordenacao,
  coordenacaoAutenticada,
  sairCoordenacao,
  listarTurmas,
  criarTurma,
  listarAlunos,
  adicionarAluno,
  editarAluno,
  removerAluno,
  listarCodigos,
  gerarCodigo,
  listarRepresentantes,
  desativarRepresentante,
} from '../services/coordenacao'
import { lerArquivoParaPreview, confirmarImport } from '../services/importExcel'
import Screen from '../components/Screen'
import GlassCard from '../components/GlassCard'

// Página primitiva de coordenação (contexto §4.5): ferramenta utilitária
// isolada, fora do RBAC, protegida por senha única compartilhada.
export default function Coordenacao() {
  const [autenticada, setAutenticada] = useState(coordenacaoAutenticada)
  return autenticada ? (
    <Painel aoSair={() => { sairCoordenacao(); setAutenticada(false) }} />
  ) : (
    <Portao aoEntrar={() => setAutenticada(true)} />
  )
}

function Portao({ aoEntrar }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  function enviar(e) {
    e.preventDefault()
    if (validarSenhaCoordenacao(senha)) aoEntrar()
    else setErro('Senha incorreta.')
  }

  return (
    <Screen className="flex min-h-dvh flex-col justify-center pb-6">
      <div className="mb-8 text-center">
        <p className="text-xs text-ink-secondary">Área restrita</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Coordenação</h1>
      </div>
      <GlassCard className="p-6">
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <input
            className="input"
            type="password"
            placeholder="Senha da coordenação"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro && <p className="text-xs text-danger">{erro}</p>}
          <button className="btn-primary mt-2" disabled={!senha}>Entrar</button>
        </form>
      </GlassCard>
      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link to="/login">Voltar ao login</Link>
      </p>
    </Screen>
  )
}

const ABAS = [
  { id: 'turmas', rotulo: 'Turmas' },
  { id: 'import', rotulo: 'Importar' },
  { id: 'codigos', rotulo: 'Códigos' },
]

function Painel({ aoSair }) {
  const [aba, setAba] = useState('turmas')
  return (
    <Screen>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-secondary">ETEPD</p>
          <h1 className="mt-0.5 text-sm font-medium">Coordenação</h1>
        </div>
        <button onClick={aoSair} className="text-xs text-ink-muted">Sair</button>
      </header>

      <div className="mb-5 flex gap-2">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className="rounded-full px-4 py-2 text-xs font-medium transition-colors"
            style={
              aba === a.id
                ? { backgroundColor: '#E8935F14', border: '1px solid #E8935F55', color: '#E8935F' }
                : { backgroundColor: '#17181C', border: '1px solid rgba(255,255,255,0.06)', color: '#9A9B9F' }
            }
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba === 'turmas' && <AbaTurmas />}
      {aba === 'import' && <AbaImport />}
      {aba === 'codigos' && <AbaCodigos />}
    </Screen>
  )
}

// ---- Aba Turmas: cadastro de turma + CRUD manual de alunos (manutenção contínua) ----

function AbaTurmas() {
  const [turmas, setTurmas] = useState(listarTurmas)
  const [turmaAberta, setTurmaAberta] = useState(null)
  const [novaTurma, setNovaTurma] = useState('')
  const [erro, setErro] = useState('')

  function criar(e) {
    e.preventDefault()
    setErro('')
    try {
      criarTurma(novaTurma)
      setNovaTurma('')
      setTurmas(listarTurmas())
    } catch (err) {
      setErro(err.message)
    }
  }

  if (turmaAberta) {
    return <DetalheTurma turma={turmaAberta} aoVoltar={() => setTurmaAberta(null)} />
  }

  return (
    <>
      <GlassCard className="p-4">
        <form onSubmit={criar} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder='Nova turma (ex: "1º Ano A")'
            value={novaTurma}
            onChange={(e) => setNovaTurma(e.target.value)}
          />
          <button className="shrink-0 rounded-2xl bg-copper px-4 text-sm font-medium text-base disabled:opacity-40" disabled={!novaTurma.trim()}>
            Criar
          </button>
        </form>
        {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
      </GlassCard>

      <p className="mb-3 mt-6 text-xs font-medium text-ink-secondary">
        {turmas.length} turma(s) cadastrada(s)
      </p>
      <GlassCard className="divider-y px-4">
        {turmas.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-muted">
            Nenhuma turma ainda — crie acima ou use a aba Importar para a carga inicial.
          </p>
        )}
        {turmas.map((t) => (
          <button
            key={t.id}
            onClick={() => setTurmaAberta(t)}
            className="flex w-full items-center justify-between py-3 text-left"
          >
            <div>
              <p className="text-sm font-medium">{t.nome}</p>
              <p className="text-xs text-ink-muted">{listarAlunos(t.id).length} alunos</p>
            </div>
            <span className="text-ink-muted">›</span>
          </button>
        ))}
      </GlassCard>
    </>
  )
}

function DetalheTurma({ turma, aoVoltar }) {
  const [alunos, setAlunos] = useState(() => listarAlunos(turma.id))
  const [representantes, setRepresentantes] = useState(() => listarRepresentantes(turma.id))
  const [form, setForm] = useState({ matricula: '', nome: '' })
  const [editando, setEditando] = useState(null) // alunoId em edição
  const [erro, setErro] = useState('')

  function recarregar() {
    setAlunos(listarAlunos(turma.id))
    setRepresentantes(listarRepresentantes(turma.id))
  }

  function adicionar(e) {
    e.preventDefault()
    setErro('')
    try {
      adicionarAluno(turma.id, form.matricula, form.nome)
      setForm({ matricula: '', nome: '' })
      recarregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  function salvarEdicao(alunoId, matricula, nome) {
    setErro('')
    try {
      editarAluno(alunoId, { matricula, nome })
      setEditando(null)
      recarregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  function remover(aluno) {
    if (!confirm(`Remover ${aluno.nome} da turma? O histórico de presença é preservado.`)) return
    setErro('')
    try {
      removerAluno(aluno.id)
      recarregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  function desativarRep(rep) {
    if (!confirm(`Desativar ${rep.usuario?.nome} como representante? O registro histórico é mantido.`)) return
    desativarRepresentante(rep.id)
    recarregar()
  }

  const ativos = representantes.filter((r) => r.ativo)

  return (
    <>
      <button onClick={aoVoltar} className="mb-4 text-xs text-ink-secondary">‹ Todas as turmas</button>
      <h2 className="mb-4 text-sm font-medium">{turma.nome}</h2>

      {/* Representantes ativos (até 2, redundância mútua) */}
      <p className="mb-3 text-xs font-medium text-ink-secondary">Representantes ({ativos.length}/2)</p>
      <GlassCard className="divider-y mb-6 px-4">
        {ativos.length === 0 && (
          <p className="py-4 text-xs text-ink-muted">Nenhum representante ativo — gere códigos na aba Códigos.</p>
        )}
        {ativos.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-3">
            <p className="text-sm font-medium">{r.usuario?.nome}</p>
            <button onClick={() => desativarRep(r)} className="text-xs text-danger">Desativar</button>
          </div>
        ))}
      </GlassCard>

      {/* CRUD de alunos */}
      <p className="mb-3 text-xs font-medium text-ink-secondary">Alunos ({alunos.length})</p>
      <GlassCard className="mb-4 p-4">
        <form onSubmit={adicionar} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="input w-28"
              placeholder="Matrícula"
              inputMode="numeric"
              value={form.matricula}
              onChange={(e) => setForm((f) => ({ ...f, matricula: e.target.value }))}
            />
            <input
              className="input flex-1"
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />
          </div>
          <button className="btn-primary" disabled={!form.matricula.trim() || !form.nome.trim()}>
            Adicionar aluno
          </button>
        </form>
        {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
      </GlassCard>

      <GlassCard className="divider-y px-4">
        {alunos.map((a) =>
          editando === a.id ? (
            <LinhaEdicao key={a.id} aluno={a} aoSalvar={salvarEdicao} aoCancelar={() => setEditando(null)} />
          ) : (
            <div key={a.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.nome}</p>
                <p className="text-xs text-ink-muted">Mat. {a.matricula}</p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button onClick={() => setEditando(a.id)} className="text-xs text-info">Editar</button>
                <button onClick={() => remover(a)} className="text-xs text-danger">Remover</button>
              </div>
            </div>
          )
        )}
      </GlassCard>
    </>
  )
}

function LinhaEdicao({ aluno, aoSalvar, aoCancelar }) {
  const [matricula, setMatricula] = useState(aluno.matricula)
  const [nome, setNome] = useState(aluno.nome)
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex gap-2">
        <input className="input w-28" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
        <input className="input flex-1" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button onClick={() => aoSalvar(aluno.id, matricula, nome)} className="text-xs font-medium text-moss">Salvar</button>
        <button onClick={aoCancelar} className="text-xs text-ink-muted">Cancelar</button>
      </div>
    </div>
  )
}

// ---- Aba Importar: fast-inject-file (carga inicial única, §4.6) ----

function AbaImport() {
  const [preview, setPreview] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [lendo, setLendo] = useState(false)

  async function aoEscolherArquivo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    setResultado(null)
    setLendo(true)
    try {
      setPreview(await lerArquivoParaPreview(file))
    } catch (err) {
      setErro(`Falha ao ler o arquivo: ${err.message}`)
    } finally {
      setLendo(false)
      e.target.value = ''
    }
  }

  function confirmar() {
    setErro('')
    try {
      const criadas = confirmarImport(preview)
      setResultado(criadas)
      setPreview(null)
    } catch (err) {
      setErro(err.message)
    }
  }

  function atualizarItem(indice, mudancas) {
    setPreview((p) => p.map((item, i) => (i === indice ? { ...item, ...mudancas } : item)))
  }

  return (
    <>
      <GlassCard className="p-6">
        <p className="text-sm font-medium">Carga inicial de turmas e alunos</p>
        <p className="mt-2 text-xs text-ink-muted">
          Envie o arquivo .xlsx da enturmação (uma aba por turma, colunas MATRICULA e
          NOME). Este import roda <span className="text-copper">uma única vez</span> —
          depois, toda manutenção é feita manualmente na aba Turmas.
        </p>
        <label className="btn-ghost mt-4 block cursor-pointer text-center">
          {lendo ? 'Lendo arquivo…' : 'Escolher arquivo .xlsx'}
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={aoEscolherArquivo} disabled={lendo} />
        </label>
        {erro && <p className="mt-3 text-xs text-danger">{erro}</p>}
      </GlassCard>

      {/* Pré-visualização obrigatória antes de gravar */}
      {preview && (
        <>
          <p className="mb-3 mt-6 text-xs font-medium text-ink-secondary">
            Pré-visualização — confira antes de gravar
          </p>
          <div className="flex flex-col gap-3">
            {preview.map((item, i) => (
              <GlassCard key={item.aba} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-muted">Aba "{item.aba}" · {item.alunos.length} alunos encontrados</p>
                    <input
                      className="input mt-2"
                      value={item.nomeTurma}
                      onChange={(e) => atualizarItem(i, { nomeTurma: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={() => atualizarItem(i, { incluir: !item.incluir })}
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
                    style={
                      item.incluir
                        ? { backgroundColor: '#93A87E14', border: '1px solid #93A87E55', color: '#93A87E' }
                        : { backgroundColor: '#17181C', border: '1px solid rgba(255,255,255,0.06)', color: '#6B6C70' }
                    }
                  >
                    {item.incluir ? 'Incluir' : 'Ignorar'}
                  </button>
                </div>
                {item.alunos.length > 0 && (
                  <p className="mt-2 truncate text-xs text-ink-muted">
                    Amostra: {item.alunos.slice(0, 3).map((a) => a.nome).join(', ')}…
                  </p>
                )}
                {item.avisos.map((aviso, j) => (
                  <p key={j} className="mt-1 text-xs text-copper">⚠ {aviso}</p>
                ))}
              </GlassCard>
            ))}
          </div>
          <button className="btn-primary mt-4" onClick={confirmar}>
            Confirmar e gravar {preview.filter((p) => p.incluir).length} turma(s)
          </button>
        </>
      )}

      {resultado && (
        <GlassCard className="mt-6 p-6">
          <p className="text-sm font-medium text-moss">Import concluído ✓</p>
          <div className="divider-y mt-2">
            {resultado.map((r) => (
              <p key={r.turma} className="py-2 text-xs text-ink-secondary">
                {r.turma}: {r.alunos} alunos
              </p>
            ))}
          </div>
        </GlassCard>
      )}
    </>
  )
}

// ---- Aba Códigos: whitelist de cadastro (2 códigos de aluno por turma) ----

function AbaCodigos() {
  const [codigos, setCodigos] = useState(listarCodigos)

  function gerar(cargo) {
    gerarCodigo(cargo)
    setCodigos(listarCodigos())
  }

  const pendentes = useMemo(() => codigos.filter((c) => !c.usado), [codigos])
  const usados = useMemo(() => codigos.filter((c) => c.usado), [codigos])

  return (
    <>
      <GlassCard className="p-6">
        <p className="text-sm font-medium">Códigos de matrícula</p>
        <p className="mt-2 text-xs text-ink-muted">
          Funcionam como convite: só quem tem um código válido consegue se cadastrar.
          Cada turma precisa de <span className="text-copper">dois códigos de representante</span> (um por pessoa).
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-primary" onClick={() => gerar('aluno')}>+ Representante</button>
          <button className="btn-ghost" onClick={() => gerar('professor')}>+ Professor</button>
        </div>
      </GlassCard>

      {pendentes.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-xs font-medium text-ink-secondary">Disponíveis</p>
          <GlassCard className="divider-y px-4">
            {pendentes.map((c) => (
              <div key={c.codigo} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-mono text-sm font-medium tracking-widest text-copper">{c.codigo}</p>
                  <p className="text-xs text-ink-muted">{c.cargo === 'aluno' ? 'Representante' : 'Professor'}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(c.codigo)}
                  className="text-xs text-info"
                >
                  Copiar
                </button>
              </div>
            ))}
          </GlassCard>
        </>
      )}

      {usados.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-xs font-medium text-ink-secondary">Já utilizados</p>
          <GlassCard className="divider-y px-4">
            {usados.map((c) => (
              <div key={c.codigo} className="flex items-center justify-between py-3">
                <p className="font-mono text-sm text-ink-muted">{c.codigo}</p>
                <p className="text-xs text-ink-secondary">{c.usadoPor?.nome || '—'}</p>
              </div>
            ))}
          </GlassCard>
        </>
      )}
    </>
  )
}
