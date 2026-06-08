const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const dbController = require('../Controllers/dbController')


// router.put('/insert-problem', protect, dbController.insertProblem);
router.put('/insert-problem', dbController.insertProblem);
router.get('/get-problems', dbController.getProblems);
router.get('/get-problem/:code', dbController.getProblem);
router.put('/update-problem/:code', dbController.updateProblem);
router.delete('/delete-problem/:code', dbController.deleteProblem);
router.post('/insert-testcases/:code', dbController.insertTestCases);
router.get('/get-testcases/:code', dbController.getTestCases);

module.exports = router;