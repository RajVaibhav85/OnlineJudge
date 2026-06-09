const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')
const { exec } = require('child_process');

const dirCodes = path.join(__dirname, '..', 'codes');
const dirOutputs = path.join(__dirname, '..', 'outputs');
const dirInputs = path.join(__dirname, '..', 'inputs');

const deleteFileSafe = (filepath) => {
    if (filepath && fs.existsSync(filepath)) {
        try {
            fs.unlinkSync(filepath);
        } catch (e) {
            console.error(`Failed to delete file: ${filepath}`, e);
        }
    }
};

const runCpp = (filepath, inputFilePath) => {
    return new Promise((resolve, reject) => {
        const filename = path.basename(filepath).split('.')[0];
        const outputFile = path.join(dirOutputs, `${filename}.out`);
        const command = `g++ ${filepath} -o ${outputFile} && cd ${dirOutputs} && ./${filename}.out < ${inputFilePath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({ msg: stderr || error.message, outputFile });
            } else {
                resolve({ stdout, outputFile });
            }
        });
    });
};

const runPython = (filepath, inputFilePath) => {
    return new Promise((resolve, reject) => {
        const command = `python3 ${filepath} < ${inputFilePath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) reject({ msg: stderr || error.message });
            else resolve({ stdout: stdout || stderr });
        });
    });
};

const runJs = (filepath, inputFilePath) => {
    return new Promise((resolve, reject) => {
        const command = `node ${filepath} < ${inputFilePath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) reject({ msg: stderr || error.message });
            else resolve({ stdout: stdout || stderr });
        });
    });
};

const runJava = (filepath, inputFilePath) => {
    return new Promise((resolve, reject) => {
        const command = `java ${filepath} < ${inputFilePath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) reject({ msg: stderr || error.message });
            else resolve({ stdout: stdout || stderr });
        });
    });
};

const generateFile = (type, content, targetDir) => {
    const extensions = {
        cpp: 'cpp',
        python: 'py',
        javascript: 'js',
        java: 'java',
        txt: 'txt'
    };
    const filename = `${uuid()}.${extensions[type]}`;
    const filepath = path.join(targetDir, filename);
    fs.writeFileSync(filepath, content);
    return filepath;
};

const runCode = async (req, res, next) => {
    const { language, code, input = "" } = req.body;
    let filepath = "";
    let inputFilePath = "";
    let outputFileToDelete = "";

    try {
        if (!fs.existsSync(dirCodes)) fs.mkdirSync(dirCodes);
        if (!fs.existsSync(dirOutputs)) fs.mkdirSync(dirOutputs);
        if (!fs.existsSync(dirInputs)) fs.mkdirSync(dirInputs);
        
        filepath = generateFile(language, code, dirCodes);
        inputFilePath = generateFile('txt', input, dirInputs);
        let result = null;

        if (language === 'cpp') {
            result = await runCpp(filepath, inputFilePath);
            outputFileToDelete = result.outputFile;
        } else if (language === 'python') {
            result = await runPython(filepath, inputFilePath);
        } else if (language === 'javascript') {
            result = await runJs(filepath, inputFilePath);
        } else if (language === 'java') {
            result = await runJava(filepath, inputFilePath);
        } else {
            throw new Error(`Unsupported language: ${language}`);
        }

        return res.status(200).json({ success: true, output: result.stdout });

    } catch (err) {
        if (err.outputFile) outputFileToDelete = err.outputFile;
        const errorMessage = err.msg || (typeof err === 'string' ? err : (err.message || 'Error running code'));
        return res.status(400).json({ success: false, error: errorMessage });
    } finally {
        deleteFileSafe(filepath);
        deleteFileSafe(inputFilePath);
        deleteFileSafe(outputFileToDelete);
    }
}

module.exports = {
    runCode
}