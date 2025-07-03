import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true }),
    viteReact(),
    Icons({ compiler: "jsx", jsx: "react" }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
