const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')
const dirCodes = path.join(__dirname, '..', 'codes');
const dirOutputs = path.join(__dirname, '..', 'outputs');
const { exec } = require('child_process');


const deleteFileSafe = (filepath) => {
    if (filepath && fs.existsSync(filepath)) {
        try {
            fs.unlinkSync(filepath);
        } catch (e) {
            console.error(`Failed to delete file: ${filepath}`, e);
        }
    }
};


const runCpp = (filepath) => {
    return new Promise((resolve, reject) => {
        const filename = path.basename(filepath).split('.')[0];
        const outputFile = path.join(dirOutputs, `${filename}.out`);
        const command = `g++ ${filepath} -o ${outputFile} && cd ${dirOutputs} && ./${filename}.out`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({ msg: stderr || error.message, outputFile });
            } else {
                resolve({ stdout, outputFile });
            }
        });
    });
};

const runPython = (filepath) => {
    return new Promise((resolve, reject) => {
        const command = `python3 ${filepath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({ msg: stderr || error.message });
            } else {
                resolve({ stdout: stdout || stderr });
            }
        });
    });
};

const runJs = (filepath) => {
    return new Promise((resolve, reject) => {
        const command = `node ${filepath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) reject({ msg: stderr || error.message });
            else resolve({ stdout: stdout || stderr });
        });
    });
};

const runJava = (filepath) => {
    return new Promise((resolve, reject) => {
        const command = `java ${filepath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) reject({ msg: stderr || error.message });
            else resolve({ stdout: stdout || stderr });
        });
    });
};



const runCode = async (req, res, next) => {
    const { language, code } = req.body;
    let filepath = "";
    let outputFileToDelete = "";

    try {
        if (!fs.existsSync(dirCodes)) fs.mkdirSync(dirCodes);
        if (!fs.existsSync(dirOutputs)) fs.mkdirSync(dirOutputs);
        
        filepath = generateFile(language, code);
        let result = null;

        if (language === 'cpp') {
            result = await runCpp(filepath);
            outputFileToDelete = result.outputFile;
        } else if (language === 'python') {
            result = await runPython(filepath);
        } else if (language === 'javascript') {
            result = await runJs(filepath);
        } else if (language === 'java') {
            result = await runJava(filepath);
        } else {
            throw new Error(`Unsupported language: ${language}`);
        }

        deleteFileSafe(filepath);
        deleteFileSafe(outputFileToDelete);
        
        return res.status(200).json({ success: true, output: result.stdout });

    } catch (err) {
        deleteFileSafe(filepath);
        if (err.outputFile) {
            deleteFileSafe(err.outputFile);
        } else {
            deleteFileSafe(outputFileToDelete);
        }
        
        const errorMessage = err.msg || (typeof err === 'string' ? err : (err.message || 'Error running code'));
        console.error("Execution Error:", errorMessage);

        return res.status(400).json({ 
            success: false, 
            error: errorMessage
        });
    }
}

const generateFile = (language = 'cpp', code) => {
    const extensions = {
        cpp: 'cpp',
        python: 'py',
        javascript: 'js',
        java: 'java'
    };
    
    const extension = extensions[language] || 'txt';
    const filename = `${uuid()}.${extension}`;
    const filepath = path.join(dirCodes, filename);
    fs.writeFileSync(filepath, code);
    return filepath;
}

module.exports = {
    runCode
}