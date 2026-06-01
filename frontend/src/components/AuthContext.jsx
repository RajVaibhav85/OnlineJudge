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
      .catch(() => setUser(null)) 
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',                     // credentials : include => browser attaches jwt and sends it to backend
        body: JSON.stringify({ email, password }),
      })

      let data = {}
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await res.json()
      }

      if (res.ok) {
        setUser(data)
        return { ok: true }
      }

      return { ok: false, message: data.message || `Error: ${res.status}` }

    } catch (err) {
      return { ok: false, message: "Network connection lost. Please try again." }
    }
  }

  const register = async ({ username, email, password, dob }) => {
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, dob }),
      })

      let data = {}
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await res.json()
      }

      if (res.ok) {
        setUser(data)
        return { ok: true }
      }

      return { ok: false, message: data.message || `Error: ${res.status}` }

    } catch (err) {
      return { ok: false, message: "Failed to connect to the registration server." }
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' })
    } catch (err) {
      console.error("Logout request failed", err)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)