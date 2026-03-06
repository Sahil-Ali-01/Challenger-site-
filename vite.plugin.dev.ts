import { Plugin } from "vite";

export function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      // Use string-based dynamic imports to avoid static analysis
      const serverModule = await import(/* @vite-ignore */ "./server");
      const socketModule = await import("socket.io");
      const multiplayerModule = await import(/* @vite-ignore */ "./server/multiplayer");

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
    },
  };
}
