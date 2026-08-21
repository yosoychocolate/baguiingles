import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleChat } from './server/chat.ts'

function mayaApi(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url || ''
    if (!url.startsWith('/api/chat')) {
      next()
      return
    }
    void handleChat(req, res)
  }

  return {
    name: 'maya-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

function githubPages(): Plugin {
  return {
    name: 'maya-github-pages',
    writeBundle() {
      const index = resolve('docs/index.html')
      try {
        copyFileSync(index, resolve('docs/404.html'))
      } catch {
        /* build folder still empty */
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GROQ_API_KEY ||= env.GROQ_API_KEY || ''
  process.env.GEMINI_API_KEY ||= env.GEMINI_API_KEY || ''
  process.env.OPENAI_API_KEY ||= env.OPENAI_API_KEY || ''

  return {
    base: './',
    plugins: [react(), mayaApi(), githubPages()],
    build: {
      outDir: 'docs',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      open: true,
    },
  }
})
