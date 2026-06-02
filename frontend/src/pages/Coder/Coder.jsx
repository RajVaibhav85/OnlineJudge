import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const API = import.meta.env.VITE_SERVER_URL + '/api/compiler';

const boilerplates = {
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World!" << endl;\n    return 0;\n}`,
    python: `print("Hello World!")`,
    javascript: `console.log("Hello World!");`,
    java: `public class Main {\n    public static void main(String[] args) {\n      System.out.println("Hello World!");\n    }\n}`
};

export default function Coder() {
    const [code, setCode] = useState(boilerplates.cpp);
    const [language, setLanguage] = useState('cpp');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);

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
            const payload = {
                language: language,
                code: code
            };
            
            const response = await fetch(`${API}/run`, { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
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

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', background: '#1e1e1e', color: '#fff', minHeight: '100vh' }}>
            {/* Control Bar */}
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid #555' }}
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
            </div>

            {/* Monaco Editor Container */}
            <div style={{ border: '1px solid #444', borderRadius: '4px', overflow: 'hidden' }}>
                <Editor
                    height="60vh"
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

            {/* Output Display Console */}
            <div style={{ marginTop: '20px' }}>
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
                        border: isError 
                        ? '1px solid #ef4444' 
                        // :(output && output !== 'Compiling and running...') 
                        // ? '1px solid #a7f3d0' 
                        : '1px solid #333'
                    }}
                >
                    {output}
                </div>
            </div>
        </div>
    );
}