import { RequestHandler } from "express";
import { supabase } from "../lib/db";

interface UpdateProfileRequest {
  userId: string;
  isCorrect: boolean;
  points?: number;
  questionId?: string;
  matchId?: string;
}

interface UpdateProfileResponse {
  success: boolean;
  newStats?: {
    wins: number;
    losses: number;
    accuracy: number;
    elo_rating: number;
    weekly_points: number;
  };
  achievements?: any[];
  error?: string;
}

const ELO_K_FACTOR = parseInt(process.env.ELO_K_FACTOR || "32", 10);

/**
 * Update user profile after answering a question or completing a match
 * POST /api/profile/update
 */
export const handleProfileUpdate: RequestHandler = async (req, res) => {
  try {
    if (!supabase) {
      res.status(503).json({ success: false, error: "Database not configured" });
      return;
    }

    const { userId, isCorrect, points = 10, questionId, matchId } = req.body as UpdateProfileRequest;

    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,name,email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ success: false, error: "Profile not found" });
      return;
    }

    const { data: leaderboardRow, error: leaderboardFetchError } = await supabase
      .from("leaderboard")
      .select("user_id, elo_rating, total_wins, total_losses, total_quizzes, correct_answers, accuracy_percentage, total_points, weekly_points, daily_points, streak")
      .eq("user_id", userId)
      .single();

    if (leaderboardFetchError && leaderboardFetchError.code !== "PGRST116") {
      res.status(500).json({ success: false, error: "Failed to load leaderboard stats" });
      return;
    }

    // If missing, create a default leaderboard row to keep profile updates consistent.
    if (!leaderboardRow) {
      const { error: createLeaderboardError } = await supabase
        .from("leaderboard")
        .insert({
          user_id: userId,
          elo_rating: 1200,
          total_wins: 0,
          total_losses: 0,
          total_quizzes: 0,
          correct_answers: 0,
          accuracy_percentage: 0,
          total_points: 0,
          weekly_points: 0,
          daily_points: 0,
          streak: 0,
          updated_at: new Date().toISOString(),
        });

      if (createLeaderboardError) {
        res.status(500).json({ success: false, error: "Failed to initialize leaderboard stats" });
        return;
      }
    }

    const currentWins = leaderboardRow?.total_wins ?? 0;
    const currentLosses = leaderboardRow?.total_losses ?? 0;
    const currentTotalQuizzes = leaderboardRow?.total_quizzes ?? 0;
    const currentCorrectAnswers = leaderboardRow?.correct_answers ?? 0;
    const currentElo = leaderboardRow?.elo_rating ?? 1200;
    const currentTotalPoints = leaderboardRow?.total_points ?? 0;
    const currentWeeklyPoints = leaderboardRow?.weekly_points ?? 0;

    const newWins = currentWins + (isCorrect ? 1 : 0);
    const newLosses = currentLosses + (isCorrect ? 0 : 1);
    const totalAttempts = newWins + newLosses;
    const newAccuracy = totalAttempts > 0 ? (newWins / totalAttempts) * 100 : 0;
    const newTotalQuizzes = currentTotalQuizzes + 1;
    const newCorrectAnswers = currentCorrectAnswers + (isCorrect ? 1 : 0);
    const newTotalPoints = currentTotalPoints + (isCorrect ? points : 0);
    const newWeeklyPoints = currentWeeklyPoints + (isCorrect ? points : 0);

    const { data: updatedLeaderboard, error: updateError } = await supabase
      .from("leaderboard")
      .update({
        total_wins: newWins,
        total_losses: newLosses,
        total_quizzes: newTotalQuizzes,
        correct_answers: newCorrectAnswers,
        accuracy_percentage: newAccuracy,
        elo_rating: currentElo,
        total_points: newTotalPoints,
        weekly_points: newWeeklyPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !updatedLeaderboard) {
      res.status(500).json({ success: false, error: "Failed to update profile" });
      return;
    }

    // Keep user_stats in sync for parts of the app reading this table.
    const { data: userStatsRow, error: userStatsFetchError } = await supabase
      .from("user_stats")
      .select("id")
      .eq("id", userId)
      .single();

    if (!userStatsRow && (!userStatsFetchError || userStatsFetchError.code === "PGRST116")) {
      const { error: createUserStatsError } = await supabase
        .from("user_stats")
        .insert({
          id: userId,
          name: profile.name,
          elo_rating: currentElo,
          total_wins: 0,
          total_losses: 0,
          total_quizzes: 0,
          accuracy_percentage: 0,
          quizzes_completed: 0,
          avg_accuracy: 0,
        });

      if (createUserStatsError) {
        console.warn("Failed to create user_stats row during profile update:", createUserStatsError.message);
      }
    }

    const { error: userStatsUpdateError } = await supabase
      .from("user_stats")
      .update({
        name: profile.name,
        total_wins: newWins,
        total_losses: newLosses,
        total_quizzes: newTotalQuizzes,
        quizzes_completed: newTotalQuizzes,
        accuracy_percentage: newAccuracy,
        avg_accuracy: newAccuracy,
        elo_rating: currentElo,
      })
      .eq("id", userId);

    if (userStatsUpdateError) {
      console.warn("Failed to sync user_stats during profile update:", userStatsUpdateError.message);
    }

    // Calculate earned achievements
    const achievements = calculateAchievements({
      wins: newWins,
      losses: newLosses,
      accuracy: newAccuracy,
      elo_rating: currentElo,
    });

    res.json({
      success: true,
      newStats: {
        wins: updatedLeaderboard.total_wins,
        losses: updatedLeaderboard.total_losses,
        accuracy: updatedLeaderboard.accuracy_percentage,
        elo_rating: updatedLeaderboard.elo_rating,
        weekly_points: updatedLeaderboard.weekly_points,
      },
      achievements,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get user profile achievements
 * GET /api/profile/:userId/achievements
 */
export const handleGetAchievements: RequestHandler = async (req, res) => {
  try {
    if (!supabase) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }

    const { userId } = req.params;

    // Get leaderboard stats used for achievement computation.
    const { data: leaderboardStats, error: fetchError } = await supabase
      .from("leaderboard")
      .select("user_id,total_wins,total_losses,accuracy_percentage,elo_rating")
      .eq("user_id", userId)
      .single();

    if (fetchError || !leaderboardStats) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    // Calculate achievements
    const achievements = calculateAchievements({
      wins: leaderboardStats.total_wins ?? 0,
      losses: leaderboardStats.total_losses ?? 0,
      accuracy: leaderboardStats.accuracy_percentage ?? 0,
      elo_rating: leaderboardStats.elo_rating ?? 1200,
    });

    res.json({
      achievements,
      total: achievements.length,
      maxPossible: 9, // Number of defined achievements
    });
  } catch (error: any) {
    console.error("Get achievements error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get deterministic global rank for a user
 * GET /api/profile/:userId/rank
 */
export const handleGetGlobalRank: RequestHandler = async (req, res) => {
  try {
    if (!supabase) {
      res.status(503).json({ error: "Database not configured" });
      return;
    }

    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const { data: mine, error: mineError } = await supabase
      .from("leaderboard")
      .select("user_id,total_points,elo_rating")
      .eq("user_id", userId)
      .single();

    if (mineError || !mine) {
      res.status(404).json({ error: "Leaderboard row not found for user" });
      return;
    }

    const pointsForRank = mine.total_points ?? 0;
    const eloForRank = mine.elo_rating ?? 1200;

    const { count: higherPointsCount } = await supabase
      .from("leaderboard")
      .select("user_id", { count: "exact", head: true })
      .gt("total_points", pointsForRank);

    const { count: samePointsHigherEloCount } = await supabase
      .from("leaderboard")
      .select("user_id", { count: "exact", head: true })
      .eq("total_points", pointsForRank)
      .gt("elo_rating", eloForRank);

    const { count: samePointsSameEloHigherIdCount } = await supabase
      .from("leaderboard")
      .select("user_id", { count: "exact", head: true })
      .eq("total_points", pointsForRank)
      .eq("elo_rating", eloForRank)
      .lt("user_id", userId);

    const globalRank =
      (higherPointsCount || 0) +
      (samePointsHigherEloCount || 0) +
      (samePointsSameEloHigherIdCount || 0) +
      1;

    res.json({
      success: true,
      userId,
      globalRank,
      points: pointsForRank,
      elo: eloForRank,
    });
  } catch (error: any) {
    console.error("Get global rank error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to calculate achievements based on profile stats
function calculateAchievements(profile: any) {
  const achievements = [];

  // First solved
  if (profile.wins >= 1) {
    achievements.push({
      id: "first-solved",
      name: "First Step",
      level: "Bronze",
      points: 50,
    });
  }

  // 10 wins
  if (profile.wins >= 10) {
    achievements.push({
      id: "ten-solved",
      name: "Hot Start",
      level: "Bronze",
      points: 200,
    });
  }

  // 50 wins
  if (profile.wins >= 50) {
    achievements.push({
      id: "fifty-solved",
      name: "Quiz Enthusiast",
      level: "Silver",
      points: 500,
    });
  }

  // 100 wins
  if (profile.wins >= 100) {
    achievements.push({
      id: "hundred-solved",
      name: "Century Club",
      level: "Gold",
      points: 1000,
    });
  }

  // 80% accuracy
  if (profile.accuracy >= 80) {
    achievements.push({
      id: "accuracy-80",
      name: "Precision Master",
      level: "Silver",
      points: 300,
    });
  }

  // 95% accuracy
  if (profile.accuracy >= 95) {
    achievements.push({
      id: "accuracy-95",
      name: "Perfect Aim",
      level: "Gold",
      points: 750,
    });
  }

  // ELO 1400
  if (profile.elo_rating >= 1400) {
    achievements.push({
      id: "elo-1400",
      name: "Rising Star",
      level: "Silver",
      points: 400,
    });
  }

  // ELO 1600
  if (profile.elo_rating >= 1600) {
    achievements.push({
      id: "elo-1600",
      name: "Elite Competitor",
      level: "Platinum",
      points: 1200,
    });
  }

  // Win rate > 50% with at least 10 wins
  if (profile.wins > profile.losses && profile.wins - profile.losses >= 10) {
    achievements.push({
      id: "win-ratio",
      name: "Victory Streak",
      level: "Gold",
      points: 600,
    });
  }

  return achievements;
}
