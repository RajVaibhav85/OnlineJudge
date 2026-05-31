import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const s = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  },
  nav: {
    background: '#fff',
    borderBottom: '0.5px solid #e0e0e0',
    padding: '0 2rem',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#111',
    margin: 0,
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#555',
  },
  main: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  welcome: {
    fontSize: '22px',
    fontWeight: '500',
    color: '#111',
    margin: '0 0 0.25rem',
  },
  welcomeSub: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '2rem',
  },
  statCard: {
    background: '#fff',
    border: '0.5px solid #e0e0e0',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
  },
  statLabel: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '500',
    color: '#111',
    margin: 0,
  },
  card: {
    background: '#fff',
    border: '0.5px solid #e0e0e0',
    borderRadius: '10px',
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#111',
    margin: '0 0 1rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '0.5px solid #f0f0f0',
    fontSize: '14px',
  },
  infoLabel: { color: '#888' },
  infoValue: { color: '#111', fontWeight: '500' },
  badge: {
    display: 'inline-block',
    background: '#f0f0f0',
    color: '#555',
    fontSize: '12px',
    padding: '3px 10px',
    borderRadius: '20px',
  },
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading])

  const handleLogout = async () => {
    await logout()
    navigate('/auth')
  }

  if (loading) {
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontSize: '14px' }}>Loading...</p>
      </div>
    )
  }

  if (!user) return null

  const dob = user.dob ? new Date(user.dob).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '—'

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
    month: 'short', year: 'numeric'
  }) : '—'

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>Online Judge</p>
        <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
      </nav>

      <main style={s.main}>
        <h1 style={s.welcome}>Welcome back, {user.username} 👋</h1>
        <p style={s.welcomeSub}>Here's your profile overview.</p>

        {/* Stat cards */}
        <div style={s.grid}>
          <div style={s.statCard}>
            <p style={s.statLabel}>Problems solved</p>
            <p style={s.statValue}>0</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statLabel}>Submissions</p>
            <p style={s.statValue}>0</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statLabel}>Success rate</p>
            <p style={s.statValue}>—</p>
          </div>
          <div style={s.statCard}>
            <p style={s.statLabel}>Member since</p>
            <p style={{ ...s.statValue, fontSize: '16px', paddingTop: '6px' }}>{memberSince}</p>
          </div>
        </div>

        {/* Profile info */}
        <div style={s.card}>
          <p style={s.cardTitle}>Account details</p>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Username</span>
            <span style={s.infoValue}>{user.username}</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Email</span>
            <span style={s.infoValue}>{user.email}</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Date of birth</span>
            <span style={s.infoValue}>{dob}</span>
          </div>
          <div style={{ ...s.infoRow, borderBottom: 'none' }}>
            <span style={s.infoLabel}>Role</span>
            <span style={s.badge}>User</span>
          </div>
        </div>
      </main>
    </div>
  )
}