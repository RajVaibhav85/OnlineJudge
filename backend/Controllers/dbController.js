const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const dbController = require('../Controllers/dbController')
const Problem = require('../Models/Problems');


const insertProblem = async (req, res) => {
    try {
        const {
            name,
            statement,
            code,
            difficulty,
            description,
            sampleInput,
            sampleOutput,
            timeLimit,
            memoryLimit,
            constraints,
            tags,
            createdBy
        } = req.body;

        if (!name || !statement || !code || !difficulty) {
            return res.status(400).json({ 
                message: "Missing required fields. Name, statement, code/slug, and difficulty are required." 
            });
        }

        const problem = new Problem({
            name,
            statement,
            code,
            difficulty,
            description,
            sampleInput,
            sampleOutput,
            timeLimit,
            memoryLimit,
            constraints,
            tags,
            createdBy
        });

        await problem.save();
        return res.status(201).json({ message: "Problem inserted successfully", problem });
        
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "A problem with this URL code slug already exists." });
        }
        
        console.error("Error inserting problem:", err);
        return res.status(500).json({ error: "Server Error: Failed to insert problem" });
    }
}

const getProblems = async (req, res) => {
    try {
        const { difficulty, tags, search } = req.query;
        const query = {};
        if (difficulty) {
            query.difficulty = difficulty;
        }
        if (tags) {
            let tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
            tagsArray = tagsArray.filter(t => t.length > 0);
            if (tagsArray.length > 0) {
                query.tags = { $all: tagsArray }; 
            }
        }
        if (search) {
            query.name = { $regex: search, $options: 'i' }; 
        }
        const problems = await Problem.find(query)
            .select('name code difficulty tags createdAt')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: problems.length,
            data: problems
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Server Error matching filters: ${error.message}`,
        });
    }
};

const getProblem = async (req, res) => {
    try{
        const problem = await Problem.findOne({code: req.params.code});
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }
        res.status(200).json(problem);
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch problem ${error.message}` });
    }
}

module.exports = {
    insertProblem,
    getProblems,
    getProblem
}

// ### INSERT PROBLEM

// {
//   "name": "Contains Duplicate",
//   "code": "contains-duplicate",
//   "difficulty": "Easy",
//   "statement": "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
//   "description": "A classic warm-up array problem that tests your basic understanding of hash sets, search lookup speeds, and frequency mapping.",
//   "sampleInput": "[1, 2, 3, 1]",
//   "sampleOutput": "true",
//   "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
//   "tags": ["Array", "Hash Table"]
// }

// {
//   "name": "Longest Substring Without Repeating Characters",
//   "code": "longest-substring-without-repeating-characters",
//   "difficulty": "Medium",
//   "statement": "Given a string s, find the length of the longest substring without repeating characters.",
//   "description": "An essential sliding window problem where you maintain a variable-sized window tracking characters. Ideal for evaluating string manipulation and optimal tracking layouts.",
//   "sampleInput": "\"abcabcbb\"",
//   "sampleOutput": "3",
//   "constraints": "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
//   "tags": ["String", "Sliding Window"]
// }

// {
//   "name": "Edit Distance",
//   "code": "edit-distance",
//   "difficulty": "Hard",
//   "statement": "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. You have the following three operations permitted on a word:\n1. Insert a character\n2. Delete a character\n3. Replace a character",
//   "description": "A foundational Levenshtein Distance dynamic programming problem. It expects an optimal two-dimensional state array approach mapping matrix lookups over character permutations.",
//   "sampleInput": "word1 = \"horse\", word2 = \"ros\"",
//   "sampleOutput": "3",
//   "constraints": "0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.",
//   "tags": ["String", "Dynamic Programming"]
// }


// ### GET PROBLEMS

// {
//   "difficulty": "Medium",
//   "tags": "['Array','Math']",
//   "search": "sum"
// }
