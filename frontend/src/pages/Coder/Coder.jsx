import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL;
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
    const editorRef = useRef(null); // Added to keep track of the Monaco instance

    const [problem, setProblem] = useState(null);
    const [testCases, setTestCases] = useState([]);
    const [fetchingData, setFetchingData] = useState(true);

    const [language, setLanguage] = useState('cpp');
    
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

    const renderDataSafely = (dataBlock) => {
        if (!dataBlock) return '';
        return typeof dataBlock === 'string' ? dataBlock : JSON.stringify(dataBlock, null, 2);
    };

    // Helper to get current code from Monaco safely
    const getEditorCode = () => {
        if (editorRef.current) {
            return editorRef.current.getValue();
        }
        return boilerplates[language];
    };

    // Native Horizontal Dragger Handler
    const startHorizontalResize = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftPanelWidth;
        const totalWidth = containerRef.current.offsetWidth;

        const doHorizontalResize = (moveEvent) => {
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

    // Native Vertical Dragger Handler
    const startVerticalResize = (e) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = editorHeight;
        const totalHeight = rightPanelRef.current.offsetHeight;

        const doVerticalResize = (moveEvent) => {
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

    useEffect(() => {
        let isMounted = true;
        setFetchingData(true);

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

    // Handle language shifts cleanly without resetting cursor position mid-type
    useEffect(() => {
        if (language && boilerplates[language] && editorRef.current) {
            editorRef.current.setValue(boilerplates[language]);
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
                body: JSON.stringify({ language, code: getEditorCode(), input: customInput }),
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
            const currentCode = getEditorCode();
            const evaluationPipeline = targetScopeCases.map(async (tc, index) => {
                try {
                    const response = await fetch(`${COMPILER_API}/run`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ language, code: currentCode, input: tc.input }),
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
            if (errorsFound) {
                setVerdictMessage(evaluationScope === 'submit' ? '❌ Wrong Answer / Execution Exception' : '❌ Failed Public Test Cases');
            } else {
                setVerdictMessage(evaluationScope === 'submit' ? '🟢 Accepted / All Metrics Verified' : '🟢 Tests Passed (Public Scope Only)');
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
                body: JSON.stringify({ code: getEditorCode(), language, description: problem ? problem.statement : '' }),
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

    const visibleTestCases = testCases.filter(tc => !tc.isHidden);

    return (
        <div 
            ref={containerRef}
            style={{ display: 'flex', height: '100vh', width: '100vw', background: '#121212', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}
        >
            {/* PANEL 1: PROBLEM CONTEXT DETAILS VIEW */}
            <div style={{ width: `${leftPanelWidth}%`, background: '#1a1a1a', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #2d2d2d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#151515' }}>
                    <button onClick={() => navigate(`/${username || ''}`)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        ← Dashboard
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#2a2a2a', padding: '4px 8px', borderRadius: '4px', color: problem.difficulty === 'Easy' ? '#10b981' : problem.difficulty === 'Hard' ? '#ef4444' : '#f59e0b' }}>
                        {problem.difficulty || 'Medium'}
                    </span>
                </div>
                
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, lineHeight: '1.6', fontSize: '14px' }}>
                    <h1 style={{ margin: '0 0 12px 0', fontSize: '22px', letterSpacing: '-0.5px' }}>{problem.name || 'Untitled Challenge'}</h1>
                    <p style={{ color: '#e0e0e0', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{problem.statement}</p>
                    
                    {problem.description && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ color: '#3b82f6', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase' }}>Context details</h4>
                            <p style={{ fontSize: '13px', color: '#aaa', margin: 0 }}>{problem.description}</p>
                        </div>
                    )}

                    {problem.constraints && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ color: '#ef4444', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase' }}>Constraints</h4>
                            <pre style={{ background: '#242424', padding: '10px', borderRadius: '6px', border: '1px solid #2d2d2d', fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap', color: '#fca5a5' }}>{renderDataSafely(problem.constraints)}</pre>
                        </div>
                    )}

                    <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #2d2d2d' }}>
                        <h3 style={{ fontSize: '15px', color: '#9ca3af', marginBottom: '12px' }}>Public Test Cases ({visibleTestCases.length})</h3>
                        {visibleTestCases.map((tc, idx) => (
                            <div key={tc._id || idx} style={{ background: '#222', borderRadius: '6px', padding: '12px', marginBottom: '12px', border: '1px solid #2d2d2d' }}>
                                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold', marginBottom: '6px' }}>SAMPLE CASE #{idx + 1}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <span style={{ fontSize: '11px', color: '#10b981' }}>Input</span>
                                        <pre style={{ background: '#151515', padding: '6px', borderRadius: '4px', margin: '2px 0 0 0', fontSize: '12px', overflowX: 'auto' }}>{tc.input}</pre>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: '#3b82f6' }}>Expected Output</span>
                                        <pre style={{ background: '#151515', padding: '6px', borderRadius: '4px', margin: '2px 0 0 0', fontSize: '12px', overflowX: 'auto' }}>{tc.output}</pre>
                                    </div>
                                </div>
                                {tc.explanation && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>Note: {tc.explanation}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* HORIZONTAL RESIZE HANDLE BAR */}
            <div 
                onMouseDown={startHorizontalResize}
                style={{ width: '6px', background: '#121212', cursor: 'col-resize', zIndex: 10, transition: 'background 0.2s' }} 
                title="Drag to adjust column layout split"
            />

            {/* DEVELOPMENT SECTION CONTAINER */}
            <div 
                ref={rightPanelRef}
                style={{ width: `${100 - leftPanelWidth}%`, display: 'flex', flexDirection: 'column', background: '#1e1e1e', height: '100%' }}
            >
                {/* PANEL 2: COMPILER ENVIRONMENT & CONTROL RENDERERS */}
                <div style={{ height: `${editorHeight}%`, display: 'flex', flexDirection: 'column', background: '#1e1e1e', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 15px', display: 'flex', gap: '10px', alignItems: 'center', background: '#151515', borderBottom: '1px solid #2d2d2d' }}>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{ padding: '6px 12px', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444', cursor: 'pointer', fontSize: '13px' }}
                        >
                            <option value="cpp">C++</option>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                        
                        <button onClick={handleCustomRun} disabled={actionLoading} style={{ padding: '6px 14px', borderRadius: '4px', background: '#2a2a2a', color: '#e0e0e0', border: '1px solid #444', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                            RUN CUSTOM
                        </button>

                        <button onClick={() => handleAutomatedEvaluation('run')} disabled={actionLoading} style={{ padding: '6px 14px', borderRadius: '4px', background: '#2563eb', color: '#fff', border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                            RUN TESTS
                        </button>

                        <button onClick={() => handleAutomatedEvaluation('submit')} disabled={actionLoading} style={{ padding: '6px 16px', borderRadius: '4px', background: '#16a34a', color: '#fff', border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                            SUBMIT
                        </button>

                        <button onClick={handleAiReview} disabled={isAiLoading} style={{ padding: '6px 12px', borderRadius: '4px', background: '#4f46e5', color: '#fff', border: 'none', cursor: isAiLoading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold', marginLeft: 'auto' }}>
                            {isAiLoading ? 'ANALYZING...' : '✨ AI REVIEW'}
                        </button>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={language}
                            defaultValue={boilerplates[language]}
                            onMount={handleEditorDidMount}
                            options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, padding: { top: 10 } }}
                        />
                    </div>
                </div>

                {/* VERTICAL RESIZE HANDLE BAR */}
                <div 
                    onMouseDown={startVerticalResize}
                    style={{ height: '6px', background: '#121212', cursor: 'row-resize', zIndex: 10 }} 
                    title="Drag to adjust console layout height"
                />

                {/* PANEL 3: USER TERMINALS & RESULTS AGGREGATORS */}
                <div style={{ height: `${100 - editorHeight}%`, background: '#181818', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', background: '#141414', borderBottom: '1px solid #2d2d2d' }}>
                        <button onClick={() => setConsoleMode('custom')} style={{ padding: '10px 20px', background: consoleMode === 'custom' ? '#181818' : 'transparent', color: consoleMode === 'custom' ? '#3b82f6' : '#888', border: 'none', borderBottom: consoleMode === 'custom' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                            Custom Playground
                        </button>
                        <button onClick={() => setConsoleMode('testcases')} style={{ padding: '10px 20px', background: consoleMode === 'testcases' ? '#181818' : 'transparent', color: consoleMode === 'testcases' ? '#3b82f6' : '#888', border: 'none', borderBottom: consoleMode === 'testcases' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                            Test Cases Matrix {executionResults && `(${executionResults.filter(r => r.passed).length}/${executionResults.length})`}
                        </button>
                    </div>

                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', boxSizing: 'border-box' }}>
                        
                        {/* TAB A: CUSTOM WORKSPACE */}
                        {consoleMode === 'custom' && (
                            <div style={{ display: 'flex', gap: '15px', height: '100%', minHeight: '100px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px', fontWeight: 'bold' }}>Input Parameters</div>
                                    <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value || '')} style={{ flex: 1, minHeight: '65px', background: '#1f1f1f', color: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #333', fontFamily: 'monospace', fontSize: '13px', resize: 'none' }} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px', fontWeight: 'bold' }}>Output Buffer Diagnostics</div>
                                    <div style={{ flex: 1, minHeight: '65px', background: '#0a0a0a', color: customError ? '#f87171' : '#a7f3d0', padding: '10px', borderRadius: '4px', border: '1px solid #2d2d2d', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', overflowY: 'auto' }}>
                                        {customOutput || 'No output captured. Run custom parameters to generate execution logs.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB B: TESTING ENVIRONMENT MATRICES */}
                        {consoleMode === 'testcases' && (
                            <div>
                                {verdictMessage && (
                                    <div style={{ padding: '10px', borderRadius: '4px', background: verdictMessage.includes('🟢') ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${verdictMessage.includes('🟢') ? '#16a34a' : '#ef4444'}`, color: verdictMessage.includes('🟢') ? '#4ade80' : '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>
                                        {verdictMessage}
                                    </div>
                                )}
                                
                                {actionLoading && !executionResults && <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px' }}>Evaluating test arrays... Please hold.</div>}

                                {executionResults && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {executionResults.map((result, idx) => (
                                            <div key={result.id} style={{ border: `1px solid ${result.passed ? '#2d2d2d' : 'rgba(239,68,68,0.4)'}`, background: result.passed ? '#1e1e1e' : 'rgba(239,68,68,0.05)', borderRadius: '6px', padding: '12px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: result.passed ? '#4ade80' : '#f87171' }}>
                                                        Case {idx + 1}: {result.passed ? '✔ PASSED' : '❌ FAILED'} {result.isHidden && <span style={{ fontSize: '10px', color: '#a78bfa', background: 'rgba(139,92,246,0.2)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>HIDDEN CRITERIA</span>}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{result.runtimeDiagnostics}</span>
                                                </div>

                                                {(!result.isHidden || !result.passed) ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
                                                        <div>
                                                            <div style={{ color: '#888' }}>Input Vector:</div>
                                                            <pre style={{ background: '#111', padding: '4px 6px', borderRadius: '4px', margin: '2px 0 0 0', overflowX: 'auto' }}>{result.input}</pre>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#888' }}>Target Output:</div>
                                                            <pre style={{ background: '#111', padding: '4px 6px', borderRadius: '4px', margin: '2px 0 0 0', overflowX: 'auto', color: '#4ade80' }}>{result.expectedOutput}</pre>
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#888' }}>Captured Out:</div>
                                                            <pre style={{ background: '#111', padding: '4px 6px', borderRadius: '4px', margin: '2px 0 0 0', overflowX: 'auto', color: result.passed ? '#4ade80' : '#f87171' }}>{result.actualOutput}</pre>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>Confidential test matrices hidden inside isolated sandbox environment.</div>
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

            {/* FLOATING ACTION SLIDE OVER: AI REVIEW MODULE */}
            {isDrawerOpen && <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.6)', zIndex: 999 }} />}
            <div style={{ position: 'fixed', top: 0, right: isDrawerOpen ? 0 : '-500px', width: '100%', maxWidth: '480px', height: '100vh', background: '#161616', boxShadow: '-10px 0 35px rgba(0,0,0,0.6)', zIndex: 1000, transition: 'right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #2d2d2d', background: '#1a1a1a' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#6366f1', fontWeight: 'bold' }}>✨ AI Diagnostic Core</h2>
                    <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap', color: '#e0e0e0', fontFamily: 'monospace' }}>
                    {isAiLoading ? <p style={{ color: '#888', fontStyle: 'italic' }}>Running architectural heuristics...</p> : <div>{aiReviewData}</div>}
                </div>
            </div>

        </div>
    );
}