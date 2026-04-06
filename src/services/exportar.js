/**
 * exportar.js
 *
 * Servicio de exportación de reportes a CSV y PDF.
 * Usa jsPDF + jsPDF-AutoTable.
 *
 * Funciones exportadas:
 *  - exportarCSV(datos, periodo)  → descarga un .csv
 *  - exportarPDF(datos, periodo)  → descarga un .pdf
 */

// Imports estáticos: jspdf-autotable se registra como plugin sobre el prototipo
// de jsPDF en el momento del import. Con imports dinámicos esa conexión se pierde.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LABELS_PERIODO = {
  hoy:    'Hoy',
  semana: 'Últimos 7 días',
  mes:    'Últimos 30 días',
}

function fechaHoy() {
  return new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function slugFecha() {
  return new Date().toISOString().slice(0, 10)
}

function moneda(n) {
  return `$${Number(n || 0).toLocaleString('es-AR')}`
}

async function guardarArchivo(nombre, contenido, tipo) {
  if (window.electronAPI?.guardarArchivo) {
    const buffer = typeof contenido === 'string'
      ? Array.from(new TextEncoder().encode(contenido))
      : Array.from(contenido)
    await window.electronAPI.guardarArchivo(nombre, buffer)
    return
  }
  const blob = typeof contenido === 'string'
    ? new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
    : new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function filaCSV(celdas) {
  return celdas
    .map(c => `"${String(c ?? '').replace(/"/g, '""')}"`)
    .join(',') + '\r\n'
}

function construirCSV(datos, periodo) {
  let csv = ''
  const label = LABELS_PERIODO[periodo] ?? periodo
  const hoy   = fechaHoy()

  csv += filaCSV([`Reporte KioscoApp — ${label}`, `Generado: ${hoy}`])
  csv += '\r\n'

  if (datos.resumen) {
    const r = datos.resumen
    csv += filaCSV(['RESUMEN GENERAL'])
    csv += filaCSV(['Ventas', 'Total vendido', 'Efectivo', 'Transferencia', 'Fiado'])
    csv += filaCSV([
      r.cant_ventas,
      moneda(r.total_vendido),
      moneda(r.total_efectivo),
      moneda(r.total_transferencia),
      moneda(r.total_fiado),
    ])
    csv += '\r\n'
  }

  if (datos.topProductos?.length) {
    csv += filaCSV(['TOP PRODUCTOS'])
    csv += filaCSV(['Producto', 'Unidades vendidas', 'Total recaudado'])
    datos.topProductos.forEach(p => {
      csv += filaCSV([p.nombre, p.unidades, moneda(p.total)])
    })
    csv += '\r\n'
  }

  if (datos.rentabilidad?.length) {
    csv += filaCSV(['RENTABILIDAD POR PRODUCTO'])
    csv += filaCSV(['Producto', 'Unidades', 'Ingresos', 'Costos', 'Ganancia'])
    datos.rentabilidad.forEach(p => {
      csv += filaCSV([
        p.nombre, p.unidades,
        moneda(p.ingresos), moneda(p.costos), moneda(p.ganancia),
      ])
    })
    csv += '\r\n'
  }

  if (datos.fiados) {
    csv += filaCSV(['FIADOS PENDIENTES'])
    csv += filaCSV(['Clientes con deuda', 'Deuda total acumulada'])
    csv += filaCSV([datos.fiados.cant_clientes, moneda(datos.fiados.deuda_total)])
    csv += '\r\n'
  }

  if (datos.stockBajo?.length) {
    csv += filaCSV(['STOCK BAJO'])
    csv += filaCSV(['Producto', 'Stock actual', 'Stock mínimo'])
    datos.stockBajo.forEach(p => {
      csv += filaCSV([p.nombre, p.stock_actual, p.stock_minimo])
    })
  }

  return csv
}

export async function exportarCSV(datos, periodo) {
  const csv    = construirCSV(datos, periodo)
  const nombre = `reporte-kiosco-${slugFecha()}.csv`
  await guardarArchivo(nombre, csv, 'text/csv;charset=utf-8;')
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export async function exportarPDF(datos, periodo) {
  const label = LABELS_PERIODO[periodo] ?? periodo
  const hoy   = fechaHoy()

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const GRIS_TITULO = [30,  30,  30]
  const GRIS_HEADER = [50,  50,  50]
  const GRIS_FILA   = [245, 245, 245]
  const VERDE       = [22,  163, 74]
  const ROJO        = [220, 38,  38]
  const AMBER       = [180, 83,  9]

  const MARGEN = 15
  let y = MARGEN

  // Encabezado
  doc.setFillColor(...GRIS_TITULO)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('KioscoApp — Reporte de ventas', MARGEN, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${label}    |    Generado: ${hoy}`, MARGEN, 20)
  doc.setTextColor(...GRIS_TITULO)
  y = 30

  function tituloSeccion(texto, color = GRIS_TITULO) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...color)
    doc.text(texto, MARGEN, y)
    doc.setDrawColor(...color)
    doc.line(MARGEN, y + 1, 210 - MARGEN, y + 1)
    y += 6
  }

  // Usamos autoTable como función directa (no como método del doc)
  // para compatibilidad garantizada con el import nombrado
  function tabla(columnas, filas, opciones = {}) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGEN, right: MARGEN },
      head:   [columnas],
      body:   filas,
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: GRIS_TITULO,
      },
      headStyles: {
        fillColor: GRIS_HEADER,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: GRIS_FILA },
      ...opciones,
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // 1. Resumen general
  if (datos.resumen) {
    const r = datos.resumen
    tituloSeccion('Resumen general')
    const tarjetas = [
      { label: 'Ventas realizadas',  valor: r.cant_ventas,                   color: GRIS_TITULO },
      { label: 'Total vendido',      valor: moneda(r.total_vendido),         color: VERDE },
      { label: 'Efectivo',           valor: moneda(r.total_efectivo),        color: GRIS_TITULO },
      { label: 'Transferencia',      valor: moneda(r.total_transferencia),   color: GRIS_TITULO },
      { label: 'Fiado',              valor: moneda(r.total_fiado),           color: ROJO },
    ]
    const W = (210 - MARGEN * 2 - 4 * 3) / 5
    tarjetas.forEach((t, i) => {
      const x = MARGEN + i * (W + 3)
      doc.setFillColor(245, 245, 245)
      doc.roundedRect(x, y, W, 16, 2, 2, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(t.label, x + 2, y + 5)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...t.color)
      doc.text(String(t.valor), x + 2, y + 13)
    })
    y += 22
    doc.setTextColor(...GRIS_TITULO)
  }

  // 2. Top productos
  if (datos.topProductos?.length) {
    tituloSeccion('Top productos más vendidos')
    tabla(
      ['Producto', 'Unidades vendidas', 'Total recaudado'],
      datos.topProductos.map(p => [p.nombre, p.unidades, moneda(p.total)])
    )
  }

  // 3. Rentabilidad
  if (datos.rentabilidad?.length) {
    if (y > 230) { doc.addPage(); y = MARGEN }
    tituloSeccion('Rentabilidad por producto', VERDE)
    tabla(
      ['Producto', 'Unidades', 'Ingresos', 'Costos', 'Ganancia'],
      datos.rentabilidad.map(p => [
        p.nombre, p.unidades,
        moneda(p.ingresos), moneda(p.costos), moneda(p.ganancia),
      ])
    )
  }

  // 4. Fiados
  if (datos.fiados) {
    if (y > 230) { doc.addPage(); y = MARGEN }
    tituloSeccion('Fiados pendientes', AMBER)
    tabla(
      ['Clientes con deuda', 'Deuda total acumulada'],
      [[datos.fiados.cant_clientes, moneda(datos.fiados.deuda_total)]]
    )
  }

  // 5. Stock bajo
  if (datos.stockBajo?.length) {
    if (y > 230) { doc.addPage(); y = MARGEN }
    tituloSeccion('Productos con stock bajo', ROJO)
    tabla(
      ['Producto', 'Stock actual', 'Stock mínimo'],
      datos.stockBajo.map(p => [p.nombre, p.stock_actual, p.stock_minimo]),
      { bodyStyles: { textColor: ROJO } }
    )
  }

  // Pie de página
  const totalPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)
    doc.text(`KioscoApp  •  Página ${i} de ${totalPaginas}  •  ${hoy}`, MARGEN, 290)
  }

  const nombre   = `reporte-kiosco-${slugFecha()}.pdf`
  const pdfBytes = doc.output('arraybuffer')
  await guardarArchivo(nombre, new Uint8Array(pdfBytes), 'application/pdf')
}
