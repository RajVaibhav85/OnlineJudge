const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const dbController = require('../Controllers/dbController')
const Problem = require('../Models/Problems');


const insertProblem = async (req, res) => {
    try {
        // 1. Pull out ALL possible fields from the request body
        const {
            name,
            statement,
            code,
            difficulty,
            description,
            sampleInput,
            sampleOutput,
            constraints,
            createdBy
        } = req.body;

        // 2. Validate ONLY the fields that your schema marks as 'required: true'
        if (!name || !statement || !code || !difficulty) {
            return res.status(400).json({ 
                message: "Missing required fields. Name, statement, code/slug, and difficulty are required." 
            });
        }

        // 3. Pass the fields into the Mongoose model constructor.
        // If an optional field wasn't provided, it is undefined, and Mongoose ignores it safely.
        const problem = new Problem({
            name,
            statement,
            code,
            difficulty,   // If undefined, schema default ('Medium') kicks in
            description,
            sampleInput,
            sampleOutput,
            constraints,
            createdBy
        });

        await problem.save();
        return res.status(201).json({ message: "Problem inserted successfully", problem });
        
    } catch (err) {
        // Catch Mongoose validation errors (like duplicate key errors on 'code')
        if (err.code === 11000) {
            return res.status(400).json({ error: "A problem with this URL code slug already exists." });
        }
        
        console.error("Error inserting problem:", err);
        return res.status(500).json({ error: "Failed to insert problem" });
    }
}

module.exports = {
    insertProblem
}


// {
//   name: "Contains Duplicate",
//   code: "contains-duplicate",
//   difficulty: "Easy",
//   statement: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
//   description: "A classic warm-up array problem that tests your basic understanding of hash sets, search lookup speeds, and frequency mapping.",
//   sampleInput: "[1, 2, 3, 1]",
//   sampleOutput: "true",
//   constraints: "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9"
// }

// {
//   name: "Longest Substring Without Repeating Characters",
//   code: "longest-substring-without-repeating-characters",
//   difficulty: "Medium",
//   statement: "Given a string s, find the length of the longest substring without repeating characters.",
//   description: "An essential sliding window problem where you maintain a variable-sized window tracking characters. Ideal for evaluating string manipulation and optimal tracking layouts.",
//   sampleInput: "\"abcabcbb\"",
//   sampleOutput: "3",
//   constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces."
// }

// {
//   name: "Edit Distance",
//   code: "edit-distance",
//   difficulty: "Hard",
//   statement: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. You have the following three operations permitted on a word:\n1. Insert a character\n2. Delete a character\n3. Replace a character",
//   description: "A foundational Levenshtein Distance dynamic programming problem. It expects an optimal two-dimensional state array approach mapping matrix lookups over character permutations.",
//   sampleInput: "word1 = \"horse\", word2 = \"ros\"",
//   sampleOutput: "3",
//   constraints: "0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters."
// }