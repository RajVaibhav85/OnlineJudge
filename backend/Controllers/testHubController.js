const TestHub = require('../Models/TestHub');
const Solution = require('../Models/Solutions');

// 1. START A MOCK EXAMINATION SESSION
const createTestHubSession = async (req, res, next) => {
    try {
        const { problemIds, durationSeconds } = req.body;
        const userId = req.user.id;

        if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
            return res.status(400).json({ success: false, message: "An array of problem IDs is required to start a test session." });
        }

        // Build the active examination workspace row
        const newSession = await TestHub.create({
            user: userId,
            problems: problemIds,
            durationSeconds: durationSeconds || 7200, // Default to 2 hours if omitted
            solutions: [],
            status: 'Active'
        });

        return res.status(201).json({
            success: true,
            message: "Mock examination session initialized successfully.",
            data: newSession
        });
    } catch (error) {
        next(error);
    }
};

// 2. CLOSE OR DESTRUCTIVELY TERMINATE AN EXAMINATION SESSION
const closeTestHubSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // Expects 'Complete' or 'Terminate'

        const session = await TestHub.findOne({ _id: id, user: req.user.id });
        if (!session) {
            return res.status(404).json({ success: false, message: "Active test session context missing." });
        }

        if (action === 'Terminate') {
            // Use custom model method to cascade drop intermediate workspace code run records from DB completely
            await session.terminateSession();
            
            return res.status(200).json({
                success: true,
                message: "Examination session cancelled. Associated solution telemetry data purged cleanly."
            });
        }

        // Standard submission finish processing path
        session.status = 'Completed';
        session.endedAt = new Date();
        
        // Calculate dynamic verdicts based on whether any saved user solutions failed to hit 'Accepted'
        const solutionsFound = await Solution.find({ testHub: session._id });
        const allPassed = solutionsFound.length >= session.problems.length && 
                          solutionsFound.every(s => s.verdict === 'Accepted');

        session.finalVerdict = allPassed ? 'Passed' : 'Failed';
        await session.save();

        return res.status(200).json({
            success: true,
            message: "Examination session completed and evaluated successfully.",
            data: session
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTestHubSession,
    closeTestHubSession
};