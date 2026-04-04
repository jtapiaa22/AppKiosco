import { useState, useEffect, useCallback } from 'react'
import { dbQuery } from '@/services/database'

export function useReportes() {
  const [periodo, setPeriodo] = useState('hoy') // 'hoy' | 'semana' | 'mes'
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const filtroFecha = {
        hoy:    `date(vendido_en) = date('now')`,
        semana: `date(vendido_en) >= date('now', '-7 days')`,
        mes:    `date(vendido_en) >= date('now', '-30 days')`,
      }[periodo]

      // Totales generales del período
      const [resumen] = await dbQuery(
        `SELECT
           COUNT(*)                                    AS cant_ventas,
           COALESCE(SUM(total), 0)                    AS total_vendido,
           COALESCE(SUM(monto_efectivo), 0)           AS total_efectivo,
           COALESCE(SUM(monto_transferencia), 0)      AS total_transferencia,
           COALESCE(SUM(CASE WHEN es_fiado=1 THEN total ELSE 0 END), 0) AS total_fiado
         FROM ventas WHERE ${filtroFecha}`
      )

      // Ventas por día (últimos 7 o 30 días según período)
      const ventasPorDia = await dbQuery(
        `SELECT
           date(vendido_en) AS fecha,
           COUNT(*)          AS cant,
           SUM(total)        AS total
         FROM ventas
         WHERE ${filtroFecha}
         GROUP BY date(vendido_en)
         ORDER BY fecha ASC`
      )

      // Top productos más vendidos
      const topProductos = await dbQuery(
        `SELECT
           p.nombre,
           p.foto_url,
           SUM(vi.cantidad)  AS unidades,
           SUM(vi.subtotal)  AS total,
           p.precio_costo,
           p.precio_venta
         FROM venta_items vi
         JOIN ventas v   ON vi.venta_id   = v.id
         JOIN productos p ON vi.producto_id = p.id
         WHERE ${filtroFecha.replace(/vendido_en/g, 'v.vendido_en')}
         GROUP BY vi.producto_id
         ORDER BY unidades DESC
         LIMIT 8`
      )

      // Deuda total de fiados pendientes
      const [fiados] = await dbQuery(
        `SELECT
           COUNT(*)              AS cant_clientes,
           COALESCE(SUM(deuda_total), 0) AS deuda_total
         FROM clientes WHERE activo=1 AND deuda_total > 0`
      )

      // Productos con stock bajo
      const stockBajo = await dbQuery(
        `SELECT nombre, stock_actual, stock_minimo
         FROM productos
         WHERE activo=1 AND stock_actual <= stock_minimo
         ORDER BY stock_actual ASC
         LIMIT 5`
      )

      // Rentabilidad por producto (margen)
      const rentabilidad = await dbQuery(
        `SELECT
           p.nombre,
           SUM(vi.cantidad)                              AS unidades,
           SUM(vi.subtotal)                              AS ingresos,
           SUM(vi.cantidad * p.precio_costo)             AS costos,
           SUM(vi.subtotal - vi.cantidad * p.precio_costo) AS ganancia
         FROM venta_items vi
         JOIN ventas v   ON vi.venta_id    = v.id
         JOIN productos p ON vi.producto_id = p.id
         WHERE ${filtroFecha.replace(/vendido_en/g, 'v.vendido_en')}
           AND p.precio_costo > 0
         GROUP BY vi.producto_id
         ORDER BY ganancia DESC
         LIMIT 5`
      )

      setDatos({ resumen, ventasPorDia, topProductos, fiados, stockBajo, rentabilidad })
    } finally {
      setCargando(false)
    }
  }, [periodo])

  useEffect(() => { cargar() }, [cargar])

  return { datos, cargando, periodo, setPeriodo, recargar: cargar }
}