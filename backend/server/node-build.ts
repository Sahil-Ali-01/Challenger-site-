import { createServer } from "./index";
import { verifyMailerConnection } from "./config/mailer";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupMultiplayer } from "./multiplayer";

function isOriginMatch(origin: string, allowedOrigin: string) {
  try {
    const originUrl = new URL(origin);
    if (!allowedOrigin.includes("*")) {
      const allowedUrl = new URL(allowedOrigin);
      return originUrl.protocol === allowedUrl.protocol
        && originUrl.hostname === allowedUrl.hostname
        && originUrl.port === allowedUrl.port;
    }

    const allowedUrl = new URL(allowedOrigin.replace("*.", ""));
    if (originUrl.protocol !== allowedUrl.protocol) {
      return false;
    }

    const wildcardHost = allowedUrl.hostname;
    return originUrl.hostname === wildcardHost || originUrl.hostname.endsWith(`.${wildcardHost}`);
  } catch {
    return false;
  }
}

const app = createServer();
const requestedPort = Number(process.env.PORT || 8082);

async function isBackendAlreadyRunning(targetPort: string | number) {
  try {
    const response = await fetch(`http://localhost:${targetPort}/api/ping`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

function listenOnPort(server: ReturnType<typeof createHttpServer>, port: number) {
  return new Promise<void>((resolve, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });
}

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  let mailerReady = false;

  const httpServer = createHttpServer(app);

  const defaultDevOrigins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const defaultProdOrigins = [
    "https://your-frontend.vercel.app",
    "https://*.vercel.app",
  ];
  const allowedOrigins = Array.from(
    process.env.NODE_ENV === "development"
      ? new Set([...defaultDevOrigins, ...configuredOrigins])
      : new Set([...defaultProdOrigins, ...configuredOrigins]),
  );

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some((allowedOrigin) => isOriginMatch(origin, allowedOrigin))) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setupMultiplayer(io);
  let activePort = requestedPort;

  try {
    await listenOnPort(httpServer, requestedPort);
  } catch (error: any) {
    if (error?.code !== "EADDRINUSE") {
      console.error("❌ Failed to start backend server:", error?.message || String(error));
      process.exit(1);
      return;
    }

    const isExistingBackend = await isBackendAlreadyRunning(requestedPort);
    if (isExistingBackend) {
      console.log(`ℹ️ Port ${requestedPort} is already used by an active backend server.`);
      console.log("ℹ️ Skipping duplicate server startup. Use the existing process.");
      process.exit(0);
      return;
    }

    // Requested behavior: fallback to 8083 when 8082 is occupied by a non-backend process.
    if (requestedPort === 8082) {
      const fallbackPort = 8083;
      console.warn(`⚠️ Port ${requestedPort} is in use by another process. Trying ${fallbackPort}...`);
      try {
        await listenOnPort(httpServer, fallbackPort);
        activePort = fallbackPort;
      } catch (fallbackError: any) {
        console.error(`❌ Failed to start on fallback port ${fallbackPort}:`, fallbackError?.message || String(fallbackError));
        process.exit(1);
        return;
      }
    } else {
      console.error(`❌ Port ${requestedPort} is already in use by another process.`);
      console.error("💡 Stop that process or set a different PORT in backend/.env");
      process.exit(1);
      return;
    }
  }

  console.log(`🚀 Backend server running on port ${activePort}`);
  console.log(`🔧 API: http://localhost:${activePort}/api`);
  console.log(`🔌 Socket.IO: http://localhost:${activePort}`);
  console.log("📧 Email service: ⏳ Checking in background");

  // Verify email service without blocking server availability.
  void verifyMailerConnection()
    .then((isReady) => {
      mailerReady = isReady;
      if (!mailerReady) {
        console.warn("⚠️  Email service not available - verification emails may be delayed or fail");
      } else {
        console.log("✅ Email service connected successfully");
      }
    })
    .catch((error) => {
      console.error("❌ Background email service check failed:", error);
    });
}

startServer();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
