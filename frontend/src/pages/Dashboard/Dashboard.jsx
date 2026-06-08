import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const AVAILABLE_TAGS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Tree', 'Graph'];

const s = {
  page: { minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  nav: { background: '#fff', borderBottom: '0.5px solid #e0e0e0', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: '16px', fontWeight: '500', color: '#111', margin: 0 },
  logoutBtn: { background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', color: '#555' },
  main: { maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' },
  welcome: { fontSize: '22px', fontWeight: '500', color: '#111', margin: '0 0 0.25rem' },
  welcomeSub: { fontSize: '14px', color: '#888', margin: '0 0 2rem' },
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' },
  cardTitle: { fontSize: '15px', fontWeight: '500', color: '#111', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '6px' },
  filterBar: { display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', minWidth: '200px', color: '#111' },
  select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', background: '#fff', color: '#111', cursor: 'pointer' },
  multiSelectContainer: { position: 'relative', minWidth: '240px' },
  multiSelectBox: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', background: '#fff', color: '#111', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', borderRadius: '6px', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '220px', overflowY: 'auto', padding: '6px 0' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '14px', color: '#111', cursor: 'pointer' },
  problemRow: { display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '0.5px solid #f0f0f0', cursor: 'pointer' },
  problemName: { flex: 1, fontSize: '14px', fontWeight: '500', color: '#111' },
  problemDifficulty: { fontSize: '12px', fontWeight: '500', padding: '3px 8px', borderRadius: '4px', marginRight: '1rem' },
  difficultyEasy: { background: '#d1fae5', color: '#047857' },
  difficultyMedium: { background: '#fef3c7', color: '#b45309' },
  difficultyHard: { background: '#fee2e2', color: '#dc2626' },
  tagBadge: { fontSize: '11px', background: '#f0f0f0', color: '#666', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()

  const [problems, setProblems] = useState([])
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [user, loading, navigate])

  useEffect(() => {
    if (user && username !== user.username) {
        navigate(`/${user.username}`, { replace: true })
    }
  }, [user, username, navigate])

  useEffect(() => {
    if (!user) return
    
    const params = new URLSearchParams()
    if (difficulty) params.append('difficulty', difficulty)
    if (search) params.append('search', search)
    
    if (selectedTags.length > 0) {
      params.append('tags', selectedTags.join(','))
    }

    setIsFetching(true)
    
    fetch(`${BACKEND_URL}/api/db/get-problems?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(resData => {
        if (resData.success) setProblems(resData.data)
        setIsFetching(false)
      })
      .catch(err => {
        console.error("Failed to load questions from database:", err)
        setIsFetching(false)
      })
  }, [search, difficulty, selectedTags, user])

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  useEffect(() => {
    const closeMenu = () => setIsDropdownOpen(false);
    if (isDropdownOpen) {
      window.addEventListener('click', closeMenu);
    }
    return () => window.removeEventListener('click', closeMenu);
  }, [isDropdownOpen]);

  if (loading) return <div style={{ padding: '40px', color: '#888' }}>Loading Auth Profile...</div>
  if (!user) return null

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>Online Judge Dashboard</p>
        <button style={{ ...s.logoutBtn, background: '#111', color: '#fff', border: 'none' }} onClick={() => navigate(`/${user.username}/profile`)}>Profile</button>
        <button style={s.logoutBtn} onClick={async () => { await logout(); navigate('/auth') }}>Logout</button>
      </nav>

      <main style={s.main}>
        <h1 style={s.welcome}>Welcome back, {user.username} 👋</h1>
        <p style={s.welcomeSub}>Manage workspace filters or choose a problem below to open the code editor.</p>

        <div style={s.card}>
          <p style={s.cardTitle}>🎛️ Filter Challenges</p>
          <div style={s.filterBar}>
            
            <input 
              style={s.input} 
              type="text" 
              placeholder="Search by name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
            />

            <select style={s.select} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <div style={s.multiSelectContainer} onClick={e => e.stopPropagation()}>
              <div style={s.multiSelectBox} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px', color: selectedTags.length === 0 ? '#757575' : '#111' }}>
                  {selectedTags.length === 0 
                    ? 'Select Tags...' 
                    : `Tags (${selectedTags.length}): ${selectedTags.slice(0, 2).join(', ')}${selectedTags.length > 2 ? '...' : ''}`
                  }
                </span>
                <span>{isDropdownOpen ? '▲' : '▼'}</span>
              </div>

              {isDropdownOpen && (
                <div style={s.dropdownMenu}>
                  {AVAILABLE_TAGS.map(tag => {
                    const isChecked = selectedTags.includes(tag);
                    return (
                      <div 
                        key={tag} 
                        style={{ ...s.dropdownItem, background: isChecked ? '#f0f7ff' : 'transparent' }} 
                        onClick={() => handleTagToggle(tag)}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = isChecked ? '#e0f0ff' : '#f5f5f5'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isChecked ? '#f0f7ff' : 'transparent'}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => {}} 
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{tag}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        <div style={s.card}>
          <p style={s.cardTitle}>⚡ Challenges ({problems.length})</p>
          <div>
            {isFetching ? (
              <p style={{ padding: '20px', color: '#888' }}>Loading problems matches...</p>
            ) : problems.length === 0 ? (
              <p style={{ padding: '20px', color: '#888' }}>No problems match criteria.</p>
            ) : (
              problems.map(p => (
                <div 
                  key={p.code} 
                  style={s.problemRow} 
                  onClick={() => navigate(`/${user.username}/${p.code}`)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ ...s.problemName, marginBottom: '4px' }}>{p.name}</div>
                    <div>{p.tags?.map(t => <span key={t} style={s.tagBadge}>{t}</span>)}</div>
                  </div>
                  <span style={{ 
                    ...s.problemDifficulty, 
                    ...(p.difficulty === 'Easy' ? s.difficultyEasy : p.difficulty === 'Medium' ? s.difficultyMedium : s.difficultyHard)
                  }}>
                    {p.difficulty}
                  </span>
                  <span>→</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}