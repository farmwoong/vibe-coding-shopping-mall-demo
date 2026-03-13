import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usersApi } from '../lib/api'

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

function clearStoredAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const loadUser = useCallback(() => {
    const token = getStoredToken()
    if (!token) {
      setAuthChecked(true)
      return
    }
    usersApi
      .getMe(token)
      .then(setUserState)
      .catch(() => setUserState(null))
      .finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const setUser = useCallback((u) => {
    setUserState(u)
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUserState(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loadUser, authChecked }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
