import { create } from 'zustand'
import { dbQuery, dbRun } from '@/services/database'

export const useCajaStore = create((set, get) => ({
  caja:   null,
  estado: 'cargando', // 'cargando' | 'abierta' | 'cerrada'
  error:  null,

  cargarCaja: async () => {
    set({ estado: 'cargando', error: null })
    try {
      const rows = await dbQuery(
        `SELECT * FROM cajas WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1`
      )
      set(rows.length > 0
        ? { caja: rows[0], estado: 'abierta' }
        : { caja: null,    estado: 'cerrada' }
      )
    } catch (e) {
      set({ error: e.message, estado: 'cerrada' })
    }
  },

  abrirCaja: async () => {
    set({ error: null })
    try {
      const res = await dbRun(
        `INSERT INTO cajas (estado, total_efectivo, total_transferencias, total_fiados, cant_ventas, abierta_en)
         VALUES ('abierta', 0, 0, 0, 0, datetime('now'))`,
        []
      )
      const rows = await dbQuery('SELECT * FROM cajas WHERE id = ?', [res.lastInsertRowid])
      set({ caja: rows[0], estado: 'abierta' })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  cerrarCaja: async () => {
    const { caja } = get()
    if (!caja) return { ok: false, error: 'No hay caja abierta' }
    set({ error: null })
    try {
      await dbRun(
        `UPDATE cajas SET estado = 'cerrada', cerrada_en = datetime('now') WHERE id = ?`,
        [caja.id]
      )
      const rows = await dbQuery('SELECT * FROM cajas WHERE id = ?', [caja.id])
      set({ caja: null, estado: 'cerrada' })
      return { ok: true, resumen: rows[0] }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  refrescarCaja: async () => {
    const { caja } = get()
    if (!caja) return
    try {
      const rows = await dbQuery('SELECT * FROM cajas WHERE id = ?', [caja.id])
      if (rows.length > 0) set({ caja: rows[0] })
    } catch {}
  },
}))
