# KioscoApp

Sistema de gestión de kiosco — stock, ventas, fiados y reportes.

## Instalación y desarrollo

```bash
npm install
npm run dev           # Vite + Electron en paralelo
npm run dev:react     # Solo React (sin Electron, para probar UI)
npm run build:linux   # Genera AppImage y .deb
npm run build:win     # Genera .exe (desde Linux requiere wine o Docker)
```

## Stack técnico
- **Electron 29** — app de escritorio multiplataforma
- **React 18 + Vite 5** — UI
- **SQLite (better-sqlite3)** — base de datos local, sin servidor
- **Zustand** — estado global
- **Tailwind CSS** — estilos
- **Open Food Facts API** — datos de productos por código de barras

## Estructura de carpetas

```
kiosco-app/
├── electron/          # Proceso main de Electron (Node.js)
│   ├── main.js        # Ventana + IPC handlers
│   ├── preload.js     # Bridge seguro renderer ↔ main
│   ├── database.js    # SQLite singleton + migraciones
│   └── license.js     # Validación de licencia online/offline
├── src/               # React (renderer)
│   ├── pages/         # Una página por módulo
│   ├── components/    # Componentes reutilizables por módulo
│   ├── services/      # DB wrapper, barcode, licencia
│   ├── store/         # Zustand stores
│   └── hooks/         # Custom hooks
├── database/
│   └── migrations/    # Archivos SQL en orden numérico
└── docs/
```

## Módulos planificados

1. **POS / Venta** — escáner, carrito, cobro (efectivo / transferencia / fiado)
2. **Stock** — ABM de productos, alertas de mínimo
3. **Fiados** — clientes, deudas, abonos
4. **Clientes** — base de datos de clientes con fiado
5. **Reportes** — ventas del día, rentabilidad, fiados pendientes
6. **Licencia** — activación y validación mensual

## Notas para desarrollo en Linux

La app corre igual en Linux. Para testear el build de Windows desde Linux:

```bash
# Opción 1: Docker (recomendado)
docker run --rm -v $(pwd):/project electronuserland/builder:wine \
  sh -c "cd /project && npm run build:win"

# Opción 2: wine instalado localmente
npm run build:win
```
