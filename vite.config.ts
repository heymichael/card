import fs from 'fs'
import path from 'path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const PLATFORM_PUBLIC = path.resolve(__dirname, '../haderach-platform/hosting/public')

function platformAuthDev(): Plugin {
  let env: Record<string, string> = {}

  return {
    name: 'platform-auth-dev',
    config(_, { mode }) {
      env = loadEnv(mode, process.cwd(), 'VITE_')
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__/firebase/init.json') {
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              apiKey: env.VITE_FIREBASE_API_KEY,
              authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
              projectId: env.VITE_FIREBASE_PROJECT_ID,
              appId: env.VITE_FIREBASE_APP_ID,
              storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
              messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
              measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
            }),
          )
          return
        }

        if (req.url?.startsWith('/assets/')) {
          const filePath = path.join(PLATFORM_PUBLIC, req.url)
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath)
            const mimeTypes: Record<string, string> = {
              '.svg': 'image/svg+xml',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.ico': 'image/x-icon',
              '.css': 'text/css',
              '.js': 'application/javascript',
            }
            if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext])
            res.end(fs.readFileSync(filePath))
            return
          }
        }

        const urlPath = req.url?.split('?')[0]
        if (urlPath === '/' || urlPath === '') {
          res.setHeader('Content-Type', 'text/html')
          res.end(fs.readFileSync(path.join(PLATFORM_PUBLIC, 'index.html'), 'utf-8'))
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/card/',
  build: { outDir: 'dist/card' },
  plugins: [platformAuthDev(), react()],
})
