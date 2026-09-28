import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2020",
    // Cada página vira um chunk próprio (React.lazy nas rotas).
    // Aqui só isolamos o que é comum a todas elas, para o browser cachear uma vez.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router")) return "vendor-router";
            return "vendor-react";
          }
          if (id.includes("/src/shared/")) return "shared-ui";
        },
      },
    },
  },
});
