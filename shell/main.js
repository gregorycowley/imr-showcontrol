// Show Control shell.
//
// A window that loads the Show Control interface from a server. The shell has
// no interface of its own: update the web app on the server and every shell
// picks it up on reload. Settings live in the user's data folder so a packaged
// shell can be pointed at a different server without rebuilding.

const { app, BrowserWindow, Menu, dialog, ipcMain, net, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { startLocalServer } = require('./local.js')

const bundledConfig = readJson(path.join(__dirname, 'config.json')) ?? {}
const userDir = app.getPath('userData')
const settingsPath = path.join(userDir, 'settings.json')
const windowStatePath = path.join(userDir, 'window.json')

let win = null
let addressWin = null
let pollTimer = null
let localServer = null
let settings = null

const kiosk = process.argv.includes('--kiosk')

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

// Reads KEY=value lines from the project .env when the shell runs from the
// repo (shell/ sits next to .env). A packaged app has no .env and skips this.
function readDotEnv() {
  const file = path.join(__dirname, '..', '.env')
  if (app.isPackaged || !fs.existsSync(file)) return {}
  const values = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (!match || line.trim().startsWith('#')) continue
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return values
}

function uiDir() {
  return path.join(__dirname, 'ui')
}

function hasBundledUi() {
  return fs.existsSync(path.join(uiDir(), 'index.html'))
}

// A packaged app opens the interface that was built into it. A server address
// is used only when one is given (--url, SHOWCONTROL_URL, .env, or the menu).
// Running from the repo keeps the old default: the dev server in config.json.
function loadSettings() {
  const saved = readJson(settingsPath) ?? {}
  const dotEnv = readDotEnv()
  const flag = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6)
  const envUrl = process.env.SHOWCONTROL_URL || dotEnv.SHOWCONTROL_URL
  const pollMs = Number(saved.pollMs ?? bundledConfig.pollMs) || 2000

  if (flag) return { mode: 'server', url: normalizeUrl(flag), pollMs }
  if (process.argv.includes('--bundled') && hasBundledUi()) return { mode: 'bundled', url: '', pollMs }
  if (envUrl) return { mode: 'server', url: normalizeUrl(envUrl), pollMs }
  if (saved.mode === 'server' && saved.url) return { mode: 'server', url: normalizeUrl(saved.url), pollMs }
  if (app.isPackaged && hasBundledUi()) return { mode: 'bundled', url: '', pollMs }
  return { mode: 'server', url: normalizeUrl(saved.url || bundledConfig.url), pollMs }
}

function sourceLabel() {
  return settings.mode === 'bundled' ? 'the built-in interface' : settings.url
}

function normalizeUrl(value) {
  let text = String(value ?? '').trim()
  if (!text) return 'http://127.0.0.1:5173/'
  if (!/^https?:\/\//i.test(text)) text = `http://${text}`
  try {
    return new URL(text).toString()
  } catch {
    return 'http://127.0.0.1:5173/'
  }
}

function saveSettings() {
  writeJson(settingsPath, settings)
}

// Server check: a HEAD request that answers at all means the server is up.
function serverReachable(url) {
  return net
    .fetch(url, { method: 'HEAD', cache: 'no-store' })
    .then(() => true)
    .catch(() => false)
}

function waitingPage() {
  const file = path.join(__dirname, 'pages', 'waiting.html')
  return `file://${file}?target=${encodeURIComponent(settings.url)}`
}

function stopPolling() {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
}

async function bundledUrl() {
  if (!localServer) {
    localServer = await startLocalServer({
      uiDir: uiDir(),
      showFile: path.join(app.getPath('userData'), 'show.json'),
    })
  }
  return localServer.url
}

// Built-in interface loads immediately. A server address waits until it answers.
async function connect() {
  stopPolling()
  buildMenu()
  if (!win) return
  if (settings.mode === 'bundled') {
    win.setTitle('Show Control')
    win.loadURL(await bundledUrl())
    return
  }
  win.setTitle(`Show Control — ${settings.url}`)
  if (await serverReachable(settings.url)) {
    win.loadURL(settings.url)
    return
  }
  win.loadURL(waitingPage())
  const poll = async () => {
    if (!win) return
    if (await serverReachable(settings.url)) {
      pollTimer = null
      win.loadURL(settings.url)
      return
    }
    pollTimer = setTimeout(poll, settings.pollMs)
  }
  pollTimer = setTimeout(poll, settings.pollMs)
}

function createWindow() {
  const state = readJson(windowStatePath) ?? {}
  win = new BrowserWindow({
    width: state.width ?? 1600,
    height: state.height ?? 900,
    x: state.x,
    y: state.y,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#ffffff',
    title: 'Show Control',
    kiosk,
    fullscreen: kiosk || state.fullscreen === true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // SHOWCONTROL_SMOKE=1: report what loaded and quit. Used to check the shell
  // from a terminal without a person watching the window.
  if (process.env.SHOWCONTROL_SMOKE) {
    win.webContents.on('did-finish-load', () => {
      const url = win.webContents.getURL()
      win.webContents
        .executeJavaScript('document.title')
        .then((title) => {
          process.stdout.write(`loaded ${url} title="${title}"\n`)
          app.quit()
        })
    })
  }

  // If a remote server drops while the page is open, fall back to the waiting page.
  win.webContents.on('did-fail-load', (_event, code, _description, url, isMainFrame) => {
    if (!isMainFrame || code === -3 /* aborted */) return
    if (settings.mode === 'bundled') return
    if (url.startsWith('file://')) return
    connect()
  })

  // Keep the interface inside the shell; open other links in the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  const saveState = () => {
    if (!win || win.isDestroyed() || kiosk) return
    writeJson(windowStatePath, { ...win.getNormalBounds(), fullscreen: win.isFullScreen() })
  }
  win.on('resize', saveState)
  win.on('move', saveState)
  win.on('enter-full-screen', saveState)
  win.on('leave-full-screen', saveState)
  win.on('closed', () => {
    stopPolling()
    win = null
  })

  connect()
}

function openAddressWindow() {
  if (addressWin) {
    addressWin.focus()
    return
  }
  addressWin = new BrowserWindow({
    width: 480,
    height: 220,
    parent: win ?? undefined,
    modal: Boolean(win),
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Server address',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  addressWin.setMenu(null)
  addressWin.loadFile(path.join(__dirname, 'pages', 'address.html'), {
    query: { url: settings.url },
  })
  addressWin.on('closed', () => {
    addressWin = null
  })
}

ipcMain.on('address:save', (_event, url) => {
  settings = { ...settings, mode: 'server', url: normalizeUrl(url) }
  saveSettings()
  if (addressWin) addressWin.close()
  connect()
})

function useBundled() {
  settings = { ...settings, mode: 'bundled', url: '' }
  saveSettings()
  connect()
}

ipcMain.on('address:cancel', () => {
  if (addressWin) addressWin.close()
})

function buildMenu() {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'Server',
      submenu: [
        {
          label: 'Reload Interface',
          accelerator: 'CmdOrCtrl+R',
          click: () => connect(),
        },
        {
          label: 'Reload Ignoring Cache',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (!win) return
            if (win.webContents.getURL().startsWith('file://')) connect()
            else win.webContents.reloadIgnoringCache()
          },
        },
        { type: 'separator' },
        {
          label: 'Change Server Address…',
          accelerator: 'CmdOrCtrl+L',
          click: () => openAddressWindow(),
        },
        {
          label: 'Use Built-in Interface',
          enabled: hasBundledUi(),
          click: () => useBundled(),
        },
        {
          label: 'Open Server in Browser',
          enabled: settings.mode === 'server',
          click: () => shell.openExternal(settings.url),
        },
        { type: 'separator' },
        {
          label: 'Show Settings File',
          click: () => {
            if (!fs.existsSync(settingsPath)) saveSettings()
            shell.showItemInFolder(settingsPath)
          },
        },
        ...(isMac ? [] : [{ type: 'separator' }, { role: 'quit' }]),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, ...(isMac ? [{ role: 'front' }] : [{ role: 'close' }])],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About the Shell',
          click: () =>
            dialog.showMessageBox({
              type: 'info',
              title: 'Show Control shell',
              message: 'Show Control shell',
              detail: `This copy shows ${sourceLabel()}.\n\nThe downloaded app includes the interface. Server > Change Server Address… points it at a classroom server instead, and the show is saved on this computer.`,
            }),
        },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  settings = loadSettings()
  buildMenu()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
