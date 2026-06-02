const express = require('express');
const router = express.Router();
const compilerController = require('../Controllers/compilerController')


router.post('/run', compilerController.runCode);


module.exports = router;