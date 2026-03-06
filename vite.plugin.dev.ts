import { Plugin } from "vite";

export function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      // Lazy load server modules only in dev mode
      const { createServer } = await import("./server");
      const { Server } = await import("socket.io");
      const { setupMultiplayer } = await import("./server/multiplayer");

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
