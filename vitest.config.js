import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/test/**/*.{test,spec}.js'],
    setupFiles: ['./src/test/setup/vitest.setup.js'],
  },
})
