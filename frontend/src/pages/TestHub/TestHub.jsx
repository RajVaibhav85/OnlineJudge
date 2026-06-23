import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthContext';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const s = {
  page: { minHeight: '100vh', background: '#fafafa', fontFamily: 'system-ui, sans-serif', padding: '2rem 1rem' },
  container: { maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' },
  timerBox: { padding: '8px 16px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.5px' },
  title: { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.15s' },
  problemTitle: { fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' },
  tagBadge: { fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '6px', marginRight: '6px', fontWeight: '500' },
  diffBadge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px' },
  easy: { background: '#d1fae5', color: '#065f46' },
  medium: { background: '#fef3c7', color: '#92400e' },
  hard: { background: '#fee2e2', color: '#991b1b' },
  actionBtn: { background: '#1e293b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  analysisBox: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }
};

export default function TestHub() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [testProblems, setTestProblems] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isActive, setIsActive] = useState(false);
  
  // Evaluation State Layers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [aiErrorMsg, setAiErrorMsg] = useState(null);
  const [sessionVerdict, setSessionVerdict] = useState('Evaluated');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    const sessionId = sessionStorage.getItem('testhub_session_id');
    const rawProblems = sessionStorage.getItem('testhub_problems');
    const rawSeconds = sessionStorage.getItem('testhub_duration_seconds');

    if (!sessionId || !rawProblems || !rawSeconds) {
      alert('No active evaluation sessions located. Returning to dashboard.');
      if (user) navigate(`/${user.username}`);
      return;
    }

    setTestProblems(JSON.parse(rawProblems));
    setTimeLeft(Number(rawSeconds));
    setIsActive(true);
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!isActive || timeLeft === null) return;

    if (timeLeft <= 0) {
      setIsActive(false);
      handleFinishSession('Complete', true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const nextTime = prev - 1;
        sessionStorage.setItem('testhub_duration_seconds', String(nextTime));
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Dedicated AI Request Trigger Function
  const fetchAiFeedbackReport = async (currentVerdict) => {
    setIsAiLoading(true);
    setAiErrorMsg(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/ai-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: "Review session performance",
          language: "markdown",
          description: `Session Status: ${currentVerdict || sessionVerdict}. Total matching test metrics analyzed.`
        }),
        credentials: 'include'
      });
      
      const aiData = await response.json();

      if (!response.ok || aiData.error) {
        throw new Error(aiData.error || 'AI Assistant is currently overloaded.');
      }

      // Successful AI analysis retrieval - bind state maps and drop error markers
      setEvaluationResult({
        swotAnalysis: aiData.review || "### Session Feedback compiled successfully.",
        recommendations: testProblems.map(p => `Review optimized solutions for: ${p.name}`)
      });
    } catch (err) {
      console.error("Intercepted Frontend AI Error:", err);
      setAiErrorMsg("🤖 The AI review model is experiencing high demand right now. Your code has been saved, click below to try fetching your analysis again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFinishSession = async (actionType, autoSubmit = false) => {
    if (!autoSubmit && actionType === 'Terminate') {
      if (!confirm('Are you sure you want to terminate this exam? All code submissions will be lost.')) return;
    } else if (!autoSubmit && actionType === 'Complete') {
      if (!confirm('Submit exam solutions for formal evaluation?')) return;
    }

    setIsActive(false);
    const sessionId = sessionStorage.getItem('testhub_session_id');

    try {
      setIsSubmitting(true);

      const res = await fetch(`${BACKEND_URL}/api/testhub/session/${sessionId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType }),
        credentials: 'include'
      });

      const payload = await res.json();

      if (actionType === 'Terminate') {
        sessionStorage.clear();
        navigate(`/${user.username}`);
        return;
      }

      const calculatedVerdict = payload.data?.finalVerdict || 'Evaluated';
      setSessionVerdict(calculatedVerdict);

      // Trigger AI Feedback call sequence
      if (res.ok) {
        await fetchAiFeedbackReport(calculatedVerdict);
      }
    } catch (err) {
      alert('Failed to process session state alteration smoothly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 
      ? `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}` 
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading || timeLeft === null) return <div style={{ padding: '40px', color: '#888' }}>Initializing Exam Suite...</div>;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Active Mock Examination</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>User account context: {user?.username}</p>
          </div>
          {isActive && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={s.timerBox}>⏱️ {formatTime(timeLeft)}</div>
              <button style={s.actionBtn} onClick={() => handleFinishSession('Complete')}>Submit Answers</button>
              <button style={{ ...s.actionBtn, background: '#ef4444' }} onClick={() => handleFinishSession('Terminate')}>Terminate Session</button>
            </div>
          )}
        </div>

        {isSubmitting && <div style={{ padding: '20px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '20px' }}>Locking down session changes...</div>}

        {/* POST-SUBMISSION HUD CONTAINER DISPLAYED IF THE EXAM FINISHED */}
        {!isActive && !isSubmitting && (
          <div style={s.analysisBox}>
            <h2 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>📊 Test Performance Insights</h2>
            <div style={{ marginBottom: '15px' }}>
              <strong>Final Profile Evaluation Status: </strong>
              <span style={{ color: sessionVerdict === 'Passed' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{sessionVerdict}</span>
            </div>

            {/* AI Error Conditional Block + Retry Button Assembly */}
            {aiErrorMsg && (
              <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '15px', borderRadius: '8px', color: '#c2410c', fontSize: '14px', marginBottom: '15px' }}>
                <p style={{ margin: '0 0 12px 0' }}>{aiErrorMsg}</p>
                <button 
                  style={{ ...s.actionBtn, background: '#ea580c' }} 
                  disabled={isAiLoading}
                  onClick={() => fetchAiFeedbackReport(sessionVerdict)}
                >
                  {isAiLoading ? 'Retrying Connection...' : '✨ Re-Fetch AI Report'}
                </button>
              </div>
            )}

            {isAiLoading && !evaluationResult && (
              <div style={{ color: '#2563eb', fontWeight: '500', padding: '10px 0' }}>🔄 Calling AI Analytics Cluster Engine...</div>
            )}

            {/* AI Report Content Display (Hidden if missing) */}
            {evaluationResult && (
              <>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-wrap', fontSize: '14px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                  {evaluationResult.swotAnalysis}
                </div>

                <h3 style={{ fontSize: '15px', marginTop: '20px', color: '#334155' }}>🎯 Target Skill Enhancements:</h3>
                <ul>
                  {evaluationResult.recommendations.map((rec, index) => <li key={index} style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>{rec}</li>)}
                </ul>
              </>
            )}

            <button style={{ ...s.actionBtn, marginTop: '20px', display: 'block' }} onClick={() => { sessionStorage.clear(); navigate(`/${user.username}`); }}>
              Return to Dashboard
            </button>
          </div>
        )}

        {/* CHANNELS MATRIX RENDER (Visible only during exam duration window) */}
        {isActive && (
          <>
            <h2 style={{ fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Selected Challenges Matrix</h2>
            <div>
              {testProblems.map((prob) => (
                <div key={prob.code} style={s.card} onClick={() => navigate(`/${user.username}/${prob.code}`)}>
                  <div>
                    <div style={s.problemTitle}>{prob.name}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {prob.tags?.map(t => <span key={t} style={s.tagBadge}>{t}</span>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ ...s.diffBadge, ...(prob.difficulty === 'Easy' ? s.easy : prob.difficulty === 'Medium' ? s.medium : s.hard) }}>{prob.difficulty}</span>
                    <button style={s.actionBtn}>Code Challenge</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}