import { useState, useEffect, useCallback } from 'react'
import { dbQuery, dbRun } from '@/services/database'

export function useStock() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [soloStockBajo, setSoloStockBajo] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      let sql = `SELECT * FROM productos WHERE activo = 1`
      const params = []
      if (filtro.trim()) {
        sql += ` AND (nombre LIKE ? OR codigo_barras LIKE ? OR categoria LIKE ?)`
        params.push(`%${filtro}%`, `%${filtro}%`, `%${filtro}%`)
      }
      if (soloStockBajo) sql += ` AND stock_actual <= stock_minimo`
      sql += ` ORDER BY nombre ASC`
      const rows = await dbQuery(sql, params)
      setProductos(rows)
    } finally {
      setCargando(false)
    }
  }, [filtro, soloStockBajo])

  useEffect(() => {
    const t = setTimeout(cargar, 200)
    return () => clearTimeout(t)
  }, [cargar])

  async function guardarProducto(datos, id = null) {
    const params = [
      datos.codigo_barras || null,
      datos.nombre,
      datos.descripcion || '',
      datos.foto_url || '',
      parseFloat(datos.precio_costo) || 0,
      parseFloat(datos.precio_venta),
      parseInt(datos.stock_actual) || 0,
      parseInt(datos.stock_minimo) || 5,
      datos.categoria || '',
    ]
    if (id) {
      await dbRun(
        `UPDATE productos SET
           codigo_barras=?, nombre=?, descripcion=?, foto_url=?,
           precio_costo=?, precio_venta=?, stock_actual=?, stock_minimo=?,
           categoria=?, actualizado_en=datetime('now')
         WHERE id=?`,
        [...params, id]
      )
    } else {
      await dbRun(
        `INSERT INTO productos
           (codigo_barras, nombre, descripcion, foto_url, precio_costo,
            precio_venta, stock_actual, stock_minimo, categoria)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        params
      )
    }
    await cargar()
  }

  async function eliminarProducto(id) {
    await dbRun(`UPDATE productos SET activo=0 WHERE id=?`, [id])
    await cargar()
  }

  async function ajustarStock(id, cantidad) {
    await dbRun(
      `UPDATE productos SET stock_actual = stock_actual + ?, actualizado_en=datetime('now') WHERE id=?`,
      [cantidad, id]
    )
    await cargar()
  }

  return {
    productos,
    cargando,
    filtro, setFiltro,
    soloStockBajo, setSoloStockBajo,
    guardarProducto,
    eliminarProducto,
    ajustarStock,
    recargar: cargar,
  }
}
