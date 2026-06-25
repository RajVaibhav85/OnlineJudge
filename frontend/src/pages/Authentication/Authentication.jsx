import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 0%, #111827 0%, #030712 100%)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    padding: '1.5rem',
    letterSpacing: '-0.01em'
  },
  card: {
    background: 'rgba(31, 41, 55, 0.25)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    margin: '0 0 6px',
    color: '#f9fafb',
    letterSpacing: '-0.03em'
  },
  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    marginBottom: '2rem',
  },
  tab: (active) => ({
    flex: 1,
    padding: '12px 8px',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' : '400',
    color: active ? '#38bdf8' : '#9ca3af',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  group: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '14px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#f9fafb',
    background: 'rgba(17, 24, 39, 0.4)',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)'
  },
  btn: (loading) => ({
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    color: '#030712',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '0.75rem',
    opacity: loading ? 0.6 : 1,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(56, 189, 248, 0.25)'
  }),
  alert: (type) => ({
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '1.25rem',
    background: type === 'error' ? 'rgba(127, 29, 29, 0.3)' : 'rgba(6, 78, 59, 0.3)',
    color: type === 'error' ? '#fca5a5' : '#6ee7b7',
    border: `1px solid ${type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(52, 211, 153, 0.2)'}`,
    backdropFilter: 'blur(8px)',
  }),
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '1.5rem',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#38bdf8',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'none',
    marginLeft: '4px',
    transition: 'color 0.15s ease'
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
    loading || setLoading(true)
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
    loading || setLoading(true)
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
                placeholder="you@example.com" required disabled={loading}
                onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" name="password"
                value={loginForm.password} onChange={handleChange(setLoginForm)}
                placeholder="••••••••" required disabled={loading}
                onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <button 
              type="submit" 
              style={s.btn(loading)} 
              disabled={loading}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px 0 rgba(56, 189, 248, 0.35)'; } }}
              onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(56, 189, 248, 0.25)'; } }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p style={s.switchText}>
              No account?{' '}
              <button type="button" style={s.switchLink} onClick={() => switchTab('signup')} onMouseEnter={e => e.currentTarget.style.color = '#7dd3fc'} onMouseLeave={e => e.currentTarget.style.color = '#38bdf8'}>
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
                  placeholder="handle" required disabled={loading}
                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Date of birth</label>
                <input style={{...s.input, colorScheme: 'dark'}} type="date" name="dob"
                  value={signupForm.dob} onChange={handleChange(setSignupForm)}
                  required disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>
            <div style={s.group}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" name="email"
                value={signupForm.email} onChange={handleChange(setSignupForm)}
                placeholder="you@example.com" required disabled={loading}
                onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div style={s.row}>
              <div style={s.group}>
                <label style={s.label}>Password</label>
                <input style={s.input} type="password" name="password"
                  value={signupForm.password} onChange={handleChange(setSignupForm)}
                  placeholder="••••••••" required disabled={loading}
                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }} />
              </div>
              <div style={s.group}>
                <label style={s.label}>Confirm</label>
                <input style={s.input} type="password" name="confirmPassword"
                  value={signupForm.confirmPassword} onChange={handleChange(setSignupForm)}
                  placeholder="••••••••" required disabled={loading}
                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </div>
            <button 
              type="submit" 
              style={s.btn(loading)} 
              disabled={loading}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px 0 rgba(56, 189, 248, 0.35)'; } }}
              onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(56, 189, 248, 0.25)'; } }}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
            <p style={s.switchText}>
              Already have an account?{' '}
              <button type="button" style={s.switchLink} onClick={() => switchTab('login')} onMouseEnter={e => e.currentTarget.style.color = '#7dd3fc'} onMouseLeave={e => e.currentTarget.style.color = '#38bdf8'}>
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}