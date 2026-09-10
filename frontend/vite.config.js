import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

// Local-dev-only HTTPS cert. Only used for `vite dev`, and only if the
// files exist — keeps `vite build` (e.g. in a Docker/production build,
// where these gitignored files never exist) from crashing.
const keyPath = path.resolve(__dirname, '../key.pem')
const certPath = path.resolve(__dirname, '../cert.pem')
const hasLocalCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    host: true,
    https:
      command === 'serve' && hasLocalCerts
        ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
        : undefined,
  },
}))
