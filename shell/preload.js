// Preload for the address window only. The interface itself gets no preload.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('shellAddress', {
  save: (url) => ipcRenderer.send('address:save', url),
  cancel: () => ipcRenderer.send('address:cancel'),
})
