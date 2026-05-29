import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import {defineConfig} from "vite"
import process from "process"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "./",
  server: {
    host: '::',
    port: 5173,
    allowedHosts: true,
    cors: true,
    hmr: {
        protocol: 'wss',
        host: `5173-${process.env.X_IDE_SPACE_KEY}.e2b.${process.env.X_IDE_SPACE_REGION}.${process.env.X_IDE_SPACE_HOST}`
    },
  },
})
