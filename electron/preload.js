const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Base de datos
  dbQuery: (sql, params)  => ipcRenderer.invoke('db:query', sql, params),
  dbRun:   (sql, params)  => ipcRenderer.invoke('db:run',   sql, params),

  // Licencia
  validateLicense:  ()      => ipcRenderer.invoke('license:validate'),
  activateLicense:  (key)   => ipcRenderer.invoke('license:activate', key),
  getMachineId:     ()      => ipcRenderer.invoke('license:getMachineId'),

  // App
  getVersion: () => ipcRenderer.invoke('app:version'),

  // Servidor móvil (ngrok o LAN)
  getApiUrl:      () => ipcRenderer.invoke('api:getUrl'),
  getNgrokStatus: () => ipcRenderer.invoke('api:getNgrokStatus'),

  // Backup
  backupRun:  () => ipcRenderer.invoke('backup:run'),
  backupList: () => ipcRenderer.invoke('backup:list'),

  // Exportar reportes (CSV / PDF)
  // buffer: number[]  — Array.from(Uint8Array) serializable por IPC
  // nombre: string    — nombre de archivo sugerido, ej: 'reporte-2026-04-06.pdf'
  guardarArchivo: (nombre, buffer) =>
    ipcRenderer.invoke('export:guardarArchivo', nombre, buffer),
})
