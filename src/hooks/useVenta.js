import { useState } from 'react'
import { dbRun, dbQuery } from '@/services/database'
import { usePosStore } from '@/store/posStore'

export function useVenta() {
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const { carrito, clienteSeleccionado, getTotal, limpiarCarrito } = usePosStore()

  async function confirmarVenta({ tipoPago, montoEfectivo = 0, montoTransferencia = 0 }) {
    if (carrito.length === 0) return { ok: false, error: 'Carrito vacío' }
    const esFiado = tipoPago === 'fiado'
    if (esFiado && !clienteSeleccionado) return { ok: false, error: 'Seleccioná un cliente para fiado' }

    setProcesando(true)
    try {
      const total = getTotal()

      // 1. Insertar venta
      const venta = await dbRun(
        `INSERT INTO ventas (cliente_id, total, tipo_pago, monto_efectivo, monto_transferencia, es_fiado)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [clienteSeleccionado?.id ?? null, total, tipoPago, montoEfectivo, montoTransferencia, esFiado ? 1 : 0]
      )
      const ventaId = venta.lastInsertRowid

      // 2. Insertar items y descontar stock
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

      // 3. Registrar fiado si corresponde
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

      // 4. Actualizar caja abierta
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
