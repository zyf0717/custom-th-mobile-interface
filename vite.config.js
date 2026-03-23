import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Use relative asset paths so deployments work on both custom domains and repo subpaths.
  base: './',
})
