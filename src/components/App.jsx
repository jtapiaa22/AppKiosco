import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { checkLicense } from '@/services/license'
import Layout from '@/components/shared/Layout'
import POS       from '@/pages/POS'
import Stock     from '@/pages/Stock'
import Fiados    from '@/pages/Fiados'
import Reportes  from '@/pages/Reportes'
import Clientes  from '@/pages/Clientes'
import Licencia  from '@/pages/Licencia'

export default function App() {
  const [licenciaOk, setLicenciaOk] = useState(null) // null=cargando, true, false

  useEffect(() => {
    checkLicense().then(res => {
      // dev mode o válida → entrar directo
      if (res.dev || res.valid) {
        setLicenciaOk(true)
      } else {
        setLicenciaOk(false)
      }
    })
  }, [])

  // Cargando verificación inicial
  if (licenciaOk === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Sin licencia → mostrar pantalla de activación
  if (!licenciaOk) {
    return <Licencia />
  }

  // Con licencia → app completa
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/pos" replace />} />
        <Route path="pos"      element={<POS />} />
        <Route path="stock"    element={<Stock />} />
        <Route path="fiados"   element={<Fiados />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="clientes" element={<Clientes />} />
      </Route>
    </Routes>
  )
}