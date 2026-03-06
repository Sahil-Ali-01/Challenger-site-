import { RequestHandler } from "express";
import { Question, User, ApiResponse } from "@shared/api";
import { supabase } from "../lib/db";

const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    category: 'javascript',
    question: 'What is the output of `console.log(typeof NaN)`?',
    options: ['"number"', '"NaN"', '"undefined"', '"object"'],
    correctAnswer: 0,
    explanation: 'In JavaScript, `NaN` (Not-a-Number) is a special value that belongs to the `number` type.'
  },
  {
    id: '2',
    category: 'python',
    question: 'Which of the following is used to define a block of code in Python?',
    options: ['Brackets', 'Parentheses', 'Indentation', 'Semicolons'],
    correctAnswer: 2,
    explanation: 'Python uses indentation to define code blocks.'
  }
];

export const getQuestions: RequestHandler = (req, res) => {
  const category = req.query.category as string;
  let questions = MOCK_QUESTIONS;
  
  if (category) {
    questions = MOCK_QUESTIONS.filter(q => q.category.toLowerCase() === category.toLowerCase());
  }
  
  const response: ApiResponse<Question[]> = {
    success: true,
    data: questions
  };
  res.json(response);
};

export const getLeaderboard: RequestHandler = async (_req, res) => {
  try {
    if (!supabase) {
      console.error("❌ Supabase not initialized on server");
      return res.json({
        success: false,
        error: "Database not connected",
        data: []
      });
    }

    console.log("📊 Fetching leaderboard from database...");

    const { data, error, count } = await supabase
      .from("profiles")
      .select("id, username, full_name, wins, losses, elo_rating, weekly_points, daily_points, total_points, accuracy, streak", { count: "exact" })
      .order("wins", { ascending: false })
      .limit(100);

    if (error) {
      console.error("❌ Leaderboard fetch error:", {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return res.json({
        success: false,
        error: error.message,
        data: []
      });
    }

    console.log(`✅ Leaderboard fetched: ${data?.length || 0} profiles, total count: ${count}`);
    
    const transformed = (data || []).map((profile, index) => ({
      id: profile.id,
      rank: index + 1,
      name: profile.full_name || profile.username || 'Anonymous',
      username: profile.username,
      wins: profile.wins || 0,
      losses: profile.losses || 0,
      elo: profile.elo_rating || 1200,
      weekly_points: profile.weekly_points || 0,
      daily_points: profile.daily_points || 0,
      total_points: profile.total_points || 0,
      accuracy: profile.accuracy || 0,
      streak: profile.streak || 0,
      points: profile.wins || 0
    }));

    res.json({
      success: true,
      data: transformed,
      total: count
    });
  } catch (err: any) {
    console.error("❌ Leaderboard exception:", err);
    res.json({
      success: false,
      error: err.message,
      data: []
    });
  }
};

export const getUser: RequestHandler = (req, res) => {
  const { username } = req.params;
  
  const user: User = {
    id: '123',
    username: username,
    email: `${username}@example.com`,
    stats: {
      points: 1250,
      rank: 128,
      solved: 85,
      streak: 7
    },
    badges: ['Beginner', 'Code Master'],
    joinedAt: new Date().toISOString()
  };

  const response: ApiResponse<User> = {
    success: true,
    data: user
  };
  res.json(response);
};
