import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const COMPILER_API = `${BACKEND_URL}/api/compiler`;
const DB_API = `${BACKEND_URL}/api/db`;
const AI_API = `${BACKEND_URL}/api/ai`;
const AUTH_API = `${BACKEND_URL}/api/auth`;

const boilerplates = {
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
    python: `# Write your code here\nprint("Hello World")`,
    javascript: `// Write your code here\nconsole.log("Hello World");`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}`
};

const languageMapping = {
    toBackend: { cpp: 'C++', javascript: 'JavaScript', python: 'Python', java: 'Java' },
    toFrontend: { 'C++': 'cpp', 'JavaScript': 'javascript', 'Python': 'python', 'Java': 'java' }
};

export default function Coder() {
    const { code: problemCode } = useParams();
    const navigate = useNavigate();

    const containerRef = useRef(null);
    const rightPanelRef = useRef(null);
    const editorRef = useRef(null); 

    const [userContext, setUserContext] = useState(null);
    const [problem, setProblem] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [fetchingData, setFetchingData] = useState(true);
    const [language, setLanguage] = useState('cpp');

    const [codeCache, setCodeCache] = useState({
        cpp: boilerplates.cpp,
        javascript: boilerplates.javascript,
        python: boilerplates.python,
        java: boilerplates.java
    });
    
    const [leftPanelWidth, setLeftPanelWidth] = useState(40); 
    const [editorHeight, setEditorHeight] = useState(60);     

    const [consoleMode, setConsoleMode] = useState('custom'); 
    const [customInput, setCustomInput] = useState('');
    const [customOutput, setCustomOutput] = useState('');
    const [customError, setCustomError] = useState(false);
    
    const [executionResults, setExecutionResults] = useState(null); 
    const [actionLoading, setActionLoading] = useState(false); 
    const [verdictMessage, setVerdictMessage] = useState('');

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [aiReviewData, setAiReviewData] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const renderDataSafely = (dataBlock) => {
        if (!dataBlock) return '';
        return typeof dataBlock === 'string' ? dataBlock : JSON.stringify(dataBlock, null, 2);
    };

    useEffect(() => {
        let isMounted = true;
        setFetchingData(true);

        const syncWorkspaceSessionData = async () => {
            try {
                let currentUserProfile = userContext;
                if (!currentUserProfile) {
                    const profileRes = await fetch(`${AUTH_API}/me`, {
                        method: 'GET',
                        credentials: 'include'
                    });
                    if (!profileRes.ok) throw new Error('User session context unauthorized.');
                    currentUserProfile = await profileRes.json();
                    if (isMounted) setUserContext(currentUserProfile);
                }

                const resolvedUserId = currentUserProfile._id || currentUserProfile.id;

                const probRes = await fetch(`${DB_API}/get-problem/${problemCode}`);
                if (!probRes.ok) throw new Error('Target matrix unreachable.');
                const probData = await probRes.json();

                const tcRes = await fetch(`${DB_API}/get-testcases/${problemCode}`);
                const tcData = await tcRes.json();

                if (!isMounted) return;
                setProblem(probData);
                setTestCases(Array.isArray(tcData) ? tcData : (tcData.data || []));

                if (probData?.sampleInput) {
                    setCustomInput(typeof probData.sampleInput === 'string' ? probData.sampleInput : JSON.stringify(probData.sampleInput));
                }

                const submissionRes = await fetch(`${DB_API}/latest-submission/${resolvedUserId}/${probData._id}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                if (submissionRes.ok) {
                    const resJson = await submissionRes.json();
                    if (resJson.success && resJson.data) {
                        const targetBackendLanguage = languageMapping.toBackend[language];
                        let matchingSubmission = null;
                        
                        if (Array.isArray(resJson.data)) {
                            matchingSubmission = resJson.data.find(sub => sub.language === targetBackendLanguage);
                        } else if (resJson.data.language === targetBackendLanguage) {
                            matchingSubmission = resJson.data;
                        }

                        if (matchingSubmission && matchingSubmission.code) {
                            setCodeCache(prev => ({ ...prev, [language]: matchingSubmission.code }));
                            if (editorRef.current) {
                                editorRef.current.setValue(matchingSubmission.code);
                            }
                            return;
                        }
                    }
                }

                if (editorRef.current) {
                    editorRef.current.setValue(codeCache[language] || boilerplates[language]);
                }

            } catch (err) {
                console.error("Workspace synchronization sequence fault:", err);
                if (isMounted) navigate('/login');
            } finally {
                if (isMounted) setFetchingData(false);
            }
        };

        syncWorkspaceSessionData();
        return () => { isMounted = false; };
    }, [problemCode, language, navigate]);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
        editor.setValue(codeCache[language]);
    };

    const handleLanguageChange = (newLang) => {
        if (editorRef.current) {
            const codeToPreserve = editorRef.current.getValue();
            setCodeCache(prev => ({ ...prev, [language]: codeToPreserve }));
        }
        setLanguage(newLang);
    };

    const getActiveCode = () => {
        if (editorRef.current) return editorRef.current.getValue();
        return codeCache[language];
    };

    const startHorizontalResize = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftPanelWidth;
        const doHorizontalResize = (moveEvent) => {
            if (!containerRef.current) return;
            const totalWidth = containerRef.current.offsetWidth;
            const deltaX = moveEvent.clientX - startX;
            const newWidthPercent = startWidth + (deltaX / totalWidth) * 100;
            if (newWidthPercent > 20 && newWidthPercent < 75) setLeftPanelWidth(newWidthPercent);
        };
        const stopHorizontalResize = () => {
            window.removeEventListener('mousemove', doHorizontalResize);
            window.removeEventListener('mouseup', stopHorizontalResize);
        };
        window.addEventListener('mousemove', doHorizontalResize);
        window.addEventListener('mouseup', stopHorizontalResize);
    };

    const startVerticalResize = (e) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = editorHeight;
        const doVerticalResize = (moveEvent) => {
            if (!rightPanelRef.current) return;
            const totalHeight = rightPanelRef.current.offsetHeight;
            const deltaY = moveEvent.clientY - startY;
            const newHeightPercent = startHeight + (deltaY / totalHeight) * 100;
            if (newHeightPercent > 25 && newHeightPercent < 85) setEditorHeight(newHeightPercent);
        };
        const stopVerticalResize = () => {
            window.removeEventListener('mousemove', doVerticalResize);
            window.removeEventListener('mouseup', stopVerticalResize);
        };
        window.addEventListener('mousemove', doVerticalResize);
        window.addEventListener('mouseup', stopVerticalResize);
    };

    const handleCustomRun = async () => {
        setActionLoading(true);
        setCustomError(false);
        setCustomOutput('Executing sandbox compiler matrix engine...');
        setConsoleMode('custom');

        try {
            const response = await fetch(`${COMPILER_API}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code: getActiveCode(), input: customInput }),
                credentials: 'include'
            });
            const data = await response.json();
            
            // Demo logging for dynamic single-runs
            console.log("➡️ Custom Run API Response Payload:", data);

            if (response.ok) {
                setCustomOutput(data.output || "Execution sequence closed with empty buffer stream outputs.");
            } else {
                setCustomError(true);
                setCustomOutput(data.error || "A code runtime validation exception terminated execution.");
            }
        } catch (error) {
            setCustomError(true);
            setCustomOutput("Network route interruption dropped interaction channels to remote sandbox.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAutomatedEvaluation = async (evaluationScope) => {
        setActionLoading(true);
        setConsoleMode('testcases');
        setVerdictMessage('Validating active solution text with test assertions suite...');
        setExecutionResults(null);

        const targets = evaluationScope === 'run' ? testCases.filter(tc => !tc.isHidden) : testCases;
        if (targets.length === 0) {
            setVerdictMessage("No available test assertions matching current view criteria parameters.");
            setActionLoading(false);
            return;
        }

        const activeCodeBuffer = getActiveCode();

        // New metric aggregators to identify peak load metrics over all tests
        let maxTimeSpent = 0;
        let maxMemoryConsumed = 0;

        try {
            const tasks = targets.map(async (tc, idx) => {
                try {
                    const response = await fetch(`${COMPILER_API}/run`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ language, code: activeCodeBuffer, input: tc.input }),
                        credentials: 'include'
                    });
                    const data = await response.json();
                    
                    // Demo Logging: View single test case container stats
                    console.log(`📊 Test Case [Index: ${idx}] Sandbox Metrics:`, {
                        time: data.executionTime,
                        memory: data.memory,
                        success: response.ok
                    });

                    // Track maximum peak metrics dynamically
                    if (data.executionTime > maxTimeSpent) maxTimeSpent = data.executionTime;
                    if (data.memory > maxMemoryConsumed) maxMemoryConsumed = data.memory;

                    const matched = response.ok && (tc.output.trim() === (data.output || '').trim());

                    return {
                        id: tc._id || idx,
                        input: tc.input,
                        expectedOutput: tc.output,
                        actualOutput: data.output || data.error || 'Blank Return Matrix',
                        isHidden: tc.isHidden,
                        passed: matched,
                        diagnostics: response.ok ? `Success (${data.executionTime}ms)` : 'Fault'
                    };
                } catch {
                    return { id: tc._id || idx, input: tc.input, expectedOutput: tc.output, actualOutput: 'Transport connection failure loops.', isHidden: tc.isHidden, passed: false, diagnostics: 'Disconnected' };
                }
            });

            const outputs = await Promise.all(tasks);
            setExecutionResults(outputs);

            const errorsFound = outputs.some(item => !item.passed);
            const absoluteVerdict = errorsFound ? 'Wrong Answer' : 'Accepted';

            // Demo Logging: Peak summary metrics gathered across all test bounds
            console.log("🏁 Consolidated Test Suite Absolute Metrics Summary:", {
                verdict: absoluteVerdict,
                peakExecutionTime: `${maxTimeSpent}ms`,
                peakMemoryConsumption: `${maxMemoryConsumed}MB`
            });

            setVerdictMessage(
                errorsFound 
                ? (evaluationScope === 'submit' ? '❌ Evaluation Terminated: Code verification criteria mismatch.' : '❌ Public Test Suite Failures Enforced.')
                : (evaluationScope === 'submit' ? '🟢 Accepted / Verification Saved cleanly to storage array 🎉' : '🟢 Public Verification Samples Passed Successfully.')
            );

            if (evaluationScope === 'submit' && userContext) {
                const schemaMappedLanguage = languageMapping.toBackend[language] || 'C++';
                const resolvedUserId = userContext._id || userContext.id;

                const subRes = await fetch(`${DB_API}/submit-solution/${problemCode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        problemId: problem._id,
                        userId: resolvedUserId,
                        code: activeCodeBuffer,
                        language: schemaMappedLanguage
                    }),
                    credentials: 'include'
                });

                const subData = await subRes.json();
                
                if (subRes.ok && subData.success) {
                    setCodeCache(prev => ({ ...prev, [language]: activeCodeBuffer }));
                    if (subData.data?._id) {
                        
                        console.log(`📤 Dispatching Dynamic Verdict Update for Solution ID: ${subData.data._id}`);

                        await fetch(`${DB_API}/update-solution-verdict/${subData.data._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                verdict: absoluteVerdict,
                                executionTime: maxTimeSpent,      // Replaced static 18 with true calculated value
                                memory: maxMemoryConsumed,        // Replaced static 32 with true calculated value
                                output: errorsFound ? 'Assertion mismatch trace metrics recorded.' : 'All compilation limits valid.'
                            }),
                            credentials: 'include'
                        });
                    }
                } else {
                    setVerdictMessage(`❌ Sync Failure: ${subData.message || 'Database tier rejected transactional synchronization.'}`);
                }
            }

        } catch (err) {
            console.error(err);
            setVerdictMessage('Validation loop runtime exception failure.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAiReview = async () => {
        setIsDrawerOpen(true);
        setIsAiLoading(true);
        setAiReviewData('Evaluating semantic abstraction layer parameters via AI review core diagnostics...');
        try {
            const response = await fetch(`${AI_API}/ai-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: getActiveCode(), language, description: problem ? problem.statement : '' }),
                credentials: 'include'
            });
            const data = await response.json();
            setAiReviewData(response.ok ? data.review : `### Process Interruption\n${data.error}`);
        } catch (error) {
            setAiReviewData("### Transport Error\nFailed to allocate execution pathways to processing cloud elements.");
        } finally {
            setIsAiLoading(false);
        }
    };

    if (fetchingData) {
        return <div style={{ background: '#030712', height: '100vh', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontFamily: 'sans-serif' }}>Acquiring Context Profiles via Security Decoupled Handshakes...</div>;
    }

    return (
        <div ref={containerRef} style={{ display: 'flex', height: '100vh', background: '#030712', color: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
            
            {/* Split Panel - Descriptions Framework Area */}
            <div style={{ width: `${leftPanelWidth}%`, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: '#0b0f19' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(17, 24, 39, 0.2)' }}>
                    <button 
                        onClick={() => navigate(`/${userContext?.username || ''}`)} 
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                        ← Dashboard ({userContext?.username || 'User'})
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', background: problem.difficulty === 'Easy' ? 'rgba(6, 78, 59, 0.4)' : 'rgba(120, 53, 15, 0.4)', padding: '4px 10px', borderRadius: '20px', color: problem.difficulty === 'Easy' ? '#34d399' : '#fbbf24', border: `1px solid ${problem.difficulty === 'Easy' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)'}` }}>
                        {problem.difficulty || 'Medium'}
                    </span>
                </div>
                
                <div style={{ padding: '2rem 1.5rem', overflowY: 'auto', flex: 1, lineHeight: '1.6' }}>
                    <h1 style={{ margin: '0 0 16px 0', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', color: '#f9fafb' }}>{problem.name || 'Untitled Problem'}</h1>
                    <p style={{ color: '#d1d5db', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{problem.statement}</p>
                    
                    {problem.constraints && (
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ color: '#f87171', marginBottom: '8px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Constraints Profile</h4>
                            <pre style={{ background: 'rgba(17, 24, 39, 0.4)', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', border: '1px solid rgba(248, 113, 113, 0.15)', color: '#fca5a5', fontFamily: 'Fira Code, monospace' }}>{renderDataSafely(problem.constraints)}</pre>
                        </div>
                    )}

                    {problem.sampleInput && (
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ color: '#34d399', marginBottom: '8px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sample Input Case</h4>
                            <pre style={{ background: 'rgba(17, 24, 39, 0.4)', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', border: '1px solid rgba(52, 211, 153, 0.15)', color: '#e5e7eb', fontFamily: 'Fira Code, monospace' }}>{renderDataSafely(problem.sampleInput)}</pre>
                        </div>
                    )}

                    {problem.sampleOutput && (
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ color: '#34d399', marginBottom: '8px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sample Output Target</h4>
                            <pre style={{ background: 'rgba(17, 24, 39, 0.4)', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', border: '1px solid rgba(52, 211, 153, 0.15)', color: '#e5e7eb', fontFamily: 'Fira Code, monospace' }}>{renderDataSafely(problem.sampleOutput)}</pre>
                        </div>
                    )}
                </div>
            </div>

            <div onMouseDown={startHorizontalResize} style={{ width: '4px', background: '#030712', cursor: 'col-resize', zIndex: 10, opacity: 0.5, transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#38bdf8'} onMouseLeave={e => e.target.style.background = '#030712'} />

            {/* Split Panel - Workspace Editor Space */}
            <div ref={rightPanelRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: '#1e1e1e' }}>
                <div style={{ padding: '12px 20px', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(17, 24, 39, 0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
                    <select 
                        value={language} 
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        style={{ padding: '6px 32px 6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', color: '#f3f4f6', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', noRepeat: 'true', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
                    >
                        <option value="cpp" style={{background: '#111827'}}>C++</option>
                        <option value="javascript" style={{background: '#111827'}}>JavaScript</option>
                        <option value="python" style={{background: '#111827'}}>Python</option>
                        <option value="java" style={{background: '#111827'}}>Java</option>
                    </select>
                    
                    <button onClick={handleCustomRun} disabled={actionLoading} style={{ padding: '7px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>Run Code</button>
                    <button onClick={() => handleAutomatedEvaluation('run')} disabled={actionLoading} style={{ padding: '7px 14px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(37, 99, 235, 0.35)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(37, 99, 235, 0.2)'}>Run Tests</button>
                    <button onClick={() => handleAutomatedEvaluation('submit')} disabled={actionLoading} style={{ padding: '7px 18px', borderRadius: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#030712', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s', boxShadow: '0 4px 12px 0 rgba(16, 185, 129, 0.25)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>SUBMIT</button>
                    <button onClick={handleAiReview} disabled={isAiLoading} style={{ padding: '7px 14px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', marginLeft: 'auto', fontSize: '13px', boxShadow: '0 4px 12px 0 rgba(99, 102, 241, 0.25)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>✨ AI REVIEW</button>
                </div>

                <div style={{ height: `${editorHeight}%`, width: '100%', overflow: 'hidden' }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={language}
                        onMount={handleEditorDidMount}
                        options={{ fontSize: 13.5, minimap: { enabled: false }, automaticLayout: true, padding: { top: 12 } }}
                    />
                </div>

                <div onMouseDown={startVerticalResize} style={{ height: '4px', background: '#030712', cursor: 'row-resize', zIndex: 10, opacity: 0.5 }} onMouseEnter={e => e.target.style.background = '#38bdf8'} onMouseLeave={e => e.target.style.background = '#030712'} />

                {/* Outputs Sandboxed Control Console Tray */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#070a13', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: 'rgba(17, 24, 39, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setConsoleMode('custom')} style={{ padding: '12px 20px', background: consoleMode === 'custom' ? 'rgba(255,255,255,0.03)' : 'transparent', color: consoleMode === 'custom' ? '#38bdf8' : '#9ca3af', border: 'none', borderBottom: consoleMode === 'custom' ? '2px solid #38bdf8' : '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}>Custom Console</button>
                        <button onClick={() => setConsoleMode('testcases')} style={{ padding: '12px 20px', background: consoleMode === 'testcases' ? 'rgba(255,255,255,0.03)' : 'transparent', color: consoleMode === 'testcases' ? '#38bdf8' : '#9ca3af', border: 'none', borderBottom: consoleMode === 'testcases' ? '2px solid #38bdf8' : '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}>Test Run Evaluation Matrix {executionResults && `(${executionResults.filter(r => r.passed).length}/${executionResults.length})`}</button>
                    </div>

                    <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
                        {consoleMode === 'custom' ? (
                            <div style={{ display: 'flex', gap: '16px', height: '100%', minHeight: '110px' }}>
                                <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} style={{ flex: 1, background: 'rgba(17, 24, 39, 0.3)', color: '#f3f4f6', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', fontFamily: 'Fira Code, monospace', resize: 'none', fontSize: '13px', outline: 'none' }} onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                                <div style={{ flex: 1, background: 'rgba(3, 7, 18, 0.4)', color: customError ? '#f87171' : '#34d399', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px', fontFamily: 'Fira Code, monospace', whiteSpace: 'pre-wrap', fontSize: '13px', overflowY: 'auto', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.2)' }}>
                                    {customOutput || "Console output buffer trace is empty."}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {verdictMessage && (
                                    <div style={{ padding: '12px 16px', borderRadius: '8px', background: verdictMessage.includes('🟢') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${verdictMessage.includes('🟢') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, color: verdictMessage.includes('🟢') ? '#34d399' : '#f87171', fontWeight: '600', marginBottom: '16px', fontSize: '13px', backdropFilter: 'blur(4px)' }}>
                                        {verdictMessage}
                                    </div>
                                )}
                                {executionResults && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {executionResults.map((res, i) => (
                                            <div key={res.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${res.passed ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`, borderRadius: '10px', padding: '14px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: '600', color: res.passed ? '#34d399' : '#f87171' }}>Assertion Step #{i + 1} ({res.passed ? 'PASSED' : 'FAILED'})</span>
                                                    <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{res.diagnostics}</span>
                                                </div>
                                                {!res.isHidden && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '12.5px', fontFamily: 'Fira Code, monospace', background: 'rgba(3, 7, 18, 0.3)', padding: '10px', borderRadius: '6px', marginTop: '6px', color: '#cbd5e1' }}>
                                                        <div><span style={{ color: '#4b5563', display: 'block', fontSize: '11px', fontWeight: '600' }}>Input Stream:</span> <pre style={{ margin: '4px 0 0 0', color: '#f3f4f6' }}>{res.input}</pre></div>
                                                        <div><span style={{ color: '#4b5563', display: 'block', fontSize: '11px', fontWeight: '600' }}>Expected Configuration:</span> <pre style={{ margin: '4px 0 0 0', color: '#34d399' }}>{res.expectedOutput}</pre></div>
                                                        <div><span style={{ color: '#4b5563', display: 'block', fontSize: '11px', fontWeight: '600' }}>Actual Outcome:</span> <pre style={{ margin: '4px 0 0 0', color: res.passed ? '#34d399' : '#f87171' }}>{res.actualOutput}</pre></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sliding Layer - AI Metrics Sidecar */}
            {isDrawerOpen && <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 999 }} />}
            <div style={{ position: 'fixed', top: 0, right: isDrawerOpen ? 0 : '-500px', width: '100%', maxWidth: '480px', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-10px 0 40px rgba(0,0,0,0.6)', zIndex: 1000, transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(17, 24, 39, 0.4)' }}>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: '#818cf8', letterSpacing: '-0.01em' }}>✨ AI Diagnostics Insight Matrix</h2>
                    <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>&times;</button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, whiteSpace: 'pre-wrap', color: '#e5e7eb', fontFamily: 'Fira Code, monospace', fontSize: '13px', lineHeight: '1.6' }}>
                    {isAiLoading ? 'Executing semantic parser array vectors...' : aiReviewData}
                </div>
            </div>

        </div>
    );
}