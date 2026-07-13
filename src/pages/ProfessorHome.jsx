import { useAuth } from '../context/AuthContext'
import Screen from '../components/Screen'
import GlassCard from '../components/GlassCard'

// Fase 2 (contexto §4.4): dashboard de turmas, relatório do dia (só faltas),
// flag "já lancei no SIEPE" e alertas por e-mail. Nesta fase, o professor
// consegue se cadastrar/logar, mas o painel ainda não foi liberado.
export default function ProfessorHome() {
  const { perfil, logout } = useAuth()
  return (
    <Screen className="flex min-h-dvh flex-col justify-center pb-6">
      <GlassCard className="p-6 text-center">
        <p className="text-xs text-ink-secondary">Olá, {perfil.usuario.nome.split(' ')[0]}</p>
        <h1 className="mt-2 text-sm font-medium">Painel do professor em breve</h1>
        <p className="mt-3 text-xs text-ink-muted">
          O relatório diário de faltas por turma e o apoio ao lançamento no SIEPE
          fazem parte da próxima fase do projeto. Sua conta já está pronta para
          quando ele for liberado.
        </p>
        <button onClick={logout} className="btn-ghost mt-6">Sair</button>
      </GlassCard>
    </Screen>
  )
}
