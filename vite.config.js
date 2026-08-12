import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpg', 'SpiderMan_HeadTurn.png', 'spidey_head_spritesheet.png'],
      manifest: {
        name: 'Spidey Tracker',
        short_name: 'SpideyTracker',
        description: 'Track your focus and habits with a retro Spidey theme',
        theme_color: '#dc2626',
        background_color: '#1a4175', // Retro blue
        display: 'standalone',
        icons: [
          {
            src: '/logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
