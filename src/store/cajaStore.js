/**
 * cajaStore.js — Estado global de la caja con Zustand
 *
 * Maneja: caja activa, estado (abierta/cerrada/cargando), y acciones
 * de apertura y cierre. Los componentes consumen este store para
 * saber si pueden registrar ventas.
 */
import { create } from 'zustand'
import { dbQuery, dbRun } from '@/services/database'

export const useCajaStore = create((set, get) => ({
  // ── Estado ────────────────────────────────────────────────
  caja:     null,      // objeto caja activa o null
  estado:   'cargando', // 'cargando' | 'abierta' | 'cerrada'
  error:    null,

  // ── Cargar caja activa (al iniciar la app o volver al POS) ──
  cargarCaja: async () => {
    set({ estado: 'cargando', error: null })
    try {
      const rows = await dbQuery(
        `SELECT * FROM cajas WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1`
      )
      if (rows.length > 0) {
        set({ caja: rows[0], estado: 'abierta' })
      } else {
        set({ caja: null, estado: 'cerrada' })
      }
    } catch (e) {
      set({ error: e.message, estado: 'cerrada' })
    }
  },

  // ── Abrir caja ────────────────────────────────────────────
  abrirCaja: async (montoApertura = 0) => {
    set({ error: null })
    try {
      const res = await dbRun(
        `INSERT INTO cajas (estado, monto_apertura, total_efectivo, total_transferencias, total_fiados, cant_ventas, abierta_en)
         VALUES ('abierta', ?, 0, 0, 0, 0, datetime('now'))`,
        [montoApertura]
      )
      const rows = await dbQuery('SELECT * FROM cajas WHERE id = ?', [res.lastInsertRowid])
      set({ caja: rows[0], estado: 'abierta' })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  // ── Cerrar caja ───────────────────────────────────────────
  cerrarCaja: async () => {
    const { caja } = get()
    if (!caja) return { ok: false, error: 'No hay caja abierta' }
    set({ error: null })
    try {
      await dbRun(
        `UPDATE cajas SET estado = 'cerrada', cerrada_en = datetime('now') WHERE id = ?`,
        [caja.id]
      )
      // Obtener la caja cerrada con todos sus datos para mostrar el resumen
      const rows = await dbQuery('SELECT * FROM cajas WHERE id = ?', [caja.id])
      set({ caja: null, estado: 'cerrada' })
      return { ok: true, resumen: rows[0] }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  // ── Refrescar totales de la caja activa ───────────────────
  refrescarCaja: async () => {
    const { caja } = get()
    if (!caja) return
    try {
      const rows = await dbQuery('SELECT * FROM cajas WHERE id = ?', [caja.id])
      if (rows.length > 0) set({ caja: rows[0] })
    } catch {}
  },
}))
