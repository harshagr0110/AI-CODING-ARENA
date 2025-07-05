import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure GEMINI_API_KEY is available
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Define the expected return type for evaluation
interface CodeEvaluation {
  isCorrect: boolean;
  feedback: string;
  timeComplexity: string;
  spaceComplexity: string;
  score: number;
}

// Define the expected return type for challenge generation
interface CodingChallenge {
  title: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
}

export async function generateCodingChallenge(difficulty: string = "medium"): Promise<CodingChallenge> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Generate a unique coding challenge for a multiplayer coding arena.
    
    Difficulty: ${difficulty}
    
    ## Difficulty Guidelines:
    - Easy: Simple logic, no advanced data structures, no recursion, no tricky edge cases. Example topics: FizzBuzz, Palindrome, Sum of Array, Find Maximum, Count Vowels, Reverse String, Remove Duplicates, Factorial, etc. Should be solvable by a beginner in under 10 minutes.
    - Medium: May involve basic data structures (arrays, hash maps, sets), simple algorithms, or require combining 2-3 steps. Example topics: Two Sum, Valid Parentheses, Merge Sorted Arrays, Group Anagrams, Find Intersection, String Compression, etc. Should be solvable by someone with 6+ months of coding experience in 20-30 minutes.
    - Hard: Involves advanced data structures (trees, graphs, heaps), recursion, dynamic programming, or tricky edge cases. Example topics: LRU Cache, Word Ladder, Longest Substring Without Repeating, Median of Two Sorted Arrays, etc. Should be challenging for experienced coders and take 30+ minutes.
    
    Requirements:
    - Create a problem that can be solved in JavaScript
    - The problem can be from any standard coding interview topic: arrays, strings, binary search, trees, graphs, dynamic programming, recursion, sorting, searching, math, etc.
    - Include clear problem description
    - Provide 2-3 examples with input, output, and explanation
    - **You MUST mentally or with code actually check that your example input/output pairs are correct for the problem. Do not make up outputs. Only output examples that you have verified are correct for the problem.**
    - Make it engaging and competitive
    - Avoid common problems like 'Two Sum' or 'Reverse String' unless the difficulty is 'easy'
    - Be creative and unique - avoid overused problems
    - For 'easy', keep it very simple and beginner-friendly
    - For 'medium', make it moderately challenging
    - For 'hard', make it truly challenging
    
    Respond ONLY with a valid JSON object following this structure:
    {
      "title": "string", // Creative, engaging title
      "description": "string", // Clear problem description with requirements
      "examples": [
        {
          "input": "string", // Example input
          "output": "string", // Expected output
          "explanation": "string" // Brief explanation (optional)
        }
      ]
    }
    
    Make sure the challenge is unique and hasn't been used before. Be creative!
    `;

    console.log("Calling Gemini API for challenge generation...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log("Gemini raw response for challenge:", text);

    // Clean the response text by removing markdown if Gemini adds it
    const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const challenge: CodingChallenge = JSON.parse(cleanText);

    // Basic validation
    if (
      typeof challenge.title !== 'string' ||
      typeof challenge.description !== 'string' ||
      !Array.isArray(challenge.examples) ||
      challenge.examples.length === 0
    ) {
      throw new Error("Parsed challenge object has an invalid structure.");
    }

    return challenge;

  } catch (error) {
    console.error("Gemini API error during challenge generation:", error);
    throw new Error(
      typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}

export async function evaluateCode(code: string, challenge: any): Promise<CodeEvaluation> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing");
    // Return a default error evaluation instead of throwing, to allow submission processing
    return {
      isCorrect: false,
      feedback: "API Key missing for evaluation.",
      timeComplexity: "N/A",
      spaceComplexity: "N/A",
      score: 0,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Updated Prompt to be much more flexible with similar solutions
    const prompt = `
    You are an expert code evaluator for a competitive coding arena. Your job is to evaluate if the submitted code correctly solves the given problem.
    
    CRITICAL EVALUATION GUIDELINES:
    - Be EXTREMELY flexible and lenient with solutions that achieve the same result
    - Accept ANY approach that would logically solve the problem (iterative, recursive, functional, etc.)
    - Don't require exact variable names, function names, or formatting
    - Focus ONLY on logical correctness and problem-solving approach
    - If the logic is sound and would produce correct results, mark it as CORRECT
    - Consider edge cases but don't be overly strict
    - Accept different output formats if they're logically equivalent
    - Don't penalize for style differences, syntax variations, or language differences
    - The goal is to reward problem-solving ability, not exact code matching
    - For palindrome problems: Accept any solution that correctly identifies palindromes
    - For array problems: Accept any solution that produces the correct output
    - For string problems: Accept any solution that handles the string correctly
    
    ## Coding Challenge:
    Title: ${challenge.title}
    Description: ${challenge.description}
    Examples:
    ${JSON.stringify(challenge.examples, null, 2)}
    
    ## Submitted Code:
    \`\`\`
    ${code}
    \`\`\`
    
    Respond ONLY with a valid JSON object following this structure. Be VERY generous with scoring - if the logic is correct, give high scores.
    
    {
      "isCorrect": boolean, // true if the code logic correctly solves the problem, false only if fundamentally wrong
      "feedback": "string", // Constructive feedback on the code, even if correct. Max 3 sentences.
      "timeComplexity": "string", // e.g., "O(N)", "O(N log N)", "O(1)"
      "spaceComplexity": "string", // e.g., "O(N)", "O(log N)", "O(1)"
      "score": number // 0-100, be generous: 80-100 for correct logic, 60-79 for mostly correct, 40-59 for partially correct
    }
    
    Remember: This is a competitive coding environment, not a production code review. Reward problem-solving ability over exact implementation details. If the solution would work, mark it as correct.
    `;

    console.log("Calling Gemini API for code evaluation...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    console.log("Gemini raw response:", text);

    try {
      // Clean the response text by removing markdown if Gemini adds it
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const evaluation: CodeEvaluation = JSON.parse(cleanText);

      // Basic validation for the parsed object structure
      if (
        typeof evaluation.isCorrect !== 'boolean' ||
        typeof evaluation.feedback !== 'string' ||
        typeof evaluation.timeComplexity !== 'string' ||
        typeof evaluation.spaceComplexity !== 'string' ||
        typeof evaluation.score !== 'number'
      ) {
        throw new Error("Parsed evaluation object has an invalid structure.");
      }

      // Ensure score is within valid range
      evaluation.score = Math.max(0, Math.min(100, Math.round(evaluation.score)));

      return evaluation;

    } catch (parseError) {
      console.error("Failed to parse Gemini evaluation response:", parseError);
      console.error("Raw response that caused parse error:", text);
      // Return a default error evaluation if parsing fails
      return {
        isCorrect: false,
        feedback: "Could not parse AI evaluation. Please try again or check code format.",
        timeComplexity: "N/A",
        spaceComplexity: "N/A",
        score: 0,
      };
    }

  } catch (error) {
    console.error("Gemini API error during evaluation:", error);
    // Return a default error evaluation if API call fails
    return {
      isCorrect: false,
      feedback: `AI evaluation failed: ${error instanceof Error ? error.message : String(error)}.`,
      timeComplexity: "N/A",
      spaceComplexity: "N/A",
      score: 0,
    };
  }
}