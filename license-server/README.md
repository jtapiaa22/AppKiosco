# KioscoApp — License Server

Servidor de validación de licencias para KioscoApp. Corre en Node.js con SQLite.

## Setup

```bash
cd license-server
npm install
```

## Arrancar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El servidor corre en `http://localhost:4000` por defecto.

## Variables de entorno

```env
PORT=4000
ADMIN_TOKEN=CAMBIAR_TOKEN_ADMIN_SECRETO
LICENSE_SERVER_URL=https://tu-dominio.com   # también en el .env de Electron
```

## Generar claves desde la terminal

```bash
# Clave básica (sin vencimiento)
node admin.js gen

# Con etiqueta
node admin.js gen --label "Kiosco Don Juan"

# Con etiqueta y fecha de vencimiento
node admin.js gen --label "Kiosco Don Juan" --expires 2026-12-31

# Ver todas las claves
node admin.js list

# Revocar una clave (la bloquea permanentemente)
node admin.js revoke XXXX-XXXX-XXXX-XXXX

# Reset: desvincular de una máquina (para reinstalaciones)
node admin.js reset XXXX-XXXX-XXXX-XXXX

# Ver detalle de una clave
node admin.js info XXXX-XXXX-XXXX-XXXX
```

## Cómo funciona la unicidad

1. Cada clave generada tiene formato `XXXX-XXXX-XXXX-XXXX` (chars sin ambigüedad: sin O, 0, I, 1)
2. Al **activar**, la clave se vincula al `machine_id` de la PC (hash SHA-256 del hardware)
3. Si alguien intenta usar la misma clave en **otra PC** → `reason: already_used`
4. Si la clave fue **revocada** → `reason: revoked`
5. Para mover una licencia a otra PC (reinstalación): `node admin.js reset <KEY>`

## Despliegue en Railway

1. Crear proyecto en [railway.app](https://railway.app)
2. Conectar este directorio como servicio Node.js
3. Configurar variable de entorno `ADMIN_TOKEN` con un valor secreto largo
4. En `electron/license.js`, cambiar `LICENSE_SERVER` por la URL que te da Railway
