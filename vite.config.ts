import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiKey =
      env.GEMINI_API_KEY ||
      env.API_KEY ||
      env.GOOGLE_API_KEY ||
      env.GOOGLE_GEMINI_API_KEY ||
      env.VITE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      '';
    const mapsKey =
      env.GOOGLE_MAPS_API_KEY ||
      env.MAPS_API_KEY ||
      env.GOOGLE_MAP_API_KEY ||
      env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.MAPS_API_KEY ||
      process.env.GOOGLE_MAP_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      '';
    const repoFromEnv = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
    const base = process.env.BASE_URL || (repoFromEnv
      ? (repoFromEnv.endsWith('.github.io') ? '/' : `/${repoFromEnv}/`)
      : './');

    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [tailwindcss(), react()],
      define: {
        'global': 'window',
        'process.env': JSON.stringify({
          NODE_ENV: mode,
          API_KEY: geminiKey,
          GEMINI_API_KEY: geminiKey,
          GOOGLE_MAPS_API_KEY: mapsKey
        }),
        'process.env.API_KEY': JSON.stringify(geminiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.GOOGLE_MAPS_API_KEY': JSON.stringify(mapsKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
        'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(mapsKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
