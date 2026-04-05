# 🏪 KioscoApp

Sistema de gestión para kioscos. Aplicación de escritorio construida con **Electron + React + Vite + Tailwind CSS + SQLite**.

## Funcionalidades

- **POS** — Punto de venta con búsqueda de productos y escaner de código de barras
- **Stock** — Gestión de inventario (alta, baja, modificación de productos)
- **Fiados** — Registro de ventas a crédito por cliente
- **Clientes** — ABM de clientes
- **Reportes** — Reportes de ventas y movimientos
- **Licencias** — Sistema de activación con servidor propio

## Tecnologías

| Capa | Tecnología |
|---|---|
| Shell de escritorio | Electron 29 |
| UI | React 18 + Vite 5 |
| Estilos | Tailwind CSS 3 |
| Estado global | Zustand 4 |
| Base de datos | SQLite vía better-sqlite3 |
| Rutas | React Router DOM 6 (HashRouter) |
| Notificaciones | react-hot-toast |
| Escaner | Quagga (códigos de barra por cámara) |

## Estructura del proyecto

```
AppKiosco/
├── electron/          # Proceso principal de Electron (main, preload, IPC, license, DB)
├── src/
│   ├── components/    # Componentes UI organizados por módulo (pos, stock, fiados, shared…)
│   ├── pages/         # Una page por sección (POS, Stock, Fiados, Clientes, Reportes, Licencia)
│   ├── services/      # Capa de datos (database.js, license.js, barcode.js)
│   └── store/         # Estado global con Zustand (posStore.js)
├── database/          # Archivos de base de datos SQLite y migraciones
├── scripts/           # Scripts de migración y seed
├── license-server/    # Servidor de activación de licencias
├── docs/              # Documentación adicional
└── package.json
```

## Instalación y uso

### Requisitos previos

- Node.js 18 o superior
- npm 9 o superior

### Instalar dependencias

```bash
npm install
```

### Inicializar la base de datos

```bash
npm run db:migrate   # Crea las tablas
npm run db:seed      # Carga datos de ejemplo (opcional)
```

### Modo desarrollo

Levantar React + Electron juntos:

```bash
npm run electron
```

O por separado:

```bash
# Terminal 1 — servidor Vite
npm run dev:react

# Terminal 2 — Electron (espera a que Vite esté listo)
npm run dev:electron
```

Solo la UI en el navegador (sin Electron):

```bash
npm run dev
```

### Build de producción

```bash
npm run build          # Detecta plataforma actual
npm run build:linux    # AppImage + .deb
npm run build:win      # Instalador NSIS (.exe)
```

El instalador se genera en `dist-electron/`.

## Notas de desarrollo

- Se usa `HashRouter` (no `BrowserRouter`) porque Electron carga archivos locales sin servidor HTTP.
- La comunicación entre el renderer (React) y el proceso principal (Electron) se hace vía IPC usando `window.electronAPI` y `window.api`, expuestos por `electron/preload.js`.
- En modo dev web puro (sin Electron), `database.js` y `license.js` activan mocks automáticamente para no bloquear el desarrollo.
- El alias `@/` apunta a `src/` (configurado en `vite.config.js`).
