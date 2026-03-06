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

    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      res.status(404).json({ success: false, error: "Profile not found" });
      return;
    }

    // Update stats
    const newWins = profile.wins + (isCorrect ? 1 : 0);
    const newLosses = profile.losses + (isCorrect ? 0 : 1);
    const totalAttempts = newWins + newLosses;
    const newAccuracy = totalAttempts > 0 ? (newWins / totalAttempts) * 100 : 0;
    const newWeeklyPoints = profile.weekly_points + (isCorrect ? points : 0);

    // Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        wins: newWins,
        losses: newLosses,
        accuracy: newAccuracy,
        weekly_points: newWeeklyPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      res.status(500).json({ success: false, error: "Failed to update profile" });
      return;
    }

    // Calculate earned achievements
    const achievements = calculateAchievements(updatedProfile);

    res.json({
      success: true,
      newStats: {
        wins: updatedProfile.wins,
        losses: updatedProfile.losses,
        accuracy: updatedProfile.accuracy,
        elo_rating: updatedProfile.elo_rating,
        weekly_points: updatedProfile.weekly_points,
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

    // Get profile
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    // Calculate achievements
    const achievements = calculateAchievements(profile);

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
