import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [glsl()],
  build: {
    outDir: "docs", // ビルド出力をdocsディレクトリに変更
  },
});
