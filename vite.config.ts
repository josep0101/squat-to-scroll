import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // For GitHub Pages - change 'squat-to-scroll' to your repo name if different
    base: process.env.GITHUB_PAGES ? '/squat-to-scroll/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/@mediapipe/pose/*',
            dest: '.'
          }
        ]
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
