import { RequestHandler } from "express";
import Groq from "groq-sdk";
import { Question } from "@shared/api";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Fallback mock AI questions when API fails
const MOCK_AI_QUESTIONS: Record<string, Question[]> = {
  programming: [
    {
      id: 'ai-mock-1',
      category: 'programming',
      question: 'What does the `map()` function do in JavaScript?',
      options: ['Creates a new array with transformed elements', 'Finds elements in an array', 'Sorts an array', 'Removes duplicates'],
      correctAnswer: 0,
      explanation: 'The `map()` function creates a new array by applying a function to each element of the original array.'
    },
    {
      id: 'ai-mock-2',
      category: 'programming',
      question: 'What is a closure in programming?',
      options: ['A function that closes a file', 'A function that has access to variables from its parent scope', 'A type of loop', 'A way to end a program'],
      correctAnswer: 1,
      explanation: 'A closure is a function that has access to variables from its outer scope, even after that scope has returned.'
    },
    {
      id: 'ai-mock-3',
      category: 'programming',
      question: 'What is the time complexity of binary search?',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(2^n)'],
      correctAnswer: 1,
      explanation: 'Binary search divides the search space in half each time, resulting in O(log n) time complexity.'
    }
  ],
  javascript: [
    {
      id: 'ai-mock-js-1',
      category: 'javascript',
      question: 'What is the output of `typeof undefined`?',
      options: ['"undefined"', '"unknown"', 'null', 'ReferenceError'],
      correctAnswer: 0,
      explanation: 'The typeof operator returns "undefined" for undefined values.'
    }
  ]
};

export const generateAIQuestion: RequestHandler = async (req, res) => {
  const { category = "programming", difficulty = "medium" } = req.body;
  
  try {
    console.log(`🤖 Generating AI question for category: ${category}, difficulty: ${difficulty}`);

    const prompt = `Generate a multiple-choice programming question about ${category} at ${difficulty} difficulty level.

Requirements:
- Generate ONLY valid JSON, no other text
- Question should be realistic and educational
- 4 options total
- Exactly one correct answer

Return JSON format:
{
  "question": "What is...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "The correct answer is Option A because..."
}`;

    const message = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseText = message.choices[0]?.message?.content || "";
    console.log("Raw AI response:", responseText);

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from AI response");
    }

    const questionData = JSON.parse(jsonMatch[0]);

    // Fix options if it's a string instead of array
    if (typeof questionData.options === 'string') {
      questionData.options = questionData.options.split(/\s+(?:To|Option|A\.|B\.|C\.|D\.)/).filter((o: string) => o.trim().length > 2).slice(0, 4);
    }

    // Validate the response
    if (!questionData.question || !questionData.options || questionData.correctAnswer === undefined || !questionData.explanation) {
      throw new Error("Invalid question data structure");
    }

    if (!Array.isArray(questionData.options) || questionData.options.length !== 4) {
      throw new Error("Must have exactly 4 options as an array");
    }

    if (questionData.correctAnswer < 0 || questionData.correctAnswer > 3) {
      throw new Error("correctAnswer must be 0-3");
    }

    const question: Question = {
      id: `ai-${Date.now()}`,
      category: category.toLowerCase(),
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
    };

    console.log("✅ AI Question generated successfully:", question);

    res.json({
      success: true,
      data: question,
    });
  } catch (err: any) {
    console.error("❌ AI question generation error:", {
      message: err.message,
      error: err,
    });
    console.log("⚠️  Using fallback mock question...");
    
    // Use fallback mock question
    const categoryLower = category.toLowerCase();
    const mockQuestions = MOCK_AI_QUESTIONS[categoryLower] || MOCK_AI_QUESTIONS.programming;
    const fallbackQuestion = mockQuestions[0];
    
    res.json({
      success: true,
      data: fallbackQuestion,
      note: "Using fallback question due to API unavailability"
    });
  }
};

export const generateMultipleAIQuestions: RequestHandler = async (req, res) => {
  const { category = "programming", difficulty = "medium", count = 5 } = req.body;
  
  try {
    console.log(`🤖 Generating ${count} AI questions for category: ${category}`);

    const prompt = `Generate ${count} multiple-choice programming questions about ${category} at ${difficulty} difficulty level.

Requirements:
- Generate ONLY valid JSON array, no other text
- Questions should be realistic and educational
- Each question has 4 options
- Exactly one correct answer per question

Return JSON array format:
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "The correct answer is Option A because..."
  }
]`;

    const message = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const responseText = message.choices[0]?.message?.content || "";
    console.log("Raw AI response length:", responseText.length);

    // Parse JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON array from AI response");
    }

    const questionsData = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(questionsData)) {
      throw new Error("Response must be an array");
    }

    const questions: Question[] = questionsData.map((q: any, idx: number) => {
      // Fix options if it's a string instead of array
      let options = q.options;
      if (typeof options === 'string') {
        options = options.split(/\s+(?:To|Option|A.|B.|C.|D.)/).filter((o: string) => o.trim().length > 2).slice(0, 4);
      }
      
      return {
        id: `ai-${Date.now()}-${idx}`,
        category: category.toLowerCase(),
        question: q.question,
        options: Array.isArray(options) ? options : [options],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    console.log(`✅ Generated ${questions.length} AI questions successfully`);

    res.json({
      success: true,
      data: questions,
    });
  } catch (err: any) {
    console.error("❌ AI questions generation error:", err.message);
    console.log("⚠️  Using fallback mock questions...");
    
    // Use fallback mock questions
    const categoryLower = category.toLowerCase();
    const mockQuestions = MOCK_AI_QUESTIONS[categoryLower] || MOCK_AI_QUESTIONS.programming;
    const selectedQuestions = mockQuestions.slice(0, Math.min(count, mockQuestions.length));
    
    res.json({
      success: true,
      data: selectedQuestions,
      note: "Using fallback questions due to API unavailability"
    });
  }
};
