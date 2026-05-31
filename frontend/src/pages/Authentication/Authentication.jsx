import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    border: '0.5px solid #e0e0e0',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '22px',
    fontWeight: '500',
    margin: '0 0 4px',
    color: '#111',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #e8e8e8',
    marginBottom: '1.5rem',
  },
  tab: (active) => ({
    flex: 1,
    padding: '8px',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #111' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '500' : '400',
    color: active ? '#111' : '#888',
    transition: 'all 0.15s',
  }),
  group: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#444',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#111',
    background: '#fff',
    transition: 'border-color 0.15s',
  },
  btn: (loading) => ({
    width: '100%',
    padding: '10px',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '0.5rem',
    opacity: loading ? 0.6 : 1,
    transition: 'opacity 0.15s',
  }),
  alert: (type) => ({
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '1rem',
    background: type === 'error' ? '#fff1f0' : '#f0faf4',
    color: type === 'error' ? '#c0392b' : '#27ae60',
    border: `1px solid ${type === 'error' ? '#fcc' : '#b2dfcc'}`,
  }),
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#888',
    marginTop: '1rem',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#111',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'underline',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
}

export default function Auth() {
  const { user, loading: authLoading, login, register } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    username: '', email: '', password: '', confirmPassword: '', dob: ''
  })

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard')
  }, [user, authLoading])

  const handleChange = (setter) => (e) => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { ok, message } = await login(loginForm.email, loginForm.password)
    if (ok) {
      setSuccess('Login successful!')
      setTimeout(() => navigate('/dashboard'), 800)
    } else {
      setError(message || 'Login failed')
    }
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    if (signupForm.password !== signupForm.confirmPassword) {
      return setError('Passwords do not match')
    }
    setLoading(true)
    setError('')
    const { ok, message } = await register({
      username: signupForm.username,
      email: signupForm.email,
      password: signupForm.password,
      dob: signupForm.dob,
    })
    if (ok) {
      setSuccess('Account created!')
      setTimeout(() => navigate('/dashboard'), 800)
    } else {
      setError(message || 'Registration failed')
    }
    setLoading(false)
  }

  const switchTab = (t) => { setTab(t); setError(''); setSuccess('') }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <h1 style={s.title}>Online Judge</h1>
          <p style={s.subtitle}>Master your coding skills</p>
        </div>

        <div style={s.tabs}>
          <button style={s.tab(tab === 'login')} onClick={() => switchTab('login')}>Login</button>
          <button style={s.tab(tab === 'signup')} onClick={() => switchTab('signup')}>Sign up</button>
        </div>

        {error && <div style={s.alert('error')}>{error}</div>}
        {success && <div style={s.alert('success')}>{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={s.group}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" name="email"
                value={loginForm.email} onChange={handleChange(setLoginForm)}
                placeholder="you@example.com" required disabled={loading} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" name="password"
                value={loginForm.password} onChange={handleChange(setLoginForm)}
                placeholder="••••••••" required disabled={loading} />
            </div>
            <button type="submit" style={s.btn(loading)} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p style={s.switchText}>
              No account?{' '}
              <button type="button" style={s.switchLink} onClick={() => switchTab('signup')}>
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div style={s.row}>
              <div style={s.group}>
                <label style={s.label}>Username</label>
                <input style={s.input} type="text" name="username"
                  value={signupForm.username} onChange={handleChange(setSignupForm)}
                  placeholder="handle" required disabled={loading} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Date of birth</label>
                <input style={s.input} type="date" name="dob"
                  value={signupForm.dob} onChange={handleChange(setSignupForm)}
                  required disabled={loading}
                  max={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div style={s.group}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" name="email"
                value={signupForm.email} onChange={handleChange(setSignupForm)}
                placeholder="you@example.com" required disabled={loading} />
            </div>
            <div style={s.row}>
              <div style={s.group}>
                <label style={s.label}>Password</label>
                <input style={s.input} type="password" name="password"
                  value={signupForm.password} onChange={handleChange(setSignupForm)}
                  placeholder="••••••••" required disabled={loading} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Confirm</label>
                <input style={s.input} type="password" name="confirmPassword"
                  value={signupForm.confirmPassword} onChange={handleChange(setSignupForm)}
                  placeholder="••••••••" required disabled={loading} />
              </div>
            </div>
            <button type="submit" style={s.btn(loading)} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
            <p style={s.switchText}>
              Already have an account?{' '}
              <button type="button" style={s.switchLink} onClick={() => switchTab('login')}>
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}