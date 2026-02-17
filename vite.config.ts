import { defineConfig, mergeConfig } from 'vite';
import { baseConfig } from '../vite.config.base';
import { resolve } from 'path';

export default defineConfig(
  mergeConfig(baseConfig, {
    build: {
      minify: false,
      lib: {
        entry: resolve(__dirname, 'ts/movie_event.ts'),
        fileName: 'index',
        formats: ['es']
      },
      outDir: './movie.ts/public/lib/movie'
    }
  })
);