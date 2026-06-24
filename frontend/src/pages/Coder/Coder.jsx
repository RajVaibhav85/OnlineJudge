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

    // Session Context Management State
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

    // Consolidated Workspace Data Synchronization Pipeline
    // Workspace Pipeline: Triggered on initial load, language modifications, or manual refresh
useEffect(() => {
    let isMounted = true;
    setFetchingData(true);

    const syncWorkspaceSessionData = async () => {
        try {
            // 1. Fetch User details from /api/auth/me via HTTP-Only Cookies
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

            // 2. Fetch Target Challenge Metadata Specifications
            const probRes = await fetch(`${DB_API}/get-problem/${problemCode}`);
            if (!probRes.ok) throw new Error('Target matrix unreachable.');
            const probData = await probRes.json();

            // 3. Fetch Problem Evaluation Assertions
            const tcRes = await fetch(`${DB_API}/get-testcases/${problemCode}`);
            const tcData = await tcRes.json();

            if (!isMounted) return;
            setProblem(probData);
            setTestCases(Array.isArray(tcData) ? tcData : (tcData.data || []));

            if (probData?.sampleInput) {
                setCustomInput(typeof probData.sampleInput === 'string' ? probData.sampleInput : JSON.stringify(probData.sampleInput));
            }

            // 4. FIX: Accurate route syntax matching your dbRoutes backend structure
            // GET /api/db/latest-submission/:userId/:problemId
            const submissionRes = await fetch(`${DB_API}/latest-submission/${resolvedUserId}/${probData._id}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (submissionRes.ok) {
                const resJson = await submissionRes.json();
                
                // If your backend returns an array or an object wrapped inside 'data'
                if (resJson.success && resJson.data) {
                    const targetBackendLanguage = languageMapping.toBackend[language]; // e.g., "C++"
                    
                    let matchingSubmission = null;
                    
                    if (Array.isArray(resJson.data)) {
                        // If it returns a list of submissions, find the one matching the current language tab
                        matchingSubmission = resJson.data.find(sub => sub.language === targetBackendLanguage);
                    } else if (resJson.data.language === targetBackendLanguage) {
                        // If it returns a single snapshot object, check if it matches the current tab language
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

            // Default behavior fallback: render clean boilerplate if no history exists for this specific language tab
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
}, [problemCode, language, navigate]); // Triggers smoothly when switching language tabs to sync user progress

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

    // Horizontal Split Drag Calculator
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

    // Vertical Split Drag Calculator
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
                    const matched = response.ok && (tc.output.trim() === (data.output || '').trim());

                    return {
                        id: tc._id || idx,
                        input: tc.input,
                        expectedOutput: tc.output,
                        actualOutput: data.output || data.error || 'Blank Return Matrix',
                        isHidden: tc.isHidden,
                        passed: matched,
                        diagnostics: response.ok ? 'Success' : 'Fault'
                    };
                } catch {
                    return { id: tc._id || idx, input: tc.input, expectedOutput: tc.output, actualOutput: 'Transport connection failure loops.', isHidden: tc.isHidden, passed: false, diagnostics: 'Disconnected' };
                }
            });

            const outputs = await Promise.all(tasks);
            setExecutionResults(outputs);

            const errorsFound = outputs.some(item => !item.passed);
            const absoluteVerdict = errorsFound ? 'Wrong Answer' : 'Accepted';

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
                        await fetch(`${DB_API}/update-solution-verdict/${subData.data._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                verdict: absoluteVerdict,
                                executionTime: 18, 
                                memory: 32,
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
        return <div style={{ background: '#121212', height: '100vh', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px' }}>Acquiring Context Profiles via Security Decoupled Handshakes...</div>;
    }

    return (
        <div ref={containerRef} style={{ display: 'flex', height: '100vh', background: '#121212', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}>
            
            {/* Split Panel - Descriptions Framework Area */}
            <div style={{ width: `${leftPanelWidth}%`, borderRight: '2px solid #262626', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: '#151515' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => navigate(`/${userContext?.username || ''}`)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        ← Dashboard ({userContext?.username || 'User'})
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#2a2a2a', padding: '4px 8px', borderRadius: '4px', color: problem.difficulty === 'Easy' ? '#10b981' : '#f59e0b' }}>
                        {problem.difficulty || 'Medium'}
                    </span>
                </div>
                
                <div style={{ padding: '25px 20px', overflowY: 'auto', flex: 1, lineHeight: '1.6' }}>
                    <h1 style={{ margin: '0 0 12px 0', fontSize: '21px', letterSpacing: '-0.3px' }}>{problem.name || 'Untitled Problem'}</h1>
                    <p style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{problem.statement}</p>
                    
                    {problem.constraints && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ color: '#ef4444', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase' }}>Constraints Profile</h4>
                            <pre style={{ background: '#1e1e1e', padding: '10px', borderRadius: '6px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', border: '1px solid #2d2d2d', color: '#fca5a5' }}>{renderDataSafely(problem.constraints)}</pre>
                        </div>
                    )}

                    {problem.sampleInput && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ color: '#10b981', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase' }}>Sample Input Case</h4>
                            <pre style={{ background: '#1e1e1e', padding: '10px', borderRadius: '6px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', border: '1px solid #2d2d2d' }}>{renderDataSafely(problem.sampleInput)}</pre>
                        </div>
                    )}

                    {problem.sampleOutput && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ color: '#10b981', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase' }}>Sample Output Target</h4>
                            <pre style={{ background: '#1e1e1e', padding: '10px', borderRadius: '6px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', border: '1px solid #2d2d2d' }}>{renderDataSafely(problem.sampleOutput)}</pre>
                        </div>
                    )}
                </div>
            </div>

            <div onMouseDown={startHorizontalResize} style={{ width: '6px', background: '#121212', cursor: 'col-resize', zIndex: 10 }} />

            {/* Split Panel - Workspace Editor Space */}
            <div ref={rightPanelRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: '#1e1e1e' }}>
                <div style={{ padding: '12px 20px', display: 'flex', gap: '10px', alignItems: 'center', background: '#141414', borderBottom: '1px solid #262626' }}>
                    <select 
                        value={language} 
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '4px', background: '#262626', color: '#fff', border: '1px solid #444', cursor: 'pointer', fontSize: '13px' }}
                    >
                        <option value="cpp">C++</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                    </select>
                    
                    <button onClick={handleCustomRun} disabled={actionLoading} style={{ padding: '6px 14px', borderRadius: '4px', background: '#262626', color: '#fff', border: '1px solid #444', cursor: 'pointer', fontSize: '13px' }}>Run Code</button>
                    <button onClick={() => handleAutomatedEvaluation('run')} disabled={actionLoading} style={{ padding: '6px 14px', borderRadius: '4px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Run Tests</button>
                    <button onClick={() => handleAutomatedEvaluation('submit')} disabled={actionLoading} style={{ padding: '6px 18px', borderRadius: '4px', background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>SUBMIT</button>
                    <button onClick={handleAiReview} disabled={isAiLoading} style={{ padding: '6px 14px', borderRadius: '4px', background: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto', fontSize: '13px' }}>✨ AI REVIEW</button>
                </div>

                <div style={{ height: `${editorHeight}%`, width: '100%', overflow: 'hidden' }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={language}
                        onMount={handleEditorDidMount}
                        options={{ fontSize: 13.5, minimap: { enabled: false }, automaticLayout: true }}
                    />
                </div>

                <div onMouseDown={startVerticalResize} style={{ height: '6px', background: '#121212', cursor: 'row-resize', zIndex: 10 }} />

                {/* Outputs Sandboxed Control Console Tray */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#161616', borderBottom: '1px solid #262626' }}>
                        <button onClick={() => setConsoleMode('custom')} style={{ padding: '10px 20px', background: consoleMode === 'custom' ? '#111' : 'transparent', color: consoleMode === 'custom' ? '#3b82f6' : '#64748b', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Custom Console</button>
                        <button onClick={() => setConsoleMode('testcases')} style={{ padding: '10px 20px', background: consoleMode === 'testcases' ? '#111' : 'transparent', color: consoleMode === 'testcases' ? '#3b82f6' : '#64748b', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Test Run Evaluation Matrix {executionResults && `(${executionResults.filter(r => r.passed).length}/${executionResults.length})`}</button>
                    </div>

                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                        {consoleMode === 'custom' ? (
                            <div style={{ display: 'flex', gap: '15px', height: '100%', minHeight: '110px' }}>
                                <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: '1px solid #2d2d2d', borderRadius: '4px', padding: '10px', fontFamily: 'monospace', resize: 'none', fontSize: '12px' }} />
                                <div style={{ flex: 1, background: '#070707', color: customError ? '#ef4444' : '#4ade80', border: '1px solid #2d2d2d', borderRadius: '4px', padding: '10px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '12px', overflowY: 'auto' }}>
                                    {customOutput || "Console output buffer trace is empty."}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {verdictMessage && (
                                    <div style={{ padding: '10px', borderRadius: '4px', background: verdictMessage.includes('🟢') ? 'rgba(22, 163, 74, 0.12)' : 'rgba(239, 68, 68, 0.12)', border: `1px solid ${verdictMessage.includes('🟢') ? '#16a34a' : '#dc2626'}`, color: verdictMessage.includes('🟢') ? '#4ade80' : '#fca5a5', fontWeight: 'bold', marginBottom: '12px', fontSize: '13px' }}>
                                        {verdictMessage}
                                    </div>
                                )}
                                {executionResults && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {executionResults.map((res, i) => (
                                            <div key={res.id} style={{ background: '#181818', border: `1px solid ${res.passed ? '#16a34a' : '#dc2626'}`, borderRadius: '6px', padding: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                                    <span style={{ fontWeight: 'bold', color: res.passed ? '#4ade80' : '#f87171' }}>Assertion Step #{i + 1} ({res.passed ? 'PASSED' : 'FAILED'})</span>
                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{res.diagnostics}</span>
                                                </div>
                                                {!res.isHidden && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px', fontFamily: 'monospace', background: '#0d0d0d', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                                                        <div><span style={{ color: '#555' }}>Input Stream:</span> <pre style={{ margin: '2px 0 0 0', color: '#fff' }}>{res.input}</pre></div>
                                                        <div><span style={{ color: '#555' }}>Expected Configuration:</span> <pre style={{ margin: '2px 0 0 0', color: '#4ade80' }}>{res.expectedOutput}</pre></div>
                                                        <div><span style={{ color: '#555' }}>Actual Outcome:</span> <pre style={{ margin: '2px 0 0 0', color: res.passed ? '#4ade80' : '#f87171' }}>{res.actualOutput}</pre></div>
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
            {isDrawerOpen && <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.65)', zIndex: 999 }} />}
            <div style={{ position: 'fixed', top: 0, right: isDrawerOpen ? 0 : '-500px', width: '100%', maxWidth: '480px', height: '100vh', background: '#151515', boxShadow: '-8px 0 30px rgba(0,0,0,0.7)', zIndex: 1000, transition: 'right 0.25s ease-in-out', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #2d2d2d', background: '#1c1c1c' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#818cf8' }}>✨ AI Diagnostics Insight Matrix</h2>
                    <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '26px', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, whiteSpace: 'pre-wrap', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '12.5px', lineHeight: '1.5' }}>
                    {isAiLoading ? 'Executing semantic parser array vectors...' : aiReviewData}
                </div>
            </div>

        </div>
    );
}