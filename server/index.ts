import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getQuestions, getLeaderboard, getUser } from "./routes/quiz-api";
import { handleProfileUpdate, handleGetAchievements } from "./routes/profile";
import { generateAIQuestion, generateMultipleAIQuestions } from "./routes/ai-questions";
import { supabase } from "./lib/db";

export function createServer() {
  const app = express();

  // Middleware
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://localhost:3000'];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Supabase Auth Middleware
  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && supabase) {
      const token = authHeader.split(" ")[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user) {
        (req as any).user = user;
      }
    } else {
      // No fallback for production - require authentication
      (req as any).user = null;
    }
    next();
  });

  // Quiz API routes
  app.get("/api/questions", getQuestions);
  app.get("/api/leaderboard", getLeaderboard);
  app.get("/api/user/:username", getUser);

  // AI Question routes
  app.post("/api/questions/generate", generateAIQuestion);
  app.post("/api/questions/generate-multiple", generateMultipleAIQuestions);

  // Profile routes
  app.post("/api/profile/update", handleProfileUpdate);
  app.get("/api/profile/:userId/achievements", handleGetAchievements);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
