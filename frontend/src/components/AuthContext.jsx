import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const API = import.meta.env.VITE_SERVER_URL + '/api/auth'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) setUser(data)
    return { ok: res.ok, message: data.message }
  }


  const register = async ({ username, email, password, dob }) => {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password, dob }),
    })
    const data = await res.json()
    if (res.ok) setUser(data)
    return { ok: res.ok, message: data.message }
  }


  const logout = async () => {
    await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' })
    setUser(null)
  }
  

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)