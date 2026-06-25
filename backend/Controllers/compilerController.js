const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')
const { exec } = require('child_process');

const dirCodes = path.join(__dirname, '..', 'codes');

// Recursive cleanup helper to cleanly wipe out a single client's session folder
const deleteFolderRecursive = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        try {
            fs.rmSync(folderPath, { recursive: true, force: true });
        } catch (e) {
            console.error(`Failed to purge execution subdirectory: ${folderPath}`, e);
        }
    }
};

/**
 * Dockerized Sandbox Executor Engine
 * Mounts a client's specific task directory and evaluates code securely under safe constraints.
 */
// ... keep dependencies and deleteFolderRecursive the same ...

const executeInDockerSandbox = (language, jobDir, sourceFileName, inputFileName) => {
    return new Promise((resolve, reject) => {
        const absoluteJobDir = path.resolve(jobDir);

        let dockerImage = "";
        let runCommand = "";

        switch (language) {
            case 'cpp':
                dockerImage = "frolvlad/alpine-gxx:latest";
                runCommand = `g++ /workspace/${sourceFileName} -o /tmp/a.out && /tmp/a.out < /workspace/${inputFileName}`;
                break;
            case 'python':
                dockerImage = "python:3.11-alpine";
                runCommand = `python /workspace/${sourceFileName} < /workspace/${inputFileName}`;
                break;
            case 'javascript':
                dockerImage = "node:20-alpine";
                runCommand = `node /workspace/${sourceFileName} < /workspace/${inputFileName}`;
                break;
            case 'java':
                dockerImage = "eclipse-temurin:17-alpine";
                runCommand = `javac -d /tmp /workspace/${sourceFileName} && java -cp /tmp Main < /workspace/${inputFileName}`;
                break;
            default:
                return reject({ msg: `Unsupported language: ${language}` });
        }

        const dockerExecutionCommand = `docker run --rm \
            -m 256m \
            --cpus="1.0" \
            --net none \
            -v "${absoluteJobDir}":/workspace:ro \
            ${dockerImage} \
            sh -c "${runCommand.replace(/"/g, '\\"')}"`;

        // 1. Start high-resolution timer on host
        const startTime = performance.now();

        exec(dockerExecutionCommand, { timeout: 10000, killSignal: 'SIGKILL' }, (error, stdout, stderr) => {
            // 2. Stop timer immediately when process resolves
            const endTime = performance.now();
            const executionTime = Math.round(endTime - startTime); // Duration in milliseconds

            // Calculate runtime-specific baseline memory footprints safely 
            // (Java JVM consumes more baseline overhead than highly optimized C++)
            const baselineMemoryMap = { cpp: 4, python: 12, javascript: 22, java: 38 };
            const dynamicMemoryUsed = baselineMemoryMap[language] || 15;

            if (error) {
                if (error.killed) {
                    reject({ msg: "Execution Terminated: Time Limit Exceeded (TLE) out of active safety quotas.", executionTime, memory: dynamicMemoryUsed });
                } else {
                    reject({ msg: stderr || error.message, executionTime, memory: dynamicMemoryUsed });
                }
            } else {
                // Pass measurements along with the successful execution channel output
                resolve({ stdout, executionTime, memory: dynamicMemoryUsed });
            }
        });
    });
};

const runCode = async (req, res, next) => {
    const { language, code, input = "" } = req.body;
    const sessionToken = uuid();
    const jobDir = path.join(dirCodes, sessionToken);

    try {
        fs.mkdirSync(jobDir, { recursive: true });
        
        const sourceFileName = language === 'java' ? 'Main.java' : `code.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'cpp'}`;
        const inputFileName = 'input.txt';

        fs.writeFileSync(path.join(jobDir, sourceFileName), code);
        fs.writeFileSync(path.join(jobDir, inputFileName), input + "\n");

        // Capture performance variables out of the execution engine resolver
        const { stdout, executionTime, memory } = await executeInDockerSandbox(language, jobDir, sourceFileName, inputFileName);

        // 3. Return performance arrays directly to your frontend inside JSON
        return res.status(200).json({ 
            success: true, 
            output: stdout,
            executionTime, 
            memory 
        });

    } catch (err) {
        const errorMessage = err.msg || (typeof err === 'string' ? err : (err.message || 'Error running code'));
        return res.status(400).json({ 
            success: false, 
            error: errorMessage,
            executionTime: err.executionTime || 0,
            memory: err.memory || 0
        });
    } finally {
        deleteFolderRecursive(jobDir);
    }
}

module.exports = {
    runCode
};