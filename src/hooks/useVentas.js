/**
 * useVentas.js — Hook para cargar el historial de ventas con sus ítems.
 *
 * Permite filtrar por período y cargar los ítems de una venta individual
 * (detalle expandible en la tabla).
 */
import { useState, useEffect, useCallback } from 'react'
import { dbQuery } from '@/services/database'

export function useVentas(periodo = 'hoy') {
  const [ventas,   setVentas]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const filtro = periodo === 'hoy'
        ? `date(v.vendido_en) = date('now')`
        : periodo === 'semana'
          ? `v.vendido_en >= datetime('now', '-7 days')`
          : `v.vendido_en >= datetime('now', '-30 days')`

      const rows = await dbQuery(
        `SELECT
           v.id,
           v.total,
           v.tipo_pago,
           v.monto_efectivo,
           v.monto_transferencia,
           v.es_fiado,
           v.vendido_en,
           c.nombre AS cliente_nombre
         FROM ventas v
         LEFT JOIN clientes c ON c.id = v.cliente_id
         WHERE ${filtro}
         ORDER BY v.vendido_en DESC`,
        []
      )
      setVentas(rows)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [periodo])

  useEffect(() => { cargar() }, [cargar])

  // Carga ítems de una venta puntual
  async function cargarItems(ventaId) {
    try {
      return await dbQuery(
        `SELECT
           vi.cantidad,
           vi.precio_unitario,
           vi.subtotal,
           p.nombre AS producto_nombre
         FROM venta_items vi
         LEFT JOIN productos p ON p.id = vi.producto_id
         WHERE vi.venta_id = ?`,
        [ventaId]
      )
    } catch {
      return []
    }
  }

  return { ventas, cargando, error, recargar: cargar, cargarItems }
}
