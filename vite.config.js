import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        area: resolve(__dirname, 'area.html'),
        point_detail: resolve(__dirname, 'point-detail.html'),
        overview_map: resolve(__dirname, 'overview-map.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});