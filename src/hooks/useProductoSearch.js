import { useState, useCallback } from 'react'
import { dbQuery } from '@/services/database'
import { lookupBarcode } from '@/services/barcode'

export function useProductoSearch() {
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const buscarPorTexto = useCallback(async (texto) => {
    if (!texto || texto.trim().length < 2) { setResultados([]); return }
    setCargando(true)
    setError(null)
    try {
      const rows = await dbQuery(
        `SELECT * FROM productos
         WHERE activo = 1
           AND (nombre LIKE ? OR codigo_barras LIKE ?)
         ORDER BY nombre ASC
         LIMIT 20`,
        [`%${texto}%`, `%${texto}%`]
      )
      setResultados(rows)
    } catch (e) {
      setError('Error al buscar productos')
    } finally {
      setCargando(false)
    }
  }, [])

  // Buscar por código de barras: primero en DB local, luego Open Food Facts
  const buscarPorCodigo = useCallback(async (codigo) => {
    setCargando(true)
    setError(null)
    try {
      // 1. Buscar en base de datos local
      const local = await dbQuery(
        'SELECT * FROM productos WHERE codigo_barras = ? AND activo = 1 LIMIT 1',
        [codigo]
      )
      if (local.length > 0) {
        setCargando(false)
        return { producto: local[0], fuente: 'local' }
      }

      // 2. Consultar Open Food Facts
      const remoto = await lookupBarcode(codigo)
      setCargando(false)
      if (remoto) return { producto: remoto, fuente: 'remoto', nuevo: true }

      return { producto: null, fuente: null }
    } catch (e) {
      setError('Error al buscar por código')
      setCargando(false)
      return { producto: null, fuente: null }
    }
  }, [])

  const limpiar = () => setResultados([])

  return { resultados, cargando, error, buscarPorTexto, buscarPorCodigo, limpiar }
}
