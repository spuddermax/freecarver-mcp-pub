import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config({ path: './.env' })

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: process.env.USE_HTTPS === 'true' && process.env.API_SSL_KEY && process.env.API_SSL_CERT ? {
      key: fs.readFileSync(process.env.API_SSL_KEY),
      cert: fs.readFileSync(process.env.API_SSL_CERT),
    } : undefined,
    host: true // Allow connections from other devices
  },
  build: {
    sourcemap: false,
  },
});
