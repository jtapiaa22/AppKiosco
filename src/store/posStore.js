/**
 * posStore.js — Estado global del Punto de Venta con Zustand
 *
 * Maneja: carrito, cliente seleccionado, y helpers de cálculo.
 */
import { create } from 'zustand'

export const usePosStore = create((set, get) => ({
  // ── Estado ────────────────────────────────────────────────
  carrito:            [],
  clienteSeleccionado: null,

  // ── Carrito ───────────────────────────────────────────────

  /**
   * Agrega un producto al carrito. Si ya existe, incrementa cantidad.
   */
  agregarProducto: (producto) => {
    const { carrito } = get()
    const idx = carrito.findIndex(i => i.id === producto.id)

    if (idx !== -1) {
      // Ya está en el carrito → incrementar
      const nuevo = [...carrito]
      nuevo[idx] = { ...nuevo[idx], cantidad: nuevo[idx].cantidad + 1 }
      set({ carrito: nuevo })
    } else {
      set({ carrito: [...carrito, { ...producto, cantidad: 1 }] })
    }
  },

  /**
   * Cambia la cantidad de un ítem. Si llega a 0, lo elimina.
   */
  cambiarCantidad: (productoId, delta) => {
    const { carrito } = get()
    const nuevo = carrito
      .map(i => i.id === productoId ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0)
    set({ carrito: nuevo })
  },

  /**
   * Fija una cantidad exacta para un ítem.
   */
  setCantidad: (productoId, cantidad) => {
    const cant = parseInt(cantidad)
    if (isNaN(cant) || cant < 0) return
    if (cant === 0) {
      set({ carrito: get().carrito.filter(i => i.id !== productoId) })
    } else {
      set({
        carrito: get().carrito.map(i =>
          i.id === productoId ? { ...i, cantidad: cant } : i
        ),
      })
    }
  },

  /**
   * Elimina un ítem del carrito.
   */
  eliminarItem: (productoId) =>
    set({ carrito: get().carrito.filter(i => i.id !== productoId) }),

  /**
   * Vacía el carrito y deselecciona el cliente.
   */
  limpiarCarrito: () => set({ carrito: [], clienteSeleccionado: null }),

  // ── Cliente ───────────────────────────────────────────────

  setCliente: (cliente) => set({ clienteSeleccionado: cliente }),
  limpiarCliente: () => set({ clienteSeleccionado: null }),

  // ── Cálculos ──────────────────────────────────────────────

  getTotal: () =>
    get().carrito.reduce((sum, i) => sum + i.precio_venta * i.cantidad, 0),

  getCantidadTotal: () =>
    get().carrito.reduce((sum, i) => sum + i.cantidad, 0),
}))
