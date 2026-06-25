import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/AuthContext'

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const AVAILABLE_TAGS = ['Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting', 'Greedy', 'Tree', 'Graph'];

const s = {
  page: { minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  nav: { background: '#fff', borderBottom: '0.5px solid #e0e0e0', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: '16px', fontWeight: '500', color: '#111', margin: 0 },
  btn: { background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', color: '#555' },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  fullWidth: { gridColumn: '1 / -1' },
  welcome: { fontSize: '22px', fontWeight: '500', color: '#111', margin: '0 0 1.5rem' },
  card: { background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' },
  cardTitle: { fontSize: '15px', fontWeight: '500', color: '#111', margin: '0 0 1rem' },
  formGroup: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', height: '80px', boxSizing: 'border-box', resize: 'vertical' },
  select: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', background: '#fff' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' },
  tagButton: { padding: '4px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', cursor: 'pointer' },
  submitBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginTop: '10px' },
  dangerBtn: { background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  problemItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' },
  testCaseRow: { border: '1px solid #ddd', padding: '10px', borderRadius: '6px', marginBottom: '10px', background: '#fafafa' },
  errorBanner: { padding: '10px 14px', background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' },
  tcBox: { border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', background: '#f8fafc', marginBottom: '12px', position: 'relative' }
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [problems, setProblems] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [testCases, setTestCases] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  const [probForm, setProbForm] = useState({ name: '', statement: '', code: '', difficulty: 'Easy', description: '', sampleInput: '', sampleOutput: '', constraints: '', tags: [] })
  const [multipleTestCases, setMultipleTestCases] = useState([{ input: '', output: '', isHidden: false }])

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/auth')
    } else if (user) {
      fetchProblems()
    }
  }, [user, loading, navigate])

  const fetchProblems = () => {
    fetch(`${BACKEND_URL}/api/db/get-problems`)
      .then(res => res.json())
      .then(data => { if (data.success) setProblems(data.data) })
      .catch(err => console.error(err))
  }

  const fetchTestCases = (code) => {
    fetch(`${BACKEND_URL}/api/db/get-testcases/${code}`)
      .then(res => res.json())
      .then(data => { if (data.success) setTestCases(data.data) })
      .catch(err => console.error(err))
  }

  const handleSelectProblem = (probSummary) => {
    setErrorMessage('')
    fetch(`${BACKEND_URL}/api/db/get-problem/${probSummary.code}`)
      .then(res => res.json())
      .then(fullProblem => {
        setSelectedProblem(fullProblem)
        setProbForm(fullProblem)
        fetchTestCases(fullProblem.code)
      })
      .catch(err => console.error(err))
  }

  const handleProbInputChange = (e) => {
    const { name, value } = e.target
    setProbForm({ ...probForm, [name]: value })
  }

  const handleTagToggle = (tag) => {
    const tags = probForm.tags.includes(tag) 
      ? probForm.tags.filter(t => t !== tag) 
      : [...probForm.tags, tag]
    setProbForm({ ...probForm, tags })
  }

  const handleSaveProblem = (e) => {
    e.preventDefault()
    setErrorMessage('')
    
    const isUpdate = !!selectedProblem
    const url = isUpdate 
      ? `${BACKEND_URL}/api/db/update-problem/${selectedProblem.code}` 
      : `${BACKEND_URL}/api/db/insert-problem`
    
    fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...probForm, createdBy: user.id })
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || data.message || 'Failed to save problem')
        }
        return data
      })
      .then(() => {
        alert('Problem saved successfully')
        resetProblemForm()
        fetchProblems()
      })
      .catch(err => {
        setErrorMessage(err.message)
      })
  }

  const handleDeleteProblem = (code, e) => {
    e.stopPropagation()
    if (!confirm('Delete this problem and all its testcases?')) return

    fetch(`${BACKEND_URL}/api/db/delete-testcases/problem/${code}`, { method: 'DELETE' })
      .then(() => fetch(`${BACKEND_URL}/api/db/delete-problem/${code}`, { method: 'DELETE' }))
      .then(() => {
        alert('Problem purged successfully')
        resetProblemForm()
        fetchProblems()
      })
      .catch(err => console.error(err))
  }

  const resetProblemForm = () => {
    setSelectedProblem(null)
    setErrorMessage('')
    setProbForm({ name: '', statement: '', code: '', difficulty: 'Easy', description: '', sampleInput: '', sampleOutput: '', constraints: '', tags: [] })
    setTestCases([])
    setMultipleTestCases([{ input: '', output: '', isHidden: false }])
  }

  const handleAddTcRow = () => {
    setMultipleTestCases([...multipleTestCases, { input: '', output: '', isHidden: false }])
  }

  const handleRemoveTcRow = (index) => {
    if (multipleTestCases.length === 1) return
    setMultipleTestCases(multipleTestCases.filter((_, i) => i !== index))
  }

  const handleTcInputChange = (index, field, value) => {
    const updated = [...multipleTestCases]
    updated[index][field] = value
    setMultipleTestCases(updated)
  }

  const handleBatchInsertTestCases = (e) => {
    e.preventDefault()
    if (!selectedProblem) return alert('Select a problem first')
    setErrorMessage('')

    fetch(`${BACKEND_URL}/api/db/insert-testcases/${selectedProblem.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testCases: multipleTestCases })
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Failed to insert test cases')
        }
        return data
      })
      .then(() => {
        alert('Batch test cases inserted successfully.')
        setMultipleTestCases([{ input: '', output: '', isHidden: false }])
        fetchTestCases(selectedProblem.code)
      })
      .catch(err => {
        setErrorMessage(err.message)
      })
  }

  const handleDeleteTestCase = (id) => {
    fetch(`${BACKEND_URL}/api/db/delete-testcase/${id}`, { method: 'DELETE' })
      .then(() => fetchTestCases(selectedProblem.code))
      .catch(err => console.error(err))
  }

  if (loading || !user || user.role !== 'admin') return <div style={{ padding: '40px' }}>Access Denied / Loading...</div>

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <p style={s.navTitle}>Admin Dashboard</p>
        <button style={s.btn} onClick={() => navigate(`/${user.username}`)}>Return to Dashboard</button>
      </nav>

      <main style={s.main}>
        <div style={{ ...s.card, ...s.fullWidth }}>
          <h1 style={s.welcome}>Admin Workspace Engine ⚙️</h1>
          {errorMessage && <div style={s.errorBanner}>⚠️ {errorMessage}</div>}
        </div>

        <div>
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={s.cardTitle}>Problems Registry</p>
              <button style={{ ...s.btn, background: '#10b981', color: '#fff', border: 'none' }} onClick={resetProblemForm}>+ Create New</button>
            </div>
            <div>
              {problems.map(p => (
                <div key={p.code} style={s.problemItem} onClick={() => handleSelectProblem(p)}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{p.name}</span>
                    <span style={{ fontSize: '12px', marginLeft: '8px', color: '#666' }}>({p.code})</span>
                  </div>
                  <button style={s.dangerBtn} onClick={(e) => handleDeleteProblem(p.code, e)}>Delete</button>
                </div>
              ))}
            </div>
          </div>

          {selectedProblem && (
            <div style={s.card}>
              <p style={s.cardTitle}>Test Cases ({selectedProblem.code})</p>
              <form onSubmit={handleBatchInsertTestCases}>
                {multipleTestCases.map((tc, index) => (
                  <div key={index} style={s.tcBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5' }}>Test Case #{index + 1}</span>
                      {multipleTestCases.length > 1 && (
                        <span style={{ fontSize: '12px', color: '#dc2626', cursor: 'pointer' }} onClick={() => handleRemoveTcRow(index)}>Remove Row</span>
                      )}
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Input</label>
                      <textarea style={s.textarea} value={tc.input} onChange={e => handleTcInputChange(index, 'input', e.target.value)} required />
                    </div>
                    <div style={s.formGroup}>
                      <label style={s.label}>Output</label>
                      <textarea style={s.textarea} value={tc.output} onChange={e => handleTcInputChange(index, 'output', e.target.value)} required />
                    </div>
                    <div style={s.formGroup}>
                      <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={tc.isHidden} onChange={e => handleTcInputChange(index, 'isHidden', e.target.checked)} /> Is Hidden
                      </label>
                    </div>
                  </div>
                ))}

                <button type="button" style={{ ...s.btn, width: '100%', border: '1px dashed #4f46e5', color: '#4f46e5', marginBottom: '12px' }} onClick={handleAddTcRow}>
                  + Add Another Test Case
                </button>

                <button type="submit" style={s.submitBtn}>Insert Test Cases</button>
              </form>

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

              <p style={s.cardTitle}>Current Test Cases</p>
              <div>
                {testCases.map((tc, index) => (
                  <div key={tc._id || index} style={s.testCaseRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: '#444' }}>
                      <span><b>Test Case:</b> #{index + 1} | {tc.isHidden ? '❌ Hidden' : '👁️ Public'}</span>
                      <span style={{ color: '#dc2626', cursor: 'pointer' }} onClick={() => handleDeleteTestCase(tc._id)}>Delete</span>
                    </div>
                    <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', background: '#eee', padding: '6px', borderRadius: '4px', marginBottom: '4px' }}>In: {tc.input}</div>
                    <div style={{ fontSize: '11px', whiteSpace: 'pre-wrap', background: '#e0f2fe', padding: '6px', borderRadius: '4px' }}>Out: {tc.output}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={s.card}>
            <p style={s.cardTitle}>{selectedProblem ? 'Update Problem' : 'Insert Problem'}</p>
            <form onSubmit={handleSaveProblem}>
              <div style={s.formGroup}>
                <label style={s.label}>Name</label>
                <input type="text" name="name" style={s.input} value={probForm.name} onChange={handleProbInputChange} required />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Code</label>
                <input type="text" name="code" style={s.input} value={probForm.code} onChange={handleProbInputChange} disabled={!!selectedProblem} required />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Difficulty</label>
                <select name="difficulty" style={s.select} value={probForm.difficulty} onChange={handleProbInputChange}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <textarea name="description" style={s.textarea} value={probForm.description} onChange={handleProbInputChange} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Statement</label>
                <textarea name="statement" style={s.textarea} value={probForm.statement} onChange={handleProbInputChange} required />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Constraints</label>
                <textarea name="constraints" style={s.textarea} value={probForm.constraints} onChange={handleProbInputChange} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Sample Input</label>
                <textarea name="sampleInput" style={s.textarea} value={probForm.sampleInput} onChange={handleProbInputChange} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Sample Output</label>
                <textarea name="sampleOutput" style={s.textarea} value={probForm.sampleOutput} onChange={handleProbInputChange} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Tags</label>
                <div style={s.tagContainer}>
                  {AVAILABLE_TAGS.map(t => {
                    const active = probForm.tags.includes(t);
                    return (
                      <button key={t} type="button" style={{ ...s.tagButton, background: active ? '#e0e7ff' : '#fff', color: active ? '#4f46e5' : '#333', borderColor: active ? '#4f46e5' : '#ddd' }} onClick={() => handleTagToggle(t)}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button type="submit" style={{ ...s.submitBtn, background: selectedProblem ? '#2563eb' : '#4f46e5' }}>
                {selectedProblem ? 'Update Problem' : 'Insert Problem'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}