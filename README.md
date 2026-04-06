# 🏪 AppKiosco

App de escritorio para la gestión integral de kioscos. Construida con **Electron + React + Vite + Tailwind + SQLite**.

---

## ✨ Módulos

| Módulo | Descripción |
|---|---|
| **POS** | Punto de venta con búsqueda por nombre o código de barras |
| **Stock** | Gestión de productos, precios y cantidades |
| **Caja** | Apertura y cierre de caja diaria |
| **Fiados** | Control de deudas y abonos por cliente |
| **Clientes** | ABM de clientes |
| **Reportes** | Ventas del día / semana / mes, top productos, alertas de stock |
| **Licencia** | Activación y validación contra servidor propio |

---

## 🚀 Instalación y desarrollo

### Prerrequisitos

- Node.js 18+
- npm 9+

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/jtapiaa22/AppKiosco.git
cd AppKiosco
npm install
```

### 2. Crear la base de datos local

```bash
npm run db:migrate
# Opcional: cargar datos de prueba
npm run db:seed
```

### 3. Levantar en modo desarrollo

```bash
# Inicia Vite + Electron en paralelo
npm run dev:electron
```

### 4. Solo la UI (sin Electron)

```bash
npm run dev:react
```

---

## 📦 Build para distribución

```bash
# Linux (.deb / .AppImage)
npm run build:linux

# Windows (.exe instalador)
npm run build:win
```

El instalador generado queda en `dist/`.

---

## 🔑 Servidor de licencias

El servidor de licencias es una API Express independiente que valida y activa claves.

### Setup local

```bash
cd license-server
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env y setear ADMIN_TOKEN con un valor secreto real

# Iniciar en desarrollo
npm run dev
```

### Comandos admin

```bash
# Generar nueva clave de licencia
npm run gen

# Listar todas las licencias
npm run list

# Revocar una clave
npm run revoke <KEY>
```

### Deploy en producción (Railway / Render)

1. Crear un nuevo proyecto en [Railway](https://railway.app) o [Render](https://render.com)
2. Conectar el repo y apuntar al directorio `license-server/`
3. Configurar las variables de entorno:
   - `ADMIN_TOKEN` — generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `NODE_ENV=production`
4. Una vez deployado, actualizar `LICENSE_SERVER_URL` en `electron/license.js` con la URL del servidor

---

## 🗂️ Estructura del proyecto

```
AppKiosco/
├── electron/               ← proceso principal de Electron
│   ├── main.js             ← ventana + IPC handlers
│   ├── preload.js          ← bridge seguro al renderer
│   └── license.js          ← validación/activación de licencias
├── src/                    ← UI React
│   ├── components/         ← componentes por módulo
│   ├── hooks/              ← hooks personalizados
│   ├── pages/              ← una page por módulo
│   ├── services/           ← acceso a datos (database.js, etc.)
│   └── store/              ← estado global con Zustand
├── database/               ← migraciones SQL
├── license-server/         ← servidor Express de licencias
└── package.json
```

---

## 🔒 Seguridad

- La base de datos de la app (`kiosco.db`) **nunca se sube al repo** (`.gitignore`)
- La base de datos de licencias (`licenses.db`) **nunca se sube al repo**
- El `ADMIN_TOKEN` se configura mediante variables de entorno, nunca hardcodeado
- El `machine_id` se deriva de la MAC address del hardware (estable, no manipulable)
- La encryption key del store local se deriva dinámicamente del `machine_id`
- El servidor tiene rate limiting: 15 intentos/15min en validación, 5/15min en activación

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados © 2026 Jorge Alejandro Tapia Ahumada.
