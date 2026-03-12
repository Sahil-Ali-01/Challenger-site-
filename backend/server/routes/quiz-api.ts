import { RequestHandler } from "express";
import { Question, User, ApiResponse } from "@shared/api";
import { supabase } from "../lib/db";
import { getRandomFallbackQuestions } from "../lib/fallback-questions";

interface AiQuestionsResponse {
  success?: boolean;
  data?: Question[];
}

function shuffleQuestions<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getRandomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export const getQuestions: RequestHandler = async (req, res) => {
  const categoryRaw = String(req.query.category || "").trim();
  const requestedCount = Number(req.query.count || 5);
  const count = Number.isFinite(requestedCount)
    ? Math.min(Math.max(requestedCount, 1), 15)
    : 5;

  const categoryPool = ["programming", "javascript", "python", "system design", "algorithms"];
  const difficultyPool = ["easy", "medium", "hard"];

  const category = categoryRaw || getRandomItem(categoryPool);
  const difficulty = getRandomItem(difficultyPool);

  try {
    const internalApiBase =
      process.env.INTERNAL_API_BASE_URL ||
      process.env.API_BASE_URL ||
      `http://localhost:${process.env.PORT || 8082}`;

    // Timeout: fall back to JSON questions if AI doesn't respond within 8s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let aiResponse: Response | null = null;
    try {
      aiResponse = await fetch(`${internalApiBase}/api/questions/generate-multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, difficulty, count }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const aiPayload = (await aiResponse.json().catch(() => null)) as AiQuestionsResponse | null;

    if (aiResponse.ok && aiPayload?.success && Array.isArray(aiPayload?.data) && aiPayload.data.length > 0) {
      console.log(`✅ [QUIZ] Got ${aiPayload.data.length} AI questions (category=${category}, difficulty=${difficulty})`);
      return res.json({
        success: true,
        data: shuffleQuestions(aiPayload.data as Question[]).slice(0, count),
      });
    }

    console.warn("⚠️ AI question endpoint returned invalid payload, using 50-question fallback");
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.warn("⚠️ AI question fetch timed out (>8s), using 50-question fallback");
    } else {
      console.warn("⚠️ AI question fetch failed, using 50-question fallback:", error);
    }
  }

  const response: ApiResponse<Question[]> = {
    success: true,
    data: getRandomFallbackQuestions(count),
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
