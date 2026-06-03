const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const dbController = require('../Controllers/dbController')


// router.put('/insert-problem', protect, dbController.insertProblem);
router.put('/insert-problem', dbController.insertProblem);

module.exports = router;