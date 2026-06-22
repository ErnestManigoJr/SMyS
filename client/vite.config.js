import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SMyS — See Myself',
        short_name: 'SMyS',
        description: 'Your digital presence. Live with someone.',
        theme_color: '#7c3aed',
        background_color: '#06030d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/smys-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/smys-icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: { port: 5173, host: true }
});
