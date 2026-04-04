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

  // Historial de movimientos de un cliente
  async function cargarHistorial(clienteId) {
    return dbQuery(
      `SELECT f.*, v.vendido_en, v.tipo_pago
       FROM fiados f
       LEFT JOIN ventas v ON f.venta_id = v.id
       WHERE f.cliente_id = ?
       ORDER BY f.registrado_en DESC
       LIMIT 50`,
      [clienteId]
    )
  }

  // Registrar un abono (parcial o total)
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

  // Guardar o actualizar cliente
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