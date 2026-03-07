import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      try {
        console.log("\n🚀 Initializing Express + Socket.IO plugin...");
        
        // Import using relative paths
        const serverModule = await import("./server/index");
        const { Server: SocketIOServer } = await import("socket.io");
        const multiplayerModule = await import("./server/multiplayer");

        console.log("✅ All modules imported successfully");

        const createServer = serverModule.createServer;
        const setupMultiplayer = multiplayerModule.setupMultiplayer;

        const app = createServer();
        console.log("✅ Express app created");

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);
        console.log("✅ Express middleware added to Vite");

        // Attach Socket.io
        if (server.httpServer) {
          console.log("✅ httpServer found, initializing Socket.IO...");
          const allowedOrigins = process.env.VITE_ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'http://localhost:8080'];
          console.log("   Allowed origins for CORS:", allowedOrigins);
          
          const io = new SocketIOServer(server.httpServer, {
            cors: {
              origin: allowedOrigins,
              methods: ["GET", "POST"],
              credentials: true
            }
          });
          
          console.log("✅ Socket.IO server created");
          
          // Log all connection attempts
          io.engine.on("connection_error", (err) => {
            console.error("🔴 Socket.IO ENGINE CONNECTION ERROR:", err);
          });
          
          console.log("🔧 Setting up multiplayer handlers...");
          setupMultiplayer(io);
          console.log("✅ Multiplayer setup complete!");
          console.log("\n🎮 Socket.IO is ready on http://localhost:8081\n");
        } else {
          console.error("❌ httpServer not found!");
        }
      } catch (err) {
        console.error("\n❌ Failed to setup express plugin:");
        console.error(err);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const plugins = [react()];

  // Only add express plugin during dev mode
  if (command === 'serve') {
    plugins.push(expressPlugin());
  }

  return {
    server: {
      host: "localhost",
      port: 8080,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
    },
    build: {
      outDir: "dist/spa",
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});
