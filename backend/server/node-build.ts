import { createServer } from "./index";
import { verifyMailerConnection } from "./config/mailer";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupMultiplayer } from "./multiplayer";
import { startEmailWorker, stopEmailWorker } from "./workers/emailWorker";

function isOriginMatch(origin: string, allowedOrigin: string) {
  try {
    const originUrl = new URL(origin);
    const allowedUrl = new URL(allowedOrigin);

    return (
      originUrl.protocol === allowedUrl.protocol &&
      originUrl.hostname === allowedUrl.hostname
    );
  } catch {
    return false;
  }
}

const app = createServer();
const PORT = Number(process.env.PORT) || 10000;
const enableInProcessEmailWorker =
  process.env.ENABLE_IN_PROCESS_EMAIL_WORKER === "true";

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  let mailerReady = false;

  const httpServer = createHttpServer(app);

  const defaultDevOrigins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  const defaultProdOrigins = [
    "https://challenger-site.vercel.app"
  ];

  const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins =
    process.env.NODE_ENV === "development"
      ? Array.from(new Set([...defaultDevOrigins, ...configuredOrigins]))
      : Array.from(new Set([...defaultProdOrigins, ...configuredOrigins]));

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const allowed = allowedOrigins.some((allowedOrigin) =>
          isOriginMatch(origin, allowedOrigin)
        );

        if (allowed) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setupMultiplayer(io);

  try {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔌 Socket.IO ready`);
      console.log(`📧 Email service: checking...`);
    });
  } catch (error: any) {
    console.error("❌ Failed to start backend server:", error?.message || error);
    process.exit(1);
  }

  // Verify email service without blocking server startup
  void verifyMailerConnection()
    .then((isReady) => {
      mailerReady = isReady;
      if (!mailerReady) {
        console.warn(
          "⚠️ Email service not available - verification emails may fail"
        );
      } else {
        console.log("✅ Email service connected successfully");
      }
    })
    .catch((error) => {
      console.error("❌ Email service check failed:", error);
    });

  if (enableInProcessEmailWorker) {
    try {
      startEmailWorker();
      console.log("✅ In-process email worker started");
    } catch (error) {
      console.error("❌ Failed to start email worker:", error);
    }
  } else {
    console.log(
      "ℹ️ In-process email worker disabled (ENABLE_IN_PROCESS_EMAIL_WORKER=true to enable)"
    );
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down");
  void stopEmailWorker().finally(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down");
  void stopEmailWorker().finally(() => process.exit(0));
});