// Bridge seguro entre React (renderer) y Electron (main process)
// contextIsolation=true: el renderer NO tiene acceso a Node.js directo
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    run:   (sql, params) => ipcRenderer.invoke('db:run',   sql, params),
  },
  license: {
    validate:     ()    => ipcRenderer.invoke('license:validate'),
    activate:     (key) => ipcRenderer.invoke('license:activate', key),
    getMachineId: ()    => ipcRenderer.invoke('license:getMachineId'),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
  },
})
