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
  tagBadge: { fontSize: '11px', background: '#f0f0f0', color: '#666', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' },
  testForm: { display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' },
  launchBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }
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

  // Custom TestHub Settings Panel State
  const [testDuration, setTestDuration] = useState('30')
  const [testDifficulty, setTestDifficulty] = useState('Mixed')
  const [testTags, setTestTags] = useState([])
  const [isTestTagDropdownOpen, setIsTestTagDropdownOpen] = useState(false)

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
    if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))

    setIsFetching(true)
    fetch(`${BACKEND_URL}/api/db/get-problems?${params.toString()}`)
      .then(res => res.json())
      .then(resData => {
        if (resData.success) setProblems(resData.data)
        setIsFetching(false)
      })
      .catch(err => {
        console.error(err)
        setIsFetching(false)
      })
  }, [search, difficulty, selectedTags, user])

  const handleLaunchMockTest = () => {
    // 1. Build Query Params based on Test Selection Requirements
    const params = new URLSearchParams()
    if (testDifficulty !== 'Mixed') {
      params.append('difficulty', testDifficulty)
    }
    if (testTags.length > 0) {
      params.append('tags', testTags.join(','))
    }

    // 2. Fetch specific dynamic candidate problems pool
    fetch(`${BACKEND_URL}/api/db/get-problems?${params.toString()}`)
      .then(res => res.json())
      .then(async (resData) => {
        if (!resData.success || !resData.data || resData.data.length === 0) {
          alert('No problems found in the database matching your criteria. Try different tags or choices!');
          return;
        }

        // 3. Keep a maximum slice selection of up to 4 dynamic questions randomly chosen from matching rows
        const structuralPool = [...resData.data].sort(() => 0.5 - Math.random()).slice(0, 4);

        try {
          // 4. Hit the Engine endpoint with the exact property name 'problemIds' the backend requires
          const sessionRes = await fetch(`${BACKEND_URL}/api/testhub/session/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              duration: Number(testDuration) * 60,
              problemIds: structuralPool.map(p => p._id) // Changed from 'problems' to 'problemIds'
            }),
            credentials: 'include'
          });

          const sessionData = await sessionRes.json();

          if (!sessionRes.ok) {
            throw new Error(sessionData.message || 'Could not instantiate a valid database session instance.');
          }

          // 5. Initialize ALL Local Storage Sync parameters expected by the TestHub layout
          sessionStorage.setItem('testhub_active', 'true');
          sessionStorage.setItem('testhub_session_id', sessionData.sessionId || sessionData.data?._id || sessionData._id);
          sessionStorage.setItem('testhub_problems', JSON.stringify(structuralPool));
          sessionStorage.setItem('testhub_duration_seconds', String(Number(testDuration) * 60));

          // 6. Route user safely into TestHub page without triggering the security fallback interceptor
          navigate(`/${user.username}/test-yourself`);

        } catch (sessionError) {
          console.error(sessionError);
          alert(`Session Creation Failed: ${sessionError.message}`);
        }
      })
      .catch(err => {
        console.error(err);
        alert('An issue occurred initializing your testing configuration instance.');
      });
  }

  const handleGlobalTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTestTagToggle = (tag) => {
    if (testTags.includes(tag)) {
      setTestTags(testTags.filter(t => t !== tag));
    } else {
      setTestTags([...testTags, tag]);
    }
  };

  useEffect(() => {
    const closeMenus = () => {
      setIsDropdownOpen(false)
      setIsTestTagDropdownOpen(false)
    }
    window.addEventListener('click', closeMenus)
    return () => window.removeEventListener('click', closeMenus)
  }, [])

  if (loading) return <div style={{ padding: '40px', color: '#888' }}>Loading Auth Profile...</div>
  if (!user) return null

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>Online Judge Dashboard</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user.role === 'admin' && (
            <button 
              style={{ ...s.logoutBtn, background: '#4f46e5', color: '#fff', border: 'none', fontWeight: '500' }} 
              onClick={() => navigate(`/${user.username}/admin`)}
            >
              Admin Dashboard
            </button>
          )}
          <button style={{ ...s.logoutBtn, background: '#111', color: '#fff', border: 'none' }} onClick={() => navigate(`/${user.username}/profile`)}>Profile</button>
          <button style={s.logoutBtn} onClick={async () => { await logout(); navigate('/auth') }}>Logout</button>
        </div>
      </nav>

      <main style={s.main}>
        <h1 style={s.welcome}>Welcome back, {user.username} 👋</h1>
        <p style={s.welcomeSub}>Manage workspace filters or create custom mock examinations down below.</p>

        {/* Dynamic TestHub Workspace Configurator Panel */}
        <div style={{ ...s.card, border: '1px dashed #4f46e5', background: '#f8fafc' }}>
          <p style={{ ...s.cardTitle, color: '#4f46e5' }}>⚡ Custom Performance Mock Exam Panel</p>
          <div style={s.testForm}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Duration (Minutes)</label>
              <select style={s.select} value={testDuration} onChange={e => setTestDuration(e.target.value)}>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
                <option value="90">90 Minutes</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Problem Difficulty Tier</label>
              <select style={s.select} value={testDifficulty} onChange={e => setTestDifficulty(e.target.value)}>
                <option value="Mixed">Mixed (All Tiers)</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Filter Categories (Multiple)</label>
              <div style={s.multiSelectContainer} onClick={e => e.stopPropagation()}>
                <div style={s.multiSelectBox} onClick={() => setIsTestTagDropdownOpen(!isTestTagDropdownOpen)}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                    {testTags.length === 0 ? 'All Categories Selected' : `Selected (${testTags.length})`}
                  </span>
                  <span>{isTestTagDropdownOpen ? '▲' : '▼'}</span>
                </div>
                {isTestTagDropdownOpen && (
                  <div style={s.dropdownMenu}>
                    {AVAILABLE_TAGS.map(tag => {
                      const isChecked = testTags.includes(tag);
                      return (
                        <div key={tag} style={{ ...s.dropdownItem, background: isChecked ? '#f0f7ff' : 'transparent' }} onClick={() => handleTestTagToggle(tag)}>
                          <input type="checkbox" checked={isChecked} onChange={() => {}} />
                          <span>{tag}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <button style={{ ...s.launchBtn, alignSelf: 'flex-end', height: '38px' }} onClick={handleLaunchMockTest}>
              Start Examination Session
            </button>
          </div>
        </div>

        {/* Standard Challenges Catalog List */}
        <div style={s.card}>
          <p style={s.cardTitle}>🎛️ Filter General Challenges</p>
          <div style={s.filterBar}>
            <input style={s.input} type="text" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={s.select} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <div style={s.multiSelectContainer} onClick={e => e.stopPropagation()}>
              <div style={s.multiSelectBox} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                  {selectedTags.length === 0 ? 'Select Tags...' : `Tags (${selectedTags.length})`}
                </span>
                <span>{isDropdownOpen ? '▲' : '▼'}</span>
              </div>
              {isDropdownOpen && (
                <div style={s.dropdownMenu}>
                  {AVAILABLE_TAGS.map(tag => {
                    const isChecked = selectedTags.includes(tag);
                    return (
                      <div key={tag} style={{ ...s.dropdownItem, background: isChecked ? '#f0f7ff' : 'transparent' }} onClick={() => handleGlobalTagToggle(tag)}>
                        <input type="checkbox" checked={isChecked} onChange={() => {}} />
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
          <p style={s.cardTitle}>⚡ Active Catalog Database ({problems.length})</p>
          <div>
            {isFetching ? (
              <p style={{ padding: '20px', color: '#888' }}>Loading challenges...</p>
            ) : problems.length === 0 ? (
              <p style={{ padding: '20px', color: '#888' }}>No problems match criteria.</p>
            ) : (
              problems.map(p => (
                <div key={p.code} style={s.problemRow} onClick={() => navigate(`/${user.username}/${p.code}`)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...s.problemName, marginBottom: '4px' }}>{p.name}</div>
                    <div>{p.tags?.map(t => <span key={t} style={s.tagBadge}>{t}</span>)}</div>
                  </div>
                  <span style={{ ...s.problemDifficulty, ...(p.difficulty === 'Easy' ? s.difficultyEasy : p.difficulty === 'Medium' ? s.difficultyMedium : s.difficultyHard) }}>
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