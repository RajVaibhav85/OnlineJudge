const fs = require('fs')
const path = require('path')
const {v4: uuid} = require('uuid')
const dirCodes = path.join(__dirname, '..', 'codes');
const dirOutputs = path.join(__dirname, '..', 'outputs');
const { exec } = require('child_process');

const runCpp = (filepath) => {
    return new Promise((resolve, reject) => {
        const filename = path.basename(filepath).split('.')[0];
        const outputFile = path.join(dirOutputs, `${filename}.out`);
        const command = `g++ ${filepath} -o ${outputFile} && cd ${dirOutputs} && ./${filename}.out`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject({error, stderr});
            }
            else if(stderr) {
                reject({stderr});
            }
            else {
                resolve(stdout);
            }
        });
    })
}


const runCode = async (req, res, next) => {
    const { language, code } = req.body;
    try{

        if(!fs.existsSync(dirCodes)) {
            fs.mkdirSync(dirCodes);
        }
        if(!fs.existsSync(dirOutputs)) {
            fs.mkdirSync(dirOutputs);
        }
        let output = "";
        const filepath = generateFile(language, code);
        if(language === 'cpp') {
            output = await runCpp(filepath);
        }
        if(language === 'python') {
            output = await runPython(filepath);
        }
        if(language === 'javascript') {
            output = await runJs(filepath);
        }

        fs.unlinkSync(filepath);
        return res.status(200).json({ output });

    }catch(err){
        console.error(err);
        return res.status(500).json({ message: 'Error running code' });
    }
}

const generateFile = (language = 'cpp', code) => {
    const extension = language === 'cpp' ? 'cpp' : language === 'python' ? 'py' : 'js';
    const filename = `${uuid()}.${extension}`;
    const filepath = path.join(dirCodes, filename);
    fs.writeFileSync(filepath, code);
    return filepath;
}

module.exports = {
    runCode
}
