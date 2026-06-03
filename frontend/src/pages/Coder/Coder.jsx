import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
// import ReactMarkdown from 'react-markdown'; // Optional but highly recommended for formatting!

const API = import.meta.env.VITE_SERVER_URL + '/api/compiler';
const AI_API = import.meta.env.VITE_SERVER_URL + '/api/ai'; // Added AI Base URL

const boilerplates = {
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << "Your input was: " << x << endl;\n    return 0;\n}`,
    python: `x = input()\nprint(f"Your input was: {x}")`,
    javascript: `// JS usually handles standard input differently depending on the environment\nconsole.log("Hello World!");`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n      Scanner sc = new Scanner(System.in);\n      // adjust based on your standard setup\n    }\n}`
};

export default function Coder() {
    const [code, setCode] = useState(boilerplates.cpp);
    const [language, setLanguage] = useState('cpp');
    const [input, setInput] = useState(''); 
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

    // AI Review States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [aiReviewData, setAiReviewData] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Problem Description State (Optional: user can fill this out or leave it empty)
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (boilerplates[language]) {
            setCode(boilerplates[language]);
        }
    }, [language]);

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setIsLoading(true);
        setIsError(false);
        setOutput('Compiling and running...');

        try {
            const payload = { language, code, input };
            
            const response = await fetch(`${API}/run`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                setIsError(false);
                setOutput(data.output || "Code executed successfully with no output.");
            } else {
                setIsError(true);
                setOutput(data.error || "An unknown error occurred.");
            }
        } catch (error) {
            console.error("Network or Client Error:", error);
            setIsError(true);
            setOutput("Network Error: Could not reach the code execution server.");
        } finally {
            setIsLoading(false);
        }
    };

    // New function to fetch AI Review and slide open drawer
    const handleAiReview = async () => {
        setIsDrawerOpen(true); // Open the drawer immediately to show loading state
        setIsAiLoading(true);
        setAiReviewData('Analyzing code architecture, complexities, and edge cases...');

        try {
            const payload = { code, language, description, input };

            const response = await fetch(`${AI_API}/ai-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                setAiReviewData(data.review || "No review content returned.");
            } else {
                setAiReviewData(`### Error\n${data.error || "Could not retrieve AI review at this time."}`);
            }
        } catch (error) {
            console.error("AI Fetch Error:", error);
            setAiReviewData("### Network Error\nFailed to reach the AI review system.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#1e1e1e', color: '#fff', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
            
            {/* Control Bar */}
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
                
                <button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    style={{ 
                        padding: '8px 16px', 
                        borderRadius: '4px', 
                        background: isLoading ? '#555' : '#22c55e', 
                        color: '#fff', 
                        border: 'none', 
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {isLoading ? 'RUNNING...' : 'SUBMIT'}
                </button>

                {/* AI Review Trigger Button */}
                <button 
                    onClick={handleAiReview}
                    disabled={isAiLoading}
                    style={{ 
                        padding: '8px 16px', 
                        borderRadius: '4px', 
                        background: isAiLoading ? '#555' : '#3b82f6', 
                        color: '#fff', 
                        border: 'none', 
                        cursor: isAiLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        marginLeft: 'auto' // Pushes the AI button to the far right
                    }}
                >
                    {isAiLoading ? 'ANALYZING...' : '✨ AI REVIEW'}
                </button>
            </div>

            {/* Monaco Editor Container */}
            <div style={{ border: '1px solid #444', borderRadius: '4px', overflow: 'hidden' }}>
                <Editor
                    height="55vh"
                    theme="vs-dark"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        automaticLayout: true
                    }}
                />
            </div>

            {/* Split Section for Input and Output */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                
                {/* Custom Input Area */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <h3>Custom Input:</h3>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type standard input here..."
                        style={{
                            width: '100%',
                            height: '15vh',
                            background: '#2d2d2d',
                            color: '#fff',
                            padding: '12px',
                            borderRadius: '4px',
                            border: '0.5px solid #3a3a3a',
                            fontFamily: 'monospace',
                            resize: 'none',
                            boxSizing: 'border-box',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Output Display Console */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                    <h3>Output Terminal:</h3>
                    <div 
                        className="output-box" 
                        style={{ 
                            height: '15vh', 
                            background: '#000', 
                            color: isError ? '#f87171' : (isLoading ? '#9ca3af' : '#a7f3d0'), 
                            padding: '12px', 
                            borderRadius: '4px', 
                            fontFamily: 'monospace', 
                            whiteSpace: 'pre-wrap',
                            overflowY: 'auto',
                            boxSizing: 'border-box',
                            border: isError ? '1px solid #ef4444' : '0.5px solid #3a3a3a'
                        }}
                    >
                        {output}
                    </div>
                </div>
            </div>

            {/* Optional: Simple Problem Description field to pass along additional context */}
            <div style={{ marginTop: '15px' }}>
                <label style={{ fontSize: '14px', color: '#aaa', display: 'block', marginBottom: '5px' }}>
                    Optional: Paste problem description or constraints here to sharpen AI accuracy:
                </label>
                <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Find target element in rotated sorted array in O(log n) time."
                    style={{ width: '100%', padding: '8px', background: '#2d2d2d', border: '1px solid #444', borderRadius: '4px', color: '#fff', boxSizing: 'border-box' }}
                />
            </div>

            {/* --- SLIDING AI DRAWER OVERLAY --- */}
            {isDrawerOpen && (
                <div 
                    onClick={() => setIsDrawerOpen(false)} // Clicking backdrop closes the drawer
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0, 0, 0, 0.5)', zIndex: 999, transition: 'all 0.3s ease-in-out'
                    }}
                />
            )}

            <div 
                style={{
                    position: 'fixed', top: 0, right: isDrawerOpen ? 0 : '-500px',
                    width: '100%', maxWidth: '480px', height: '100vh', background: '#181818',
                    boxShadow: '-5px 0 25px rgba(0,0,0,0.5)', zIndex: 1000,
                    transition: 'right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
                }}
            >
                {/* Drawer Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333', background: '#222' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✨ DSA AI Review
                    </h2>
                    <button 
                        onClick={() => setIsDrawerOpen(false)}
                        style={{ background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer', lineHeight: '1' }}
                    >
                        &times;
                    </button>
                </div>

                {/* Drawer Content Body */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap', color: '#e0e0e0' }}>
                    {isAiLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '15px' }}>
                            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #333', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            <p style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>{aiReviewData}</p>
                        </div>
                    ) : (
                        // If using react-markdown, replace line below with: <ReactMarkdown>{aiReviewData}</ReactMarkdown>
                        <div>{aiReviewData}</div>
                    )}
                </div>
            </div>
        </div>
    );
}