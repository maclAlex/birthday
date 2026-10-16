import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repoName && repoName !== `${process.env.GITHUB_REPOSITORY_OWNER}.github.io`
  ? `/${repoName}/`
  : '/';

export default defineConfig({
  base,
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
