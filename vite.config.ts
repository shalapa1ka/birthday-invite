import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// `base: './'` makes every asset URL relative, so the build works both at
// https://USERNAME.github.io/REPOSITORY_NAME/ and on a custom (root) domain
// without knowing the repository name in advance.
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  // Allow testing on a phone through an ngrok tunnel (any *.ngrok-free.app subdomain).
  server: { allowedHosts: ['.ngrok-free.app'] },
  preview: { allowedHosts: ['.ngrok-free.app'] },
})
