import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const showFile = path.join(root, 'show.json')

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 1_000_000) {
        reject(Object.assign(new Error('Show file is too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, body) {
  const payload = Buffer.from(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Length', payload.length)
  res.end(payload)
}

function showMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method === 'GET') {
    fs.readFile(showFile, 'utf8', (error, text) => {
      if (error) {
        sendJson(res, 500, JSON.stringify({ error: 'Could not read show.json' }))
        return
      }
      sendJson(res, 200, text)
    })
    return
  }

  if (req.method === 'PUT') {
    readBody(req)
      .then((raw) => {
        const data = JSON.parse(raw)
        const text = `${JSON.stringify(data, null, 2)}\n`
        const tmp = `${showFile}.tmp`
        fs.writeFileSync(tmp, text)
        fs.renameSync(tmp, showFile)
        sendJson(res, 200, text)
      })
      .catch((error) => {
        const status = error.status ?? (error instanceof SyntaxError ? 400 : 500)
        sendJson(res, status, JSON.stringify({ error: error.message || 'Could not write show.json' }))
      })
    return
  }

  if (req.method === 'HEAD') {
    next()
    return
  }

  res.statusCode = 405
  res.end()
}

function showFileApi() {
  return {
    name: 'show-file-api',
    configureServer(server) {
      server.middlewares.use('/api/show', showMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/show', showMiddleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), showFileApi()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
  },
})
