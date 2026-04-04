const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // DB
  dbQuery: (sql, params)  => ipcRenderer.invoke('db:query', sql, params),
  dbRun:   (sql, params)  => ipcRenderer.invoke('db:run',   sql, params),

  // Licencia
  validateLicense:  ()      => ipcRenderer.invoke('license:validate'),
  activateLicense:  (key)   => ipcRenderer.invoke('license:activate', key),
  getMachineId:     ()      => ipcRenderer.invoke('license:getMachineId'),

  // App
  getVersion: () => ipcRenderer.invoke('app:version'),

  // Servidor móvil
  getApiUrl:       () => ipcRenderer.invoke('api:getUrl'),
  getNgrokStatus:  () => ipcRenderer.invoke('api:getNgrokStatus'),
})
