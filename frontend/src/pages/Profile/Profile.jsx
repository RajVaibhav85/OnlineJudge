import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// Pre-defined options for tags
const AVAILABLE_LANGUAGES = ['C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C#', 'Ruby'];
const AVAILABLE_FRAMEWORKS = ['Node.js', 'React', 'Express', 'NestJS', 'Next.js', 'Vue', 'Django', 'Spring Boot'];

const s = {
  page: { minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif', padding: '2rem 1rem' },
  container: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  // Fallback styling for smaller mobile responsive screens
  fullWidthContainer: { maxWidth: '700px', margin: '0 auto' },
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: '12px', padding: '2rem', marginBottom: '1.5rem', boxSizing: 'border-box' },
  title: { fontSize: '20px', fontWeight: '500', margin: '0 0 1.5rem', color: '#111' },
  group: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', color: '#111', background: '#fff' },
  textarea: { width: '100%', padding: '9px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit', outline: 'none', color: '#111', background: '#fff' },
  btn: { padding: '10px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  secondaryBtn: { padding: '10px 16px', background: 'none', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#555', marginRight: '10px' },
  alert: (type) => ({ padding: '10px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '1rem', background: type === 'error' ? '#fff1f0' : '#f0faf4', color: type === 'error' ? '#c0392b' : '#27ae60', border: `1px solid ${type === 'error' ? '#fcc' : '#b2dfcc'}` }),
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  statBox: { background: '#f9f9f9', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #eee' },
  
  // Tag Selection Options Styling
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' },
  tag: (selected) => ({
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    border: selected ? '1px solid #111' : '1px solid #ddd',
    background: selected ? '#111' : '#fff',
    color: selected ? '#fff' : '#555',
    transition: 'all 0.15s ease'
  }),
  
  // Public Badge Preview Mockup Design
  previewCard: { background: '#ffffff', border: '1px dashed #aa3bff', borderRadius: '16px', padding: '2rem', sticky: { position: 'sticky', top: '2rem' } },
  pill: { background: '#f0faf4', color: '#27ae60', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginRight: '6px', marginBottom: '6px' }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  
  const [bio, setBio] = useState('')
  const [github, setGithub] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [website, setWebsite] = useState('')
  
  // 🌟 Languages and Frameworks tracking arrays for tag toggles
  const [selectedLanguages, setSelectedLanguages] = useState([])
  const [selectedFrameworks, setSelectedFrameworks] = useState([])

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' })
  const [passMsg, setPassMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/profile/get-profile`, { 
      method: 'GET',
      credentials: 'include' 
    })
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => {
        setProfileData(data)
        setBio(data.bio || '')
        setGithub(data.socials?.github || '')
        setLinkedin(data.socials?.linkedin || '')
        setWebsite(data.socials?.website || '')
        setSelectedLanguages(data.skills?.languages || [])
        setSelectedFrameworks(data.skills?.frameworks || [])
        setLoading(false)
      })
      .catch(() => {
        setProfileMsg({ type: 'error', text: 'Failed to synchronize workspace profile stats.' })
        setLoading(false)
      })
  }, [])

  // Helper arrays parsing to check if tags are toggled
  const handleToggleLanguage = (lang) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  }

  const handleToggleFramework = (fw) => {
    setSelectedFrameworks(prev => 
      prev.includes(fw) ? prev.filter(f => f !== fw) : [...prev, fw]
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileMsg({ type: '', text: '' })
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          bio, 
          github, 
          linkedin, 
          website, 
          languages: selectedLanguages, 
          frameworks: selectedFrameworks 
        })
      })
      const resData = await res.json()
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile metrics updated successfully!' })
        setProfileData(resData.data)
      } else {
        setProfileMsg({ type: 'error', text: resData.message || 'Update processing failed.' })
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network request error.' })
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPassMsg({ type: '', text: '' })

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const resData = await res.json()
      if (res.ok) {
        setPassMsg({ type: 'success', text: 'Password altered successfully!' })
        setCurrentPassword('')
        setNewPassword('')
      } else {
        setPassMsg({ type: 'error', text: resData.message || 'Failed verification criteria.' })
      }
    } catch {
      setPassMsg({ type: 'error', text: 'Network pipeline error.' })
    }
  }

  if (loading) return <div style={{ padding: '40px', color: '#888' }}>Loading secure database logs...</div>

  if (!profileData && profileMsg.type === 'error') {
    return (
      <div style={s.page}>
        <div style={s.fullWidthContainer}>
          <button style={s.secondaryBtn} onClick={() => navigate(-1)}>← Back to Dashboard</button>
          <div style={{ ...s.card, color: '#c0392b', border: '1px solid #fcc', background: '#fff1f0' }}>
            <h3>⚠️ Data Synchronization Error</h3>
            <p>{profileMsg.text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Dynamic 2-Column Split Workspace */}
      <div style={s.container}>
        
        {/* Left Column: Management Inputs Forms */}
        <div>
          <button style={{ ...s.secondaryBtn, marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>
            ← Back to Dashboard
          </button>

          <div style={{ ...s.card, background: '#111', color: '#fff' }}>
            <h2 style={{ ...s.title, color: '#fff', marginBottom: '4px' }}>👋 Welcome back, {user?.username}!</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>Logged in as: {user?.email}</p>
          </div>

          <div style={s.card}>
            <h2 style={s.title}>🎯 Platform Performance</h2>
            <div style={s.row}>
              <div style={s.statBox}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#111' }}>{profileData?.stats?.problemsSolved || 0}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Total Solved</div>
              </div>
              <div style={s.statBox}>
                <div style={{ fontSize: '13px', color: '#666', textAlign: 'left' }}>
                  <div>🟢 Easy: <b>{profileData?.stats?.difficultyBreakdown?.easy || 0}</b></div>
                  <div>🟡 Medium: <b>{profileData?.stats?.difficultyBreakdown?.medium || 0}</b></div>
                  <div>🔴 Hard: <b>{profileData?.stats?.difficultyBreakdown?.hard || 0}</b></div>
                </div>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <h2 style={s.title}>👤 Edit Public Profile</h2>
            {profileMsg.text && <div style={s.alert(profileMsg.type)}>{profileMsg.text}</div>}
            <form onSubmit={handleUpdateProfile}>
              <div style={s.group}>
                <label style={s.label}>Bio</label>
                <textarea style={s.textarea} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about your competitive coding background..." />
              </div>
              
              {/* Multiselect Languages Input Selector Section */}
              <div style={s.group}>
                <label style={s.label}>Languages (Select Multiple)</label>
                <div style={s.tagContainer}>
                  {AVAILABLE_LANGUAGES.map(lang => (
                    <button type="button" key={lang} onClick={() => handleToggleLanguage(lang)} style={s.tag(selectedLanguages.includes(lang))}>
                      {lang} {selectedLanguages.includes(lang) ? '✓' : '+'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiselect Frameworks Input Selector Section */}
              <div style={s.group}>
                <label style={s.label}>Frameworks & Tech Stack (Select Multiple)</label>
                <div style={s.tagContainer}>
                  {AVAILABLE_FRAMEWORKS.map(fw => (
                    <button type="button" key={fw} onClick={() => handleToggleFramework(fw)} style={s.tag(selectedFrameworks.includes(fw))}>
                      {fw} {selectedFrameworks.includes(fw) ? '✓' : '+'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.group}>
                <label style={s.label}>GitHub Profile Link</label>
                <input style={s.input} type="url" value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." />
              </div>
              <div style={s.row}>
                <div style={s.group}>
                  <label style={s.label}>LinkedIn</label>
                  <input style={s.input} type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
                <div style={s.group}>
                  <label style={s.label}>Portfolio Website</label>
                  <input style={s.input} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <button type="submit" style={s.btn}>Save Changes</button>
            </form>
          </div>

          <div style={s.card}>
            <h2 style={s.title}>🔐 Security Controls</h2>
            {passMsg.text && <div style={s.alert(passMsg.type)}>{passMsg.text}</div>}
            <form onSubmit={handlePasswordChange}>
              <div style={s.group}>
                <label style={s.label}>Current Password</label>
                <input style={s.input} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <div style={s.group}>
                <label style={s.label}>New Access Password</label>
                <input style={s.input} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <button type="submit" style={{ ...s.btn, background: '#dc2626' }}>Modify Password</button>
            </form>
          </div>
        </div>

        {/* 🌟 Right Column: Real-time Public Preview Card Component */}
        <div style={s.previewCard.sticky}>
          <div style={s.previewCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', color: '#aa3bff' }}>👁️ Real-time Public Card Preview</h3>
              <span style={{ fontSize: '11px', background: '#f4f3ec', padding: '3px 8px', borderRadius: '4px', color: '#666' }}>Live Sync</span>
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px dashed #e5e4e7', margin: '1rem 0' }} />
            
            <h2 style={{ fontSize: '28px', margin: '0 0 4px', color: '#08060d' }}>{user?.username || 'Developer'}</h2>
            <p style={{ color: '#6b6375', fontSize: '14px', marginBottom: '1rem' }}>Competitive Programmer</p>
            
            <p style={{ fontSize: '14px', color: '#333', fontStyle: bio ? 'normal' : 'italic', background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee', minHeight: '40px', marginBottom: '1.5rem' }}>
              {bio || "This coder hasn't specified a public bio description details signature sequence yet."}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Languages ({selectedLanguages.length})</h4>
              {selectedLanguages.length > 0 ? (
                selectedLanguages.map(l => <span key={l} style={s.pill}>{l}</span>)
              ) : (
                <span style={{ fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>No languages selected.</span>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Frameworks ({selectedFrameworks.length})</h4>
              {selectedFrameworks.length > 0 ? (
                selectedFrameworks.map(f => <span key={f} style={{ ...s.pill, background: '#eef2ff', color: '#4f46e5' }}>{f}</span>)
              ) : (
                <span style={{ fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>No frameworks selected.</span>
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Connect Link channels</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {github && <a href={github} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#aa3bff', textDecoration: 'none', fontWeight: '500' }}>🌐 GitHub</a>}
                {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#aa3bff', textDecoration: 'none', fontWeight: '500' }}>💼 LinkedIn</a>}
                {website && <a href={website} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#aa3bff', textDecoration: 'none', fontWeight: '500' }}>🔗 Portfolio</a>}
                {!github && !linkedin && !website && <span style={{ fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>No social links configured.</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}