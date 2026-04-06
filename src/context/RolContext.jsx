/**
 * RolContext.jsx — DEPRECADO
 * Reemplazado por AccesoContext.jsx.
 * Este archivo es un stub vacío para evitar errores de importación
 * en archivos que aún no fueron migrados. Puede borrarse cuando no
 * haya ningún import de este módulo en el proyecto.
 */
export function RolProvider({ children }) { return children }
export function useRol() {
  return { rol: null, hayPin: false, cargando: false, setRol: () => {}, cerrarSesion: () => {} }
}
