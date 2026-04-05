import { useState } from 'react'
import { dbRun, dbQuery, ahoraLocal } from '@/services/database'
import { usePosStore } from '@/store/posStore'

export function useVenta() {
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado]   = useState(null)
  const { carrito, clienteSeleccionado, getTotal, limpiarCarrito } = usePosStore()

  async function confirmarVenta({
    tipoPago,
    montoEfectivo       = 0,
    montoTransferencia  = 0,
    nombreTransferente  = null,
  }) {
    if (carrito.length === 0) return { ok: false, error: 'Carrito vacío' }
    const esFiado = tipoPago === 'fiado'
    if (esFiado && !clienteSeleccionado) return { ok: false, error: 'Seleccioná un cliente para fiado' }

    setProcesando(true)
    try {
      const total = getTotal()
      const ahora = ahoraLocal()   // ← hora local AR, no UTC

      await dbRun(
        `CREATE TABLE IF NOT EXISTS ventas_transferentes (
           venta_id         INTEGER PRIMARY KEY,
           nombre_transferente TEXT NOT NULL
         )`
      ).catch(() => {})

      // Pasamos vendido_en explícitamente con la hora local
      // para evitar que SQLite use DEFAULT datetime('now') en UTC
      const venta = await dbRun(
        `INSERT INTO ventas (cliente_id, total, tipo_pago, monto_efectivo, monto_transferencia, es_fiado, vendido_en)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [clienteSeleccionado?.id ?? null, total, tipoPago, montoEfectivo, montoTransferencia, esFiado ? 1 : 0, ahora]
      )
      const ventaId = venta.lastInsertRowid

      if (nombreTransferente && (tipoPago === 'transferencia' || tipoPago === 'combinado')) {
        await dbRun(
          `INSERT OR REPLACE INTO ventas_transferentes (venta_id, nombre_transferente) VALUES (?, ?)`,
          [ventaId, nombreTransferente]
        )
      }

      for (const item of carrito) {
        await dbRun(
          `INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [ventaId, item.id, item.cantidad, item.precio_venta, item.precio_venta * item.cantidad]
        )
        await dbRun(
          'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
          [item.cantidad, item.id]
        )
      }

      if (esFiado) {
        await dbRun(
          `INSERT INTO fiados (cliente_id, venta_id, monto, tipo, nota)
           VALUES (?, ?, ?, 'deuda', ?)`,
          [clienteSeleccionado.id, ventaId, total, `Venta #${ventaId}`]
        )
        await dbRun(
          'UPDATE clientes SET deuda_total = deuda_total + ? WHERE id = ?',
          [total, clienteSeleccionado.id]
        )
      }

      await dbRun(
        `UPDATE cajas SET
           total_efectivo       = total_efectivo + ?,
           total_transferencias = total_transferencias + ?,
           total_fiados         = total_fiados + ?,
           cant_ventas          = cant_ventas + 1
         WHERE estado = 'abierta'`,
        [montoEfectivo, montoTransferencia, esFiado ? total : 0]
      )

      limpiarCarrito()
      const res = { ok: true, ventaId, total }
      setResultado(res)
      return res
    } catch (e) {
      const err = { ok: false, error: e.message || 'Error al procesar venta' }
      setResultado(err)
      return err
    } finally {
      setProcesando(false)
    }
  }

  return { confirmarVenta, procesando, resultado }
}
