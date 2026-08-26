import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    dedupe: ["solid-js"],
    alias: {
      "@": fileURLToPath(new URL("../../src", import.meta.url)),
      "@artisansdk/architect": fileURLToPath(new URL("../../src", import.meta.url)),
      "solid-js": fileURLToPath(new URL("./node_modules/solid-js", import.meta.url)),
    },
  },
});
