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

export const getLeaderboard: RequestHandler = async (req, res) => {
  try {
    if (!supabase) {
      console.error("❌ Supabase not initialized on server");
      return res.json({
        success: false,
        error: "Database not connected",
        data: []
      });
    }

    const typeRaw = String(req.query.type || req.query.tab || "all-time").toLowerCase();
    const limitRaw = Number(req.query.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100;

    const normalizedType =
      typeRaw === "global" ? "all-time" :
      typeRaw === "alltime" ? "all-time" :
      typeRaw;

    const sortColumn =
      normalizedType === "weekly" ? "weekly_points" :
      normalizedType === "daily" ? "daily_points" :
      normalizedType === "multiplayer" ? "elo_rating" :
      "total_points";

    console.log(`📊 Fetching leaderboard from database (type=${normalizedType}, sort=${sortColumn}, limit=${limit})...`);

    let hasDailyPointsColumn = true;
    let data: any[] | null = null;
    let count: number | null = null;
    let error: any = null;

    ({ data, error, count } = await supabase
      .from("leaderboard")
      .select("user_id, elo_rating, total_wins, total_losses, total_quizzes, correct_answers, accuracy_percentage, total_points, weekly_points, daily_points, streak", { count: "exact" })
      .order(sortColumn, { ascending: false })
      .order("elo_rating", { ascending: false })
      .order("user_id", { ascending: true })
      .limit(limit));

    // Some deployments still don't have daily_points column yet.
    if (error && String(error.message || "").includes("daily_points")) {
      hasDailyPointsColumn = false;
      const fallbackSortColumn = normalizedType === "daily" ? "weekly_points" : sortColumn;

      ({ data, error, count } = await supabase
        .from("leaderboard")
        .select("user_id, elo_rating, total_wins, total_losses, total_quizzes, correct_answers, accuracy_percentage, total_points, weekly_points, streak", { count: "exact" })
        .order(fallbackSortColumn, { ascending: false })
        .order("elo_rating", { ascending: false })
        .order("user_id", { ascending: true })
        .limit(limit));
    }

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
    
    const userIds = (data || []).map((row) => row.user_id).filter(Boolean);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

    const transformed = (data || []).map((row, index) => {
      const p = profileMap.get(row.user_id);
      const fallbackName = p?.email?.split('@')[0] || 'Anonymous';
      const pointsForType =
        normalizedType === "weekly" ? (row.weekly_points || 0) :
        normalizedType === "daily" ? ((hasDailyPointsColumn ? row.daily_points : row.weekly_points) || 0) :
        normalizedType === "multiplayer" ? (row.elo_rating || 1200) :
        (row.total_points || 0);

      return {
      id: row.user_id,
      rank: index + 1,
      name: p?.name || fallbackName,
      username: p?.email?.split('@')[0] || fallbackName,
      wins: row.total_wins || 0,
      losses: row.total_losses || 0,
      elo: row.elo_rating || 1200,
      weekly_points: row.weekly_points || 0,
      daily_points: hasDailyPointsColumn ? (row.daily_points || 0) : (row.weekly_points || 0),
      total_points: row.total_points || 0,
      accuracy: row.accuracy_percentage || 0,
      streak: row.streak || 0,
      points: pointsForType
    }});

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
  const usernameParam = req.params.username;
  const username = Array.isArray(usernameParam)
    ? usernameParam[0]
    : (usernameParam || "user");
  
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
