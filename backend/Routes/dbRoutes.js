const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const problemsController = require('../Controllers/dbController');

// ==========================================
// PROBLEM CRUD ROUTES
// ==========================================
// Changed from PUT to POST to match semantic standards for creating resources
router.post('/insert-problem', protect, problemsController.insertProblem);
router.get('/get-problems', problemsController.getProblems);
router.get('/get-problem/:code', problemsController.getProblem);
router.put('/update-problem/:code', protect, problemsController.updateProblem);
router.delete('/delete-problem/:code', protect, problemsController.deleteProblem);

// ==========================================
// TESTCASE ROUTES
// ==========================================
router.post('/insert-testcases/:code', protect, problemsController.insertTestCases);
router.get('/get-testcases/:code', problemsController.getTestCases);
router.put('/update-testcase/:id', protect, problemsController.updateTestCase);
router.delete('/delete-testcase/:id', protect, problemsController.deleteTestCase);
router.delete('/delete-testcases/problem/:code', protect, problemsController.deleteTestCasesByProblem);

// ==========================================
// SOLUTIONS & SUBMISSIONS ROUTES (NEW)
// ==========================================
router.post('/save-submission', protect, problemsController.saveSubmission);
router.get('/get-submissions', protect, problemsController.getSubmissions);

module.exports = router;