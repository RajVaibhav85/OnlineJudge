import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const AVAILABLE_LANGUAGES = ['C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C#', 'Ruby'];
const AVAILABLE_FRAMEWORKS = ['Node.js', 'React', 'Express', 'NestJS', 'Next.js', 'Vue', 'Django', 'Spring Boot'];

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '2rem 1rem' },
  container: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  card: { background: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '2rem', boxSizing: 'border-box' },
  title: { fontSize: '20px', fontWeight: '500', margin: '0 0 1.5rem', color: '#fff', borderBottom: '1px solid #222', paddingBottom: '10px' },
  group: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '0.5rem', color: '#aaa' },
  input: { width: '100%', padding: '0.75rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.75rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box' },
  pillContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' },
  pill: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' },
  btn: { background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: '6px', cursor: 'pointer', transition: 'background 0.2s' }
};

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Profile State Core
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState([]);
  
  // Solution Tracking Metrics Sub-State Array
  const [stats, setStats] = useState({
    problemsSolved: 0,
    difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
    solvedProblemsList: []
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/profile/get-profile`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!res.ok) throw new Error("Failed to load user profile context configuration matrix.");
        const data = await res.json();
        
        if (data) {
          setBio(data.bio || '');
          setGithub(data.socials?.github || '');
          setLinkedin(data.socials?.linkedin || '');
          setWebsite(data.socials?.website || '');
          setSelectedLanguages(data.skills?.languages || []);
          setSelectedFrameworks(data.skills?.frameworks || []);
          if (data.stats) {
            setStats({
              problemsSolved: data.stats.problemsSolved || 0,
              difficultyBreakdown: data.stats.difficultyBreakdown || { easy: 0, medium: 0, hard: 0 },
              solvedProblemsList: data.stats.solvedProblemsList || []
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleToggleLanguage = (lang) => {
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(i => i !== lang) : [...prev, lang]);
  };

  const handleToggleFramework = (fw) => {
    setSelectedFrameworks(prev => prev.includes(fw) ? prev.filter(i => i !== fw) : [...prev, fw]);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          github,
          linkedin,
          website,
          languages: selectedLanguages,
          frameworks: selectedFrameworks
        }),
        credentials: 'include'
      });
      if (res.ok) alert("Profile settings committed successfully!");
    } catch (err) {
      console.error(err);
      alert("Error committing profile matrix configuration logs.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a', color: '#666', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>Syncing Dev profile dashboard array metrics...</div>;
  }

  return (
    <div style={s.page}>
      <div style={{ maxWidth: '1200px', margin: '0 auto 1.5rem auto' }}>
         <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #333', color: '#aaa', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>← Back to Workspace Workspace</button>
      </div>

      <div style={s.container}>
        {/* Editor Form View Block Panel */}
        <form onSubmit={handleSaveChanges} style={s.card}>
          <h3 style={s.title}>Edit Developer Profile Specs</h3>
          
          <div style={s.group}>
            <label style={s.label}>About Biography Context</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about your computational methodologies..." style={s.textarea} />
          </div>

          <div style={s.group}>
            <label style={s.label}>GitHub Profile Resource URL Link</label>
            <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/your-profile" style={s.input} />
          </div>

          <div style={s.group}>
            <label style={s.label}>LinkedIn Professional Network URL Link</label>
            <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/your-profile" style={s.input} />
          </div>

          <div style={s.group}>
            <label style={s.label}>Personal Website Portfolio URL Link</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.dev" style={s.input} />
          </div>

          <div style={s.group}>
            <label style={s.label}>Familiar Language Proficiencies</label>
            <div style={s.pillContainer}>
              {AVAILABLE_LANGUAGES.map(lang => {
                const active = selectedLanguages.includes(lang);
                return (
                  <span key={lang} onClick={() => handleToggleLanguage(lang)} style={{ ...s.pill, background: active ? '#2563eb' : '#1e1e1e', color: active ? '#fff' : '#888', border: `1px solid ${active ? '#2563eb' : '#333'}` }}>
                    {lang}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={s.group}>
            <label style={s.label}>Familiar Framework Core Integrations</label>
            <div style={s.pillContainer}>
              {AVAILABLE_FRAMEWORKS.map(fw => {
                const active = selectedFrameworks.includes(fw);
                return (
                  <span key={fw} onClick={() => handleToggleFramework(fw)} style={{ ...s.pill, background: active ? '#16a34a' : '#1e1e1e', color: active ? '#fff' : '#888', border: `1px solid ${active ? '#16a34a' : '#333'}` }}>
                    {fw}
                  </span>
                );
              })}
            </div>
          </div>

          <button type="submit" disabled={saving} style={s.btn}>{saving ? "Saving Changes..." : "Commit Profile Core Modification"}</button>
        </form>

        {/* Live Visualizations Metrics Analytics Display Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Sub-Card 1: Resolution Metrics Core */}
          <div style={s.card}>
            <h3 style={s.title}>Algorithmic Mastery Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignItems: 'center' }}>
              <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #222' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.problemsSolved}</div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666', marginTop: '4px', letterSpacing: '0.5px' }}>Total Solutions Accepted</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: '#161616', padding: '6px 12px', borderRadius: '4px' }}>
                  <span style={{ color: '#4ade80' }}>🟢 Easy Problems Solved:</span> <strong>{stats.difficultyBreakdown.easy}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: '#161616', padding: '6px 12px', borderRadius: '4px' }}>
                  <span style={{ color: '#f59e0b' }}>🟡 Medium Problems Solved:</span> <strong>{stats.difficultyBreakdown.medium}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: '#161616', padding: '6px 12px', borderRadius: '4px' }}>
                  <span style={{ color: '#f87171' }}>🔴 Hard Problems Solved:</span> <strong>{stats.difficultyBreakdown.hard}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Card 2: Render Checked Skill Manifest List Blocks */}
          <div style={s.card}>
            <h3 style={s.title}>Developer Skill Stack Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#555', textTransform: 'uppercase' }}>Selected Language Matrices</h4>
                  <div style={s.pillContainer}>
                    {selectedLanguages.map(l => <span key={l} style={{ ...s.pill, background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>{l}</span>)}
                    {selectedLanguages.length === 0 && <span style={{ color: '#444', fontSize: '12px', fontStyle: 'italic' }}>No languages mapped.</span>}
                  </div>
               </div>
               <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#555', textTransform: 'uppercase' }}>Framework Deployments</h4>
                  <div style={s.pillContainer}>
                     {selectedFrameworks.map(f => <span key={f} style={{ ...s.pill, background: 'rgba(22,163,74,0.15)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.3)' }}>{f}</span>)}
                     {selectedFrameworks.length === 0 && <span style={{ color: '#444', fontSize: '12px', fontStyle: 'italic' }}>No framework stacks mapped.</span>}
                  </div>
               </div>
            </div>
          </div>

          {/* Sub-Card 3: Solved Problem History Slugs */}
          <div style={s.card}>
            <h3 style={s.title}>Mastered Matrix History Slugs</h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '180px', overflowY: 'auto' }}>
               {stats.solvedProblemsList.map(slug => (
                  <span key={slug} style={{ fontSize: '11px', padding: '4px 8px', background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px', color: '#aaa', fontFamily: 'monospace' }}>
                     ✓ {slug}
                  </span>
               ))}
               {stats.solvedProblemsList.length === 0 && (
                  <span style={{ color: '#444', fontSize: '12px', fontStyle: 'italic' }}>No problem sets completed on this dev account.</span>
               )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}