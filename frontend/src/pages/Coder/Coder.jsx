import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const COMPILER_API = `${BACKEND_URL}/api/compiler`;
const DB_API = `${BACKEND_URL}/api/db`;
const AI_API = `${BACKEND_URL}/api/ai`;

const boilerplates = {
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
    python: `# Write your code here\nprint("Hello World")`,
    javascript: `// Write your code here\nconsole.log("Hello World");`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}`
};

export default function Coder() {
    const { username, code: problemCode } = useParams();
    const navigate = useNavigate();

    // DOM references
    const containerRef = useRef(null);
    const rightPanelRef = useRef(null);
    const editorRef = useRef(null); 

    const [problem, setProblem] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [fetchingData, setFetchingData] = useState(true);

    const [language, setLanguage] = useState('cpp');
    const [editorValue, setEditorValue] = useState(boilerplates.cpp);
    
    // UI Layout percentages
    const [leftPanelWidth, setLeftPanelWidth] = useState(40); 
    const [editorHeight, setEditorHeight] = useState(60);     

    // Console tabs & run records
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

    // TestHub Synchronized States
    const [isTestHubSession, setIsTestHubSession] = useState(false);
    const [hubTimeLeft, setHubTimeLeft] = useState(null);

    const renderDataSafely = (dataBlock) => {
        if (!dataBlock) return '';
        return typeof dataBlock === 'string' ? dataBlock : JSON.stringify(dataBlock, null, 2);
    };

    // Native Dragger Resize Handlers
    const startHorizontalResize = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftPanelWidth;

        const doHorizontalResize = (moveEvent) => {
            if (!containerRef.current) return;
            const totalWidth = containerRef.current.offsetWidth;
            const deltaX = moveEvent.clientX - startX;
            const newWidthPercent = startWidth + (deltaX / totalWidth) * 100;
            if (newWidthPercent > 20 && newWidthPercent < 75) {
                setLeftPanelWidth(newWidthPercent);
            }
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
            if (newHeightPercent > 25 && newHeightPercent < 85) {
                setEditorHeight(newHeightPercent);
            }
        };

        const stopVerticalResize = () => {
            window.removeEventListener('mousemove', doVerticalResize);
            window.removeEventListener('mouseup', stopVerticalResize);
        };

        window.addEventListener('mousemove', doVerticalResize);
        window.addEventListener('mouseup', stopVerticalResize);
    };

    // Core Data Mounting Context Effect
    useEffect(() => {
        let isMounted = true;
        setFetchingData(true);

        const isSessionActive = sessionStorage.getItem('testhub_active') === 'true';
        const sessionProblemsRaw = sessionStorage.getItem('testhub_problems');
        const secondsRaw = sessionStorage.getItem('testhub_duration_seconds');
        
        if (isSessionActive && sessionProblemsRaw) {
            try {
                const problemsPool = JSON.parse(sessionProblemsRaw);
                const matchFound = problemsPool.some(p => p.code === problemCode);
                if (matchFound) {
                    setIsTestHubSession(true);
                    if (secondsRaw) setHubTimeLeft(Number(secondsRaw));
                }
            } catch (e) {
                console.error("TestHub tracking validation exception:", e);
            }
        }

        const fetchContext = async () => {
            try {
                const probRes = await fetch(`${DB_API}/get-problem/${problemCode}`);
                if (!probRes.ok) throw new Error('Problem resource missing');
                const probData = await probRes.json();

                const tcRes = await fetch(`${DB_API}/get-testcases/${problemCode}`);
                const tcData = await tcRes.json();

                if (!isMounted) return;

                setProblem(probData);
                setTestCases(Array.isArray(tcData) ? tcData : (tcData.data || []));

                if (probData?.sampleInput) {
                    setCustomInput(typeof probData.sampleInput === 'string' ? probData.sampleInput : JSON.stringify(probData.sampleInput));
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                if (isMounted) setFetchingData(false);
            }
        };

        fetchContext();
        return () => { isMounted = false; };
    }, [problemCode]);

    // Active TestHub Floating Clock Synchronization Interval
    useEffect(() => {
        if (!isTestHubSession || hubTimeLeft === null || hubTimeLeft <= 0) return;

        const hubInterval = setInterval(() => {
            setHubTimeLeft(prev => {
                const nextVal = prev - 1;
                sessionStorage.setItem('testhub_duration_seconds', String(nextVal));
                return nextVal;
            });
        }, 1000);

        return () => clearInterval(hubInterval);
    }, [isTestHubSession, hubTimeLeft]);

    const formatHubTime = (seconds) => {
        if (!seconds || seconds <= 0) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` 
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Track boilerplate language switches correctly
    useEffect(() => {
        if (language && boilerplates[language]) {
            setEditorValue(boilerplates[language]);
        }
    }, [language]);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    const handleCustomRun = async () => {
        setActionLoading(true);
        setCustomError(false);
        setCustomOutput('Compiling custom execution matrix...');
        setConsoleMode('custom');

        try {
            const response = await fetch(`${COMPILER_API}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code: editorValue, input: customInput }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setCustomOutput(data.output || "Execution completed without output text response.");
            } else {
                setCustomError(true);
                setCustomOutput(data.error || "An execution error occurred.");
            }
        } catch (error) {
            setCustomError(true);
            setCustomOutput("Network error connecting compiler sandbox.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAutomatedEvaluation = async (evaluationScope) => {
        setActionLoading(true);
        setConsoleMode('testcases');
        setVerdictMessage('Evaluating code against runtime test vectors...');
        setExecutionResults(null);

        const targetScopeCases = evaluationScope === 'run' 
            ? testCases.filter(tc => !tc.isHidden) 
            : testCases;

        if (targetScopeCases.length === 0) {
            setVerdictMessage("No compatible test parameters present for calculation.");
            setActionLoading(false);
            return;
        }

        try {
            const evaluationPipeline = targetScopeCases.map(async (tc, index) => {
                try {
                    const response = await fetch(`${COMPILER_API}/run`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ language, code: editorValue, input: tc.input }),
                        credentials: 'include'
                    });
                    const data = await response.json();
                    
                    const normalizedExpected = tc.output.trim();
                    const normalizedActual = (data.output || '').trim();
                    const processPassed = response.ok && (normalizedExpected === normalizedActual);

                    return {
                        id: tc._id || index,
                        input: tc.input,
                        expectedOutput: tc.output,
                        actualOutput: data.output || data.error || 'Empty Buffer',
                        isHidden: tc.isHidden,
                        passed: processPassed,
                        runtimeDiagnostics: response.ok ? 'Success' : 'Runtime Error Exception'
                    };
                } catch {
                    return {
                        id: tc._id || index,
                        input: tc.input,
                        expectedOutput: tc.output,
                        actualOutput: 'Network disconnect dropped evaluation packet.',
                        isHidden: tc.isHidden,
                        passed: false,
                        runtimeDiagnostics: 'Pipeline Error'
                    };
                }
            });

            const processedOutputs = await Promise.all(evaluationPipeline);
            setExecutionResults(processedOutputs);

            const errorsFound = processedOutputs.some(item => !item.passed);
            const absoluteVerdict = errorsFound ? 'Wrong Answer' : 'Accepted';

            if (errorsFound) {
                setVerdictMessage(evaluationScope === 'submit' ? '❌ Wrong Answer / Execution Exception' : '❌ Failed Public Test Cases');
            } else {
                setVerdictMessage(evaluationScope === 'submit' ? '🟢 Accepted / All Metrics Verified' : '🟢 Tests Passed (Public Scope Only)');
            }

            if (evaluationScope === 'submit') {
                const activeTestHubId = sessionStorage.getItem('testhub_session_id');

                await fetch(`${DB_API}/save-submission`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        problemId: problem._id,
                        code: editorValue,
                        language,
                        verdict: absoluteVerdict,
                        testHubId: isTestHubSession ? activeTestHubId : null
                    }),
                    credentials: 'include'
                });
            }

        } catch (err) {
            setVerdictMessage('Evaluation pipeline failed internally.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAiReview = async () => {
        setIsDrawerOpen(true);
        setIsAiLoading(true);
        setAiReviewData('Analyzing structural edge cases and optimizations...');

        try {
            const response = await fetch(`${AI_API}/ai-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: editorValue, language, description: problem ? problem.statement : '' }),
                credentials: 'include'
            });
            const data = await response.json();
            setAiReviewData(response.ok ? data.review : `### Error\n${data.error}`);
        } catch (error) {
            setAiReviewData("### Network Error\nFailed to target AI Endpoint.");
        } finally {
            setIsAiLoading(false);
        }
    };

    if (fetchingData) {
        return <div style={{ background: '#1e1e1e', height: '100vh', color: '#aaa', padding: '40px' }}>Loading Challenge Context...</div>;
    }

    if (!problem) {
        return (
            <div style={{ background: '#1e1e1e', height: '100vh', color: '#f87171', padding: '40px' }}>
                <h3>Problem context missing!</h3>
                <button onClick={() => navigate(`/${username || ''}`)} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ display: 'flex', height: '100vh', background: '#1e1e1e', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden', position: 'relative' }}>
            
            {/* Left Panel - Question Metadata */}
            <div style={{ width: `${leftPanelWidth}%`, borderRight: '2px solid #333', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: '#151515' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                        onClick={() => navigate(isTestHubSession ? `/testhub/session` : `/${username}`)} 
                        style={{ background: 'none', border: '1px solid #555', color: '#aaa', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        {isTestHubSession ? '← Back to Test Suite' : '← Dashboard'}
                    </button>
                    
                    {/* FLOATING TIMER SYNCHRONIZED BADGE DISPLAY */}
                    {isTestHubSession && (
                        <span style={{ fontSize: '12px', background: '#dc2626', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', letterSpacing: '0.3px' }}>
                            ⏱️ EXAM TIME: {formatHubTime(hubTimeLeft)}
                        </span>
                    )}

                    <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#333', padding: '2px 8px', borderRadius: '4px', color: '#f59e0b' }}>
                        {problem.difficulty || 'Medium'}
                    </span>
                </div>
                
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, lineHeight: '1.6' }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>{problem.name || 'Untitled Challenge'}</h1>
                    <p style={{ color: '#ccc', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{problem.statement}</p>
                    
                    {problem.description && (
                        <>
                            <h4 style={{ color: '#3b82f6', marginBottom: '4px' }}>Context Details</h4>
                            <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>{problem.description}</p>
                        </>
                    )}

                    {problem.constraints && (
                        <>
                            <h4 style={{ color: '#ef4444', marginBottom: '4px' }}>Constraints</h4>
                            <pre style={{ background: '#222', padding: '8px', borderRadius: '4px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{renderDataSafely(problem.constraints)}</pre>
                        </>
                    )}

                    {problem.sampleInput && (
                        <>
                            <h4 style={{ color: '#10b981', marginBottom: '4px' }}>Sample Input</h4>
                            <pre style={{ background: '#222', padding: '8px', borderRadius: '4px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{renderDataSafely(problem.sampleInput)}</pre>
                        </>
                    )}

                    {problem.sampleOutput && (
                        <>
                            <h4 style={{ color: '#10b981', marginBottom: '4px' }}>Sample Output</h4>
                            <pre style={{ background: '#222', padding: '8px', borderRadius: '4px', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>{renderDataSafely(problem.sampleOutput)}</pre>
                        </>
                    )}
                </div>
            </div>

            {/* Resizer bar */}
            <div onMouseDown={startHorizontalResize} style={{ width: '6px', background: '#262626', cursor: 'col-resize' }} />

            {/* Right Panel - Code Editor Environment */}
            <div ref={rightPanelRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: '#1e1e1e' }}>
                <div style={{ padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid #2d2d2d' }}>
                    <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', fontSize: '13px' }}
                    >
                        <option value="cpp">C++</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                    </select>
                    
                    <button onClick={handleCustomRun} disabled={actionLoading} style={{ padding: '6px 14px', borderRadius: '4px', background: '#3c3c3c', color: '#fff', border: '1px solid #555', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                        Run Code
                    </button>

                    <button onClick={() => handleAutomatedEvaluation('submit')} disabled={actionLoading} style={{ padding: '6px 16px', borderRadius: '4px', background: actionLoading ? '#555' : '#22c55e', color: '#fff', border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        SUBMIT
                    </button>

                    <button onClick={handleAiReview} disabled={isAiLoading} style={{ padding: '6px 14px', borderRadius: '4px', background: isAiLoading ? '#555' : '#3b82f6', color: '#fff', border: 'none', cursor: isAiLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginLeft: 'auto', fontSize: '13px' }}>
                        ✨ AI REVIEW
                    </button>
                </div>

                <div style={{ height: `${editorHeight}%`, width: '100%', overflow: 'hidden' }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={language}
                        value={editorValue}
                        onMount={handleEditorDidMount}
                        onChange={(value) => setEditorValue(value || '')}
                        options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
                    />
                </div>

                <div onMouseDown={startVerticalResize} style={{ height: '6px', background: '#262626', cursor: 'row-resize' }} />

                {/* Console Outputs */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#121212', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', background: '#1a1a1a', borderBottom: '1px solid #2d2d2d' }}>
                        <button onClick={() => setConsoleMode('custom')} style={{ padding: '8px 16px', background: consoleMode === 'custom' ? '#121212' : 'transparent', color: consoleMode === 'custom' ? '#22c55e' : '#aaa', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                            Custom Testcases
                        </button>
                        <button onClick={() => setConsoleMode('testcases')} style={{ padding: '8px 16px', background: consoleMode === 'testcases' ? '#121212' : 'transparent', color: consoleMode === 'testcases' ? '#22c55e' : '#aaa', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                            Test Run Records
                        </button>
                    </div>

                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                        {consoleMode === 'custom' ? (
                            <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)} style={{ flex: 1, background: '#1e1e1e', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '10px', fontFamily: 'monospace', resize: 'none' }} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ flex: 1, background: '#090909', color: customError ? '#f87171' : '#e2e8f0', border: '1px solid #333', borderRadius: '4px', padding: '10px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                        {customOutput}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '10px', color: '#f1f5f9' }}>{verdictMessage}</div>
                                {executionResults && executionResults.map((res, i) => (
                                    <div key={res.id} style={{ background: '#1e1e1e', border: `1px solid ${res.passed ? '#10b981' : '#ef4444'}`, borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: 'bold', color: res.passed ? '#10b981' : '#ef4444' }}>Case #{i + 1} ({res.passed ? 'Passed' : 'Failed'})</span>
                                        </div>
                                        {!res.isHidden && (
                                            <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                                                <div><span style={{ color: '#888' }}>In:</span> {res.input}</div>
                                                <div><span style={{ color: '#10b981' }}>Expected:</span> {res.expectedOutput}</div>
                                                <div><span style={{ color: res.passed ? '#10b981' : '#ef4444' }}>Actual:</span> {res.actualOutput}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Drawer */}
            {isDrawerOpen && <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.5)', zIndex: 999 }} />}
            <div style={{ position: 'fixed', top: 0, right: isDrawerOpen ? 0 : '-500px', width: '100%', maxWidth: '480px', height: '100vh', background: '#181818', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)', zIndex: 1000, transition: 'right 0.3s', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#3b82f6' }}>✨ AI Review Context</h2>
                    <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '24px' }}>&times;</button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, whiteSpace: 'pre-wrap', color: '#e0e0e0' }}>
                    {isAiLoading ? <p style={{ color: '#aaa' }}>Analyzing Codebase...</p> : <div>{aiReviewData}</div>}
                </div>
            </div>

        </div>
    );
}