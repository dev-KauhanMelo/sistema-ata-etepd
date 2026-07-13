import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getSessao, getPerfil, login as loginService, logout as logoutService, cadastrar as cadastrarService } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const recarregarPerfil = useCallback(() => {
    const sessao = getSessao()
    setPerfil(sessao ? getPerfil(sessao.usuarioId) : null)
    setCarregando(false)
  }, [])

  useEffect(() => {
    recarregarPerfil()
  }, [recarregarPerfil])

  async function login(matricula, senha) {
    const usuarioId = await loginService(matricula, senha)
    setPerfil(getPerfil(usuarioId))
  }

  async function cadastrar(dados) {
    const usuarioId = await cadastrarService(dados)
    setPerfil(getPerfil(usuarioId))
  }

  function logout() {
    logoutService()
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ perfil, carregando, login, cadastrar, logout, recarregarPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
