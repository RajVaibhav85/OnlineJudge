const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const testHubController = require('../Controllers/testHubController');

// Initialize a new mock test workspace environment
router.post('/session/start', protect, testHubController.createTestHubSession);

// Close or abort/terminate an active test workspace environment
// Expects JSON body: { "action": "Complete" } OR { "action": "Terminate" }
router.post('/session/:id/close', protect, testHubController.closeTestHubSession);

module.exports = router;