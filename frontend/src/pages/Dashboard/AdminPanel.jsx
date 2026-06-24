import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const AVAILABLE_TAGS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Tree', 'Graph'];

const s = {
  page: { minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  nav: { background: '#fff', borderBottom: '0.5px solid #e0e0e0', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: '16px', fontWeight: '500', color: '#111', margin: 0 },
  btn: { background: '#111', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' },
  main: { maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' },
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#111', margin: '0 0 1.25rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  fullWidth: { gridColumn: 'span 2' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', minHeight: '60px', boxSizing: 'border-box', fontFamily: 'inherit' },
  select: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', background: '#fff' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' },
  tagBadge: { fontSize: '12px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #ddd' },
  problemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' },
  actionBtn: { padding: '4px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', marginLeft: '6px', background: '#fff' },
  testCaseRow: { background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: '6px', padding: '10px', marginBottom: '8px' }
}

export default function AdminPanel() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()

  const [problems, setProblems] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState({ text: '', error: false })

  // Problem Form State
  const [form, setForm] = useState({
    name: '', code: '', difficulty: 'Easy', statement: '', description: '',
    sampleInput: '', sampleOutput: '', constraints: '', tags: []
  })

  // --- TEST CASE CRUD STATES ---
  const [selectedProblemCode, setSelectedProblemCode] = useState(null)
  const [testCases, setTestCases] = useState([])
  const [isEditingTestCaseId, setIsEditingTestCaseId] = useState(null)
  const [tcForm, setTcForm] = useState({ input: '', output: '', isHidden: false })

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/auth')
      else if (user.role !== 'admin') navigate(`/${user.username}`)
      else if (username !== user.username) navigate(`/${user.username}/admin`, { replace: true })
    }
  }, [user, loading, username, navigate])

  const fetchProblems = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/get-problems`)
      const data = await res.json()
      if (data.success) setProblems(data.data || [])
    } catch (err) { console.error(err) }
  }

  useEffect(() => { 
    if (user?.role === 'admin') fetchProblems() 
  }, [user])

  const handleInputChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleTagToggle = (tag) => {
    const currentTags = Array.isArray(form.tags) ? form.tags : [];
    const updatedTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag]
    setForm({ ...form, tags: updatedTags })
  }

  const clearForm = () => {
    setForm({ name: '', code: '', difficulty: 'Easy', statement: '', description: '', sampleInput: '', sampleOutput: '', constraints: '', tags: [] })
    setIsEditing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ text: '', error: false })
    const url = isEditing ? `${BACKEND_URL}/api/db/update-problem/${form.code}` : `${BACKEND_URL}/api/db/insert-problem`;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, createdBy: user?._id })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: data.message || "Operation successful!", error: false })
        clearForm()
        fetchProblems()
      } else {
        setMessage({ text: data.error || data.message || "An error occurred.", error: true })
      }
    } catch (err) { setMessage({ text: "Server connection failed.", error: true }) }
  }

  const handleEditSelect = async (code) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/get-problem/${code}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setForm({
            name: data.name || '', code: data.code || '', difficulty: data.difficulty || 'Easy',
            statement: data.statement || '', description: data.description || '', sampleInput: data.sampleInput || '',
            sampleOutput: data.sampleOutput || '', constraints: data.constraints || '', tags: Array.isArray(data.tags) ? data.tags : []
          })
          setIsEditing(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (code) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${code}"?`)) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/delete-problem/${code}`, { method: 'DELETE' })
      if (res.ok) {
        fetchProblems()
        if (selectedProblemCode === code) setSelectedProblemCode(null)
        if (form.code === code) clearForm()
      }
    } catch (err) { console.error(err) }
  }

  // --- READ TEST CASES ---
  const handleManageTestCases = async (code) => {
    setSelectedProblemCode(code)
    setIsEditingTestCaseId(null)
    setTcForm({ input: '', output: '', isHidden: false })
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/get-testcases/${code}`)
      const data = await res.json()
      if (res.ok) {
        // Safe check to verify data structure matching database schema returns
        setTestCases(Array.isArray(data) ? data : data.data || [])
      }
    } catch (err) { console.error(err) }
  }

  // --- CREATE & UPDATE TEST CASES ---
  const handleTestCaseSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProblemCode) return

    const isUpdating = !!isEditingTestCaseId;
    const url = isUpdating 
      ? `${BACKEND_URL}/api/db/update-testcase/${isEditingTestCaseId}`
      : `${BACKEND_URL}/api/db/insert-testcases/${selectedProblemCode}`;
    
    const method = isUpdating ? 'PUT' : 'POST';
    // Back-end maps array payload for insert: { testCases: [...] }
    const payload = isUpdating ? tcForm : { testCases: [tcForm] };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setTcForm({ input: '', output: '', isHidden: false })
        setIsEditingTestCaseId(null)
        handleManageTestCases(selectedProblemCode) // Refresh list
      }
    } catch (err) { console.error(err) }
  }

  // --- PRE-FILL FOR UPDATE ---
  const startTestCaseEdit = (tc) => {
    setIsEditingTestCaseId(tc._id)
    setTcForm({
      input: tc.input || '',
      output: tc.output || '',
      isHidden: tc.isHidden || false
    })
  }

  // --- DELETE TEST CASE ---
  const handleTestCaseDelete = async (id) => {
    if (!window.confirm("Delete this testcase instance?")) return
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/delete-testcase/${id}`, { method: 'DELETE' })
      if (res.ok) {
        handleManageTestCases(selectedProblemCode) // Refresh list
      }
    } catch (err) { console.error(err) }
  }

  if (loading || !user || user.role !== 'admin') return <div style={{ padding: '40px', color: '#888' }}>Checking credentials...</div>

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>⚙️ Admin Problem Repository Core</p>
        <button style={s.btn} onClick={() => navigate(`/${user.username}`)}>Back to Dashboard</button>
      </nav>

      <main style={s.main}>
        {message.text && (
          <div style={{ ...s.card, background: message.error ? '#fee2e2' : '#d1fae5', color: message.error ? '#dc2626' : '#047857', fontWeight: '500' }}>
            {message.text}
          </div>
        )}

        {/* Problem Creation/Editing Section */}
        <div style={s.card}>
          <p style={s.cardTitle}>{isEditing ? "📝 Modify Existing Challenge Settings" : "➕ Register New Code Challenge"}</p>
          <form onSubmit={handleSubmit}>
            <div style={s.grid}>
              <div>
                <label style={s.label}>Challenge Name *</label>
                <input style={s.input} name="name" value={form.name} onChange={handleInputChange} required />
              </div>
              <div>
                <label style={s.label}>URL Slug Code *</label>
                <input style={s.input} name="code" value={form.code} onChange={handleInputChange} required disabled={isEditing} />
              </div>
              <div style={s.fullWidth}>
                <label style={s.label}>Problem Statement *</label>
                <textarea style={s.textarea} name="statement" value={form.statement} onChange={handleInputChange} required />
              </div>
              <div style={s.fullWidth}>
                <label style={s.label}>Short Description</label>
                <textarea style={s.textarea} name="description" value={form.description} onChange={handleInputChange} />
              </div>
              <div>
                <label style={s.label}>Difficulty Ranking *</label>
                <select style={s.select} name="difficulty" value={form.difficulty} onChange={handleInputChange}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Constraints Mapping</label>
                <input style={s.input} name="constraints" value={form.constraints} onChange={handleInputChange} />
              </div>
              <div>
                <label style={s.label}>Sample Input</label>
                <input style={s.input} name="sampleInput" value={form.sampleInput} onChange={handleInputChange} />
              </div>
              <div>
                <label style={s.label}>Sample Output</label>
                <input style={s.input} name="sampleOutput" value={form.sampleOutput} onChange={handleInputChange} />
              </div>
              <div style={s.fullWidth}>
                <label style={s.label}>Select Tags Hierarchy</label>
                <div style={s.tagContainer}>
                  {AVAILABLE_TAGS.map(tag => {
                    const isSelected = Array.isArray(form.tags) && form.tags.includes(tag);
                    return (
                      <span key={tag} style={{ ...s.tagBadge, background: isSelected ? '#111' : '#fff', color: isSelected ? '#fff' : '#111' }} onClick={() => handleTagToggle(tag)}>
                        {tag}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={s.btn}>{isEditing ? "Save Parameters" : "Create Registry"}</button>
              {isEditing && <button type="button" style={{ ...s.btn, background: '#fff', border: '1px solid #ccc', color: '#111' }} onClick={clearForm}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* Existing Problem Database Inventory */}
        <div style={s.card}>
          <p style={s.cardTitle}>📦 Existing Challenge Database Inventory ({problems.length})</p>
          <div>
            {problems.map(p => (
              <div key={p.code} style={s.problemRow}>
                <div>
                  <strong style={{ color: '#111', fontSize: '14px' }}>{p.name}</strong>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>({p.code})</span>
                </div>
                <div>
                  <button style={{ ...s.actionBtn, color: '#059669', borderColor: '#a7f3d0' }} onClick={() => handleManageTestCases(p.code)}>Test Cases</button>
                  <button style={{ ...s.actionBtn, color: '#2563eb' }} onClick={() => handleEditSelect(p.code)}>Edit</button>
                  <button style={{ ...s.actionBtn, color: '#dc2626' }} onClick={() => handleDelete(p.code)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- DYNAMIC TEST CASES CRUD PANEL --- */}
        {selectedProblemCode && (
          <div style={{ ...s.card, borderTop: '4px solid #111' }}>
            <p style={{ ...s.cardTitle, marginBottom: '4px' }}>🧪 Test Cases Matrix for: <span style={{color: '#2563eb'}}>{selectedProblemCode}</span></p>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Perform full management mutations directly against production models.</p>

            {/* Create / Edit Form */}
            <form onSubmit={handleTestCaseSubmit} style={{ marginBottom: '24px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0' }}>{isEditingTestCaseId ? "✏️ Edit Target Test Case" : "➕ Append New Test Case Node"}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={s.label}>Input Stream Data</label>
                  <textarea style={s.textarea} value={tcForm.input} onChange={e => setTcForm({...tcForm, input: e.target.value})} required placeholder="Input data parameters..."/>
                </div>
                <div>
                  <label style={s.label}>Expected Output Match</label>
                  <textarea style={s.textarea} value={tcForm.output} onChange={e => setTcForm({...tcForm, output: e.target.value})} required placeholder="Expected output match..."/>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={tcForm.isHidden} onChange={e => setTcForm({...tcForm, isHidden: e.target.checked})}/>
                  Flag as Hidden (Secret Evaluation Test Case)
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="submit" style={{ ...s.btn, background: '#2563eb' }}>{isEditingTestCaseId ? "Update Case" : "Push Case Entry"}</button>
                  {isEditingTestCaseId && (
                    <button type="button" style={{ ...s.btn, background: '#fff', border: '1px solid #ccc', color: '#111' }} onClick={() => { setIsEditingTestCaseId(null); setTcForm({ input: '', output: '', isHidden: false }) }}>Cancel</button>
                  )}
                </div>
              </div>
            </form>

            {/* List Array (Read Node instances) */}
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>Active Instances Array ({testCases.length})</p>
              {testCases.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888', padding: '10px 0' }}>No active test cases compiled for this problem slug yet.</p>
              ) : (
                testCases.map((tc, index) => (
                  <div key={tc._id || index} style={s.testCaseRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#444' }}>Case #{index + 1} {tc.isHidden ? '👁️‍🗨️ (Hidden)' : '🌍 (Public)'}</span>
                      <div>
                        <button style={{ ...s.actionBtn, margin: 0, padding: '2px 8px', color: '#2563eb' }} onClick={() => startTestCaseEdit(tc)}>Modify</button>
                        <button style={{ ...s.actionBtn, marginLeft: '4px', padding: '2px 8px', color: '#dc2626' }} onClick={() => handleTestCaseDelete(tc._id)}>Purge</button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', fontFamily: 'monospace', background: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #e5e5e5' }}>
                      <div><strong>In:</strong> {tc.input}</div>
                      <div><strong>Out:</strong> {tc.output}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}