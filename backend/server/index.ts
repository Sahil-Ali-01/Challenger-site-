import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getQuestions, getLeaderboard, getUser } from "./routes/quiz-api";
import {
  handleProfileUpdate,
  handleGetAchievements,
  handleGetGlobalRank,
} from "./routes/profile";
import {
  generateAIQuestion,
  generateMultipleAIQuestions,
} from "./routes/ai-questions";
import authEmailRoutes from "./routes/auth-email";
import { supabase } from "./lib/db";
import { verifyMailerConnection } from "./config/mailer";

function isOriginMatch(origin: string, allowedOrigin: string) {
  try {
    const originUrl = new URL(origin);
    // Exact origin match with normalization for accidental trailing slash.
    if (!allowedOrigin.includes("*")) {
      const allowedUrl = new URL(allowedOrigin);
      return (
        originUrl.protocol === allowedUrl.protocol &&
        originUrl.hostname === allowedUrl.hostname &&
        originUrl.port === allowedUrl.port
      );
    }

    // Support wildcard host patterns like: https://*.vercel.app
    const allowedUrl = new URL(allowedOrigin.replace("*.", ""));
    if (originUrl.protocol !== allowedUrl.protocol) {
      return false;
    }

    const wildcardHost = allowedUrl.hostname;
    return (
      originUrl.hostname === wildcardHost ||
      originUrl.hostname.endsWith(`.${wildcardHost}`)
    );
  } catch {
    return false;
  }
}

export function createServer() {
  const app = express();

  // Middleware
  const defaultDevOrigins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  const defaultProdOrigins = ["https://challenger-site.vercel.app"];
  const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins =
    process.env.NODE_ENV === "development"
      ? Array.from(new Set([...defaultDevOrigins, ...configuredOrigins]))
      : Array.from(new Set([...defaultProdOrigins, ...configuredOrigins]));

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser clients and same-origin requests without Origin header.
        if (
          !origin ||
          allowedOrigins.some((allowedOrigin) =>
            isOriginMatch(origin, allowedOrigin),
          )
        ) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Supabase Auth Middleware
  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && supabase) {
      const token = authHeader.split(" ")[1];
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
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
  app.get("/api/profile/:userId/rank", handleGetGlobalRank);

  // Email Authentication routes (register, verify email, password reset)
  app.use("/api/auth", authEmailRoutes);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
