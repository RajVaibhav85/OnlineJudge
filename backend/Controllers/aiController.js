const { GoogleGenAI } = require("@google/genai");
const dotenv = require('dotenv');

dotenv.config();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});


const aiReview = async (req, res) => {
    try {
        const { code, language, description, input } = req.body;

        if (!code) {
            return res.status(400).json({ error: "No code provided for review." });
        }

        const descriptionBlock = description 
            ? `### Problem Description / Constraints:\n${description}\n` 
            : '';
            
        const inputBlock = input 
            ? `### User's Provided Test Input (stdin):\n\`\`\`\n${input}\n\`\`\`\n` 
            : '';

        const prompt = `
        You are a technical interview coach and DSA expert. Analyze the following ${language || ''} code written to solve an algorithmic problem.
        
        ${descriptionBlock}
        ${inputBlock}
        
        ### Code to Review:
        \`\`\`${language || ''}
        ${code}
        \`\`\`

        ---
        Please review the code thoroughly based on competitive programming and technical interview standards. Structure your feedback using these exact Markdown sections:

        ### 1. Complexity Analysis
        - **Time Complexity:** State the current Big O runtime (e.g., $O(N^2)$) and explain why.
        - **Space Complexity:** State the Big O auxiliary memory usage (e.g., $O(1)$) and explain why.
        - **Can it be optimized?** If the current approach is suboptimal, state the target optimal complexity.

        ### 2. Correctness & Algorithmic Edge Cases
        Evaluate if this code passes all standard DSA boundaries. Explicitly call out how it handles:
        - Empty/null inputs, size 1 bounds, or extremely large values.
        - Integer overflow (if applicable to the language).
        ${input ? `- **Your Custom Input Analysis:** Explain how the code executes using the specific input provided above and whether the output would be correct.` : ''}

        ### 3. Dry Run / Logical Flaws
        Point out any logical bugs or infinite loops. If there is a bug, trace it with a quick text-based step execution.

        ### 4. Optimal Refactored Code
        Provide the clean, optimized, and fully commented version of the code. If the user's approach was already optimal, provide a clean, highly readable version of it.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
        });

        return res.status(200).json({ review: response.text });

    } catch (error) {
        console.error("DSA AI Review Error:", error);
        return res.status(500).json({ error: "Failed to generate DSA review." });
    }
};


module.exports = {
    aiReview
}