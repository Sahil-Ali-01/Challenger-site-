import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      // Use string variables to prevent esbuild static analysis
      // eslint-disable-next-line prefer-const
      let serverPath = "./" + "server";
      // eslint-disable-next-line prefer-const
      let multiplayerPath = "./" + "server/multiplayer";

      try {
        const serverModule = await import(/* @vite-ignore */ serverPath);
        const socketModule = await import("socket.io");
        const multiplayerModule = await import(/* @vite-ignore */ multiplayerPath);

        const createServer = serverModule.createServer;
        const Server = socketModule.Server;
        const setupMultiplayer = multiplayerModule.setupMultiplayer;

        const app = createServer();

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);

        // Attach Socket.io
        if (server.httpServer) {
          const allowedOrigins = process.env.VITE_ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'];
          const io = new Server(server.httpServer, {
            cors: {
              origin: allowedOrigins,
              methods: ["GET", "POST"],
              credentials: true
            }
          });
          
          // Log all connection attempts
          io.engine.on("connection_error", (err) => {
            console.error("🔴 Socket.IO ENGINE CONNECTION ERROR:", err);
          });
          
          setupMultiplayer(io);
        }
      } catch (err) {
        console.error("Failed to setup express plugin:", err);
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
