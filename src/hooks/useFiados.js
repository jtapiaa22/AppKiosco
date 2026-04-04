import { useState, useEffect, useCallback } from 'react'
import { dbQuery, dbRun } from '@/services/database'

export function useFiados() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [soloConDeuda, setSoloConDeuda] = useState(false)

  const cargarClientes = useCallback(async () => {
    setCargando(true)
    try {
      let sql = `SELECT * FROM clientes WHERE activo = 1`
      const params = []
      if (filtro.trim()) {
        sql += ` AND (nombre LIKE ? OR telefono LIKE ?)`
        params.push(`%${filtro}%`, `%${filtro}%`)
      }
      if (soloConDeuda) sql += ` AND deuda_total > 0`
      sql += ` ORDER BY deuda_total DESC, nombre ASC`
      setClientes(await dbQuery(sql, params))
    } finally {
      setCargando(false)
    }
  }, [filtro, soloConDeuda])

  useEffect(() => {
    const t = setTimeout(cargarClientes, 200)
    return () => clearTimeout(t)
  }, [cargarClientes])

  /**
   * Historial de movimientos de un cliente.
   * - tipo 'deuda' = fiado generado al cobrar (tiene venta_id y productos)
   * - tipo 'abono' = pago registrado manualmente
   */
  async function cargarHistorial(clienteId) {
    const movimientos = await dbQuery(
      `SELECT f.*, v.vendido_en, v.tipo_pago
       FROM fiados f
       LEFT JOIN ventas v ON f.venta_id = v.id
       WHERE f.cliente_id = ?
       ORDER BY f.registrado_en DESC
       LIMIT 50`,
      [clienteId]
    )

    // Traer items para los movimientos tipo 'deuda' que tienen venta_id
    // La tabla se llama venta_items (ver useVenta.js)
    const ventaIds = movimientos
      .filter(m => m.tipo === 'deuda' && m.venta_id)
      .map(m => m.venta_id)

    if (ventaIds.length === 0) return movimientos

    const itemsPorVenta = {}
    await Promise.all(
      ventaIds.map(async (vid) => {
        const items = await dbQuery(
          `SELECT vi.cantidad, vi.precio_unitario, vi.subtotal,
                  p.nombre AS producto_nombre
           FROM venta_items vi
           LEFT JOIN productos p ON vi.producto_id = p.id
           WHERE vi.venta_id = ?
           ORDER BY vi.id ASC`,
          [vid]
        )
        itemsPorVenta[vid] = items
      })
    )

    return movimientos.map(m => ({
      ...m,
      items: m.venta_id ? (itemsPorVenta[m.venta_id] ?? []) : [],
    }))
  }

  async function registrarAbono(clienteId, monto, nota = '') {
    const cliente = clientes.find(c => c.id === clienteId)
    if (!cliente) return
    const montoReal = Math.min(parseFloat(monto), cliente.deuda_total)
    await dbRun(
      `INSERT INTO fiados (cliente_id, monto, tipo, nota) VALUES (?, ?, 'abono', ?)`,
      [clienteId, montoReal, nota || `Abono de $${montoReal.toLocaleString('es-AR')}`]
    )
    await dbRun(
      `UPDATE clientes SET deuda_total = MAX(0, deuda_total - ?) WHERE id = ?`,
      [montoReal, clienteId]
    )
    await cargarClientes()
    return montoReal
  }

  async function guardarCliente(datos, id = null) {
    if (id) {
      await dbRun(
        `UPDATE clientes SET nombre=?, telefono=?, notas=? WHERE id=?`,
        [datos.nombre, datos.telefono || null, datos.notas || null, id]
      )
    } else {
      await dbRun(
        `INSERT INTO clientes (nombre, telefono, notas) VALUES (?, ?, ?)`,
        [datos.nombre, datos.telefono || null, datos.notas || null]
      )
    }
    await cargarClientes()
  }

  async function eliminarCliente(id) {
    await dbRun(`UPDATE clientes SET activo=0 WHERE id=?`, [id])
    await cargarClientes()
  }

  const totalDeuda = clientes.reduce((s, c) => s + c.deuda_total, 0)

  return {
    clientes, cargando,
    filtro, setFiltro,
    soloConDeuda, setSoloConDeuda,
    cargarHistorial,
    registrarAbono,
    guardarCliente,
    eliminarCliente,
    totalDeuda,
    recargar: cargarClientes,
  }
}
