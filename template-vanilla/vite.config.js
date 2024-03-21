// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  build: {
    cssCodeSplit: true, // 是否提取所有CSS到一个CSS文件中, introduct: https://cn.vitejs.dev/config/build-options.html#build-csscodesplit
  },
});
