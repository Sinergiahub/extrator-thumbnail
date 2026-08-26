import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const BASE_PATH = "/imagelab/";

function rewriteBasePath(): Plugin {
  return {
    name: "rewrite-base-path",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith(BASE_PATH)) {
          req.url = req.url.slice(BASE_PATH.length - 1) || "/";
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: BASE_PATH,
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "development" && rewriteBasePath(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

