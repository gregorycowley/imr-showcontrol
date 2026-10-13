// Serves the built interface and the show file on 127.0.0.1.
// Used by the packaged app so students can open it without running a server.

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const EMPTY_SHOW = {
  cast: [],
  score: {
    regions: Array.from({ length: 10 }, (_, index) => ({ region: index + 1, spans: [] })),
  },
  playhead: 1,
}

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
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Content-Length': payload.length,
  })
  res.end(payload)
}

function ensureShow(showFile) {
  if (fs.existsSync(showFile)) return
  fs.mkdirSync(path.dirname(showFile), { recursive: true })
  fs.writeFileSync(showFile, `${JSON.stringify(EMPTY_SHOW, null, 2)}\n`)
}

function handleShow(req, res, showFile) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    fs.readFile(showFile, 'utf8', (error, text) => {
      if (error) {
        sendJson(res, 500, JSON.stringify({ error: 'Could not read show.json' }))
        return
      }
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        res.end()
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

  res.writeHead(405)
  res.end()
}

function sendFile(res, file) {
  const type = TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
}

function startLocalServer({ uiDir, showFile }) {
  ensureShow(showFile)
  const root = path.resolve(uiDir)

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    if (url.pathname === '/api/show') {
      handleShow(req, res, showFile)
      return
    }

    const requested = path.resolve(root, `.${decodeURIComponent(url.pathname)}`)
    const inside = requested === root || requested.startsWith(`${root}${path.sep}`)
    if (!inside) {
      res.writeHead(403)
      res.end()
      return
    }

    let file = requested
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(root, 'index.html')
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404)
      res.end('Interface is not built')
      return
    }
    sendFile(res, file)
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, url: `http://127.0.0.1:${port}/` })
    })
  })
}

module.exports = { startLocalServer }
