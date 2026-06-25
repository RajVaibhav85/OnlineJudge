import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const AVAILABLE_LANGUAGES = ['C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C#', 'Ruby'];
const AVAILABLE_FRAMEWORKS = ['Node.js', 'React', 'Express', 'NestJS', 'Next.js', 'Vue', 'Django', 'Spring Boot'];

const s = {
  page: { 
    minHeight: '100vh', 
    background: 'radial-gradient(circle at 50% 0%, #111827 0%, #030712 100%)', 
    color: '#f3f4f6', 
    fontFamily: 'Inter, system-ui, sans-serif', 
    padding: '3rem 2rem',
    letterSpacing: '-0.01em'
  },
  container: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  card: { 
    background: 'rgba(31, 41, 55, 0.3)', 
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.07)', 
    borderRadius: '16px', 
    padding: '2.25rem', 
    boxSizing: 'border-box',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
  },
  title: { fontSize: '18px', fontWeight: '600', margin: '0 0 1.75rem', color: '#f9fafb', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '12px', letterSpacing: '-0.02em' },
  group: { marginBottom: '1.5rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#9ca3af' },
  input: { 
    width: '100%', 
    padding: '11px 14px', 
    background: 'rgba(17, 24, 39, 0.4)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: '10px', 
    color: '#f9fafb', 
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)'
  },
  textarea: { 
    width: '100%', 
    padding: '11px 14px', 
    background: 'rgba(17, 24, 39, 0.4)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: '10px', 
    color: '#f9fafb', 
    minHeight: '110px', 
    resize: 'vertical', 
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.15)'
  },
  pillContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' },
  pill: { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' },
  btn: { 
    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', 
    color: '#030712', 
    border: 'none', 
    padding: '12px 24px', 
    borderRadius: '10px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px 0 rgba(56, 189, 248, 0.3)'
  }
};

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedFrameworks, setSelectedFrameworks] = useState([]);
  
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
    return <div style={{ display: 'flex', height: '100vh', background: '#030712', color: '#9ca3af', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontFamily: 'sans-serif' }}>Syncing Dev profile dashboard array metrics...</div>;
  }

  return (
    <div style={s.page}>
      <div style={{ maxWidth: '1200px', margin: '0 auto 2rem auto' }}>
         <button 
           onClick={() => navigate(-1)} 
           style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}
           onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
           onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
         >
           ← Back to Workspace
         </button>
      </div>

      <div style={s.container}>
        {/* Editor Form View Block Panel */}
        <form onSubmit={handleSaveChanges} style={s.card}>
          <h3 style={s.title}>Edit Developer Profile Specs</h3>
          
          <div style={s.group}>
            <label style={s.label}>About Biography Context</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Tell us about your computational methodologies..." 
              style={s.textarea} 
              onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={s.group}>
            <label style={s.label}>GitHub Profile Resource URL Link</label>
            <input 
              type="url" 
              value={github} 
              onChange={(e) => setGithub(e.target.value)} 
              placeholder="https://github.com/your-profile" 
              style={s.input} 
              onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={s.group}>
            <label style={s.label}>LinkedIn Professional Network URL Link</label>
            <input 
              type="url" 
              value={linkedin} 
              onChange={(e) => setLinkedin(e.target.value)} 
              placeholder="https://linkedin.com/in/your-profile" 
              style={s.input} 
              onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={s.group}>
            <label style={s.label}>Personal Website Portfolio URL Link</label>
            <input 
              type="url" 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)} 
              placeholder="https://yourwebsite.dev" 
              style={s.input} 
              onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={s.group}>
            <label style={s.label}>Familiar Language Proficiencies</label>
            <div style={s.pillContainer}>
              {AVAILABLE_LANGUAGES.map(lang => {
                const active = selectedLanguages.includes(lang);
                return (
                  <span 
                    key={lang} 
                    onClick={() => handleToggleLanguage(lang)} 
                    style={{ 
                      ...s.pill, 
                      background: active ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)', 
                      color: active ? '#38bdf8' : '#9ca3af', 
                      border: `1px solid ${active ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                      boxShadow: active ? '0 0 12px 0 rgba(56, 189, 248, 0.2)' : 'none'
                    }}
                    onMouseEnter={e => { if(!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#f9fafb'; } }}
                    onMouseLeave={e => { if(!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.color = '#9ca3af'; } }}
                  >
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
                  <span 
                    key={fw} 
                    onClick={() => handleToggleFramework(fw)} 
                    style={{ 
                      ...s.pill, 
                      background: active ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.03)', 
                      color: active ? '#34d399' : '#9ca3af', 
                      border: `1px solid ${active ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                      boxShadow: active ? '0 0 12px 0 rgba(52, 211, 153, 0.2)' : 'none'
                    }}
                    onMouseEnter={e => { if(!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#f9fafb'; } }}
                    onMouseLeave={e => { if(!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.color = '#9ca3af'; } }}
                  >
                    {fw}
                  </span>
                );
              })}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving} 
            style={s.btn}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(56, 189, 248, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(56, 189, 248, 0.3)'; }}
          >
            {saving ? "Saving Changes..." : "Commit Profile Core Modification"}
          </button>
        </form>

        {/* Live Visualizations Metrics Analytics Display Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Sub-Card 1: Resolution Metrics Core */}
          <div style={s.card}>
            <h3 style={s.title}>Algorithmic Mastery Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
              <div style={{ background: 'rgba(17, 24, 39, 0.4)', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#38bdf8', letterSpacing: '-0.02em', filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.3))' }}>{stats.problemsSolved}</div>
                <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#9ca3af', marginTop: '6px', letterSpacing: '0.05em' }}>Total Solutions Accepted</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(17, 24, 39, 0.2)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: '#34d399', fontWeight: '500' }}>🟢 Easy Solved:</span> <strong style={{color: '#fff'}}>{stats.difficultyBreakdown.easy}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(17, 24, 39, 0.2)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: '#fbbf24', fontWeight: '500' }}>🟡 Medium Solved:</span> <strong style={{color: '#fff'}}>{stats.difficultyBreakdown.medium}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', background: 'rgba(17, 24, 39, 0.2)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: '#f87171', fontWeight: '500' }}>🔴 Hard Solved:</span> <strong style={{color: '#fff'}}>{stats.difficultyBreakdown.hard}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Card 2: Render Checked Skill Manifest List Blocks */}
          <div style={s.card}>
            <h3 style={s.title}>Developer Skill Stack Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Language Matrices</h4>
                  <div style={s.pillContainer}>
                    {selectedLanguages.map(l => <span key={l} style={{ ...s.pill, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)' }}>{l}</span>)}
                    {selectedLanguages.length === 0 && <span style={{ color: '#4b5563', fontSize: '13px', fontStyle: 'italic' }}>No languages mapped.</span>}
                  </div>
               </div>
               <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Framework Deployments</h4>
                  <div style={s.pillContainer}>
                     {selectedFrameworks.map(f => <span key={f} style={{ ...s.pill, background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>{f}</span>)}
                     {selectedFrameworks.length === 0 && <span style={{ color: '#4b5563', fontSize: '13px', fontStyle: 'italic' }}>No framework stacks mapped.</span>}
                  </div>
               </div>
            </div>
          </div>

          {/* Sub-Card 3: Solved Problem History Slugs */}
          <div style={s.card}>
            <h3 style={s.title}>Mastered Matrix History Slugs</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
               {stats.solvedProblemsList.map(slug => (
                  <span key={slug} style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', color: '#9ca3af', fontFamily: 'Fira Code, monospace' }}>
                     ✓ {slug}
                  </span>
               ))}
               {stats.solvedProblemsList.length === 0 && (
                  <span style={{ color: '#4b5563', fontSize: '13px', fontStyle: 'italic' }}>No problem sets completed on this dev account.</span>
               )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}