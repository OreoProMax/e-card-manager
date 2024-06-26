import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import monkey, { cdn } from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "京东E卡管理器",
        namespace: "https://github.com/OreoProMax/e-card-manager",
        version: "1.0",
        description: "在京东下单页面快捷操作E卡",
        icon: "https://www.jd.com/favicon.ico",
        author: "OreoProMax",
        match: ["https://trade.jd.com/*"],
        updateURL:
          "https://raw.githubusercontent.com/OreoProMax/e-card-manager/master/dist/e-card-manager.min.user.js",
        downloadURL:
          "https://raw.githubusercontent.com/OreoProMax/e-card-manager/master/dist/e-card-manager.min.user.js",
        supportURL: "https://github.com/OreoProMax/e-card-manager/issues",
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr("Vue", "dist/vue.global.prod.js"),
        },
      },
    }),
  ],
  define: {
    __SCRIPT_TITLE__: JSON.stringify("京东E卡管理器"),
  },
  build: {
    minify: true,
  },
});
