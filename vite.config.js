import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Monpro',
        short_name: 'Monpro',
        description: 'Gestor personal de proyectos de software',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  preview: {
    // Permite que el servidor escuche en 0.0.0.0 (accesible por Render)
    host: true, 
    // Lista de hosts permitidos (incluye el dominio público de Render)
    allowedHosts: [
      'monpro.onrender.com'
    ],
    // Usamos el puerto por defecto de preview o el proporcionado por la variable de entorno
    port: process.env.PORT || 4173, 
  }
})
