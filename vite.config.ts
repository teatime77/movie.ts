import { defineConfig, mergeConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { baseConfig } from '../vite.config.base';
import { resolve } from 'path';

export default defineConfig(
  mergeConfig(baseConfig, {
    plugins: [tsconfigPaths()],
    build: {
      minify: false,
      lib: {
        entry: resolve(__dirname, 'ts/movie_event.ts'),
        fileName: 'movie',
        formats: ['es']
      },
      outDir: '../dist'
    }
  })
);