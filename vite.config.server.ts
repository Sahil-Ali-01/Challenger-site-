import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/index.ts"),
      name: "server",
      formats: ["es"],
      fileName: () => "node-build.mjs",
    },
    outDir: "dist/server",
    ssr: true,
    rollupOptions: {
      external: [
        "express",
        "cors",
        "dotenv",
        "socket.io",
        "@supabase/supabase-js",
        "groq-sdk",
      ],
      output: {
        dir: "dist/server",
        entryFileNames: "node-build.mjs",
        chunkFileNames: "[name].mjs",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
