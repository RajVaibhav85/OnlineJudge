import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL;
const COMPILER_API = BACKEND_URL + '/api/compiler';
const AI_API = BACKEND_URL + '/api/ai';

const boilerplates = {
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
    python: `# Write your code here\nprint("Hello World")`,
    javascript: `// Write your code here\nconsole.log("Hello World");`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}`
};

export default function Coder() {
    const { username, code: problemCode } = useParams();
    const navigate = useNavigate();

    const [problem, setProblem] = useState(null);
    const [fetchingProblem, setFetchingProblem] = useState(true);

    const [code, setCode] = useState(boilerplates.cpp);
    const [language, setLanguage] = useState('cpp');
    const [input, setInput] = useState(''); 
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [aiReviewData, setAiReviewData] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    const renderDataSafely = (dataBlock) => {
        if (!dataBlock) return '';
        return typeof dataBlock === 'string' ? dataBlock : JSON.stringify(dataBlock, null, 2);
    };

    useEffect(() => {
        let isMounted = true;
        setFetchingProblem(true);

        fetch(`${BACKEND_URL}/api/db/get-problem/${problemCode}`)
            .then(res => {
                if (!res.ok) throw new Error('Problem lookup failed');
                return res.json();
            })
            .then(data => {
                if (!isMounted) return;
                setProblem(data);
                
                if (data && data.sampleInput) {
                    setInput(typeof data.sampleInput === 'string' ? data.sampleInput : JSON.stringify(data.sampleInput));
                }
                setFetchingProblem(false);
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                if (isMounted) setFetchingProblem(false);
            });

        return () => { isMounted = false; };
    }, [problemCode]);

    useEffect(() => {
        if (language && boilerplates[language]) {
            setCode(boilerplates[language]);
        }
    }, [language]);

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setIsLoading(true);
        setIsError(false);
        setOutput('Compiling and running...');

        try {
            const response = await fetch(`${COMPILER_API}/run`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language, code, input }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setIsError(false);
                setOutput(data.output || "Execution completed without text response output.");
            } else {
                setIsError(true);
                setOutput(data.error || "An execution error occurred.");
            }
        } catch (error) {
            setIsError(true);
            setOutput("Network Error connecting code compiler service.");
        } finally {
            setIsLoading(false);
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
                body: JSON.stringify({ 
                    code, 
                    language, 
                    description: problem ? problem.statement : '', 
                    input 
                }),
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

    if (fetchingProblem) {
        return <div style={{ background: '#1e1e1e', height: '100vh', color: '#aaa', padding: '40px' }}>Loading Challenge Context...</div>;
    }

    if (!problem) {
        return (
            <div style={{ background: '#1e1e1e', height: '100vh', color: '#f87171', padding: '40px' }}>
                <h3>Problem context configuration missing!</h3>
                <button onClick={() => navigate(`/${username || ''}`)} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#1e1e1e', color: '#fff', fontFamily: 'sans-serif', overflow: 'hidden' }}>
            
            <div style={{ width: '40%', borderRight: '2px solid #333', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', background: '#151515' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => navigate(`/${username || ''}`)} style={{ background: 'none', border: '1px solid #555', color: '#aaa', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        ← Dashboard
                    </button>
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

            <div style={{ width: '60%', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box', overflowY: 'auto' }}>
                <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer' }}
                    >
                        <option value="cpp">C++</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                    </select>
                    
                    <button onClick={handleSubmit} disabled={isLoading} style={{ padding: '8px 16px', borderRadius: '4px', background: isLoading ? '#555' : '#22c55e', color: '#fff', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                        {isLoading ? 'RUNNING...' : 'SUBMIT'}
                    </button>

                    <button onClick={handleAiReview} disabled={isAiLoading} style={{ padding: '8px 16px', borderRadius: '4px', background: isAiLoading ? '#555' : '#3b82f6', color: '#fff', border: 'none', cursor: isAiLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}>
                        {isAiLoading ? 'ANALYZING...' : '✨ AI REVIEW'}
                    </button>
                </div>

                <div style={{ border: '1px solid #444', borderRadius: '4px', overflow: 'hidden', flex: 1, minHeight: '350px' }}>
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={language}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', minHeight: '150px' }}>
                    <div style={{ flex: '1' }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>Custom Input:</h4>
                        <textarea value={input} onChange={(e) => setInput(e.target.value || '')} style={{ width: '100%', height: '100px', background: '#2d2d2d', color: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #3a3a3a', fontFamily: 'monospace', resize: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: '1' }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>Output Terminal:</h4>
                        <div style={{ height: '100px', background: '#000', color: isError ? '#f87171' : (isLoading ? '#9ca3af' : '#a7f3d0'), padding: '12px', borderRadius: '4px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflowY: 'auto', border: isError ? '1px solid #ef4444' : '1px solid #3a3a3a', boxSizing: 'border-box' }}>
                            {output}
                        </div>
                    </div>
                </div>
            </div>

            {isDrawerOpen && <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.5)', zIndex: 999 }} />}
            <div style={{ position: 'fixed', top: 0, right: isDrawerOpen ? 0 : '-500px', width: '100%', maxWidth: '480px', height: '100vh', background: '#181818', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)', zIndex: 1000, transition: 'right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333', background: '#222' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#3b82f6' }}>✨ AI Review Context</h2>
                    <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap', color: '#e0e0e0' }}>
                    {isAiLoading ? <p style={{ color: '#aaa', fontStyle: 'italic' }}>Analyzing Codebase...</p> : <div>{aiReviewData}</div>}
                </div>
            </div>

        </div>
    );
}