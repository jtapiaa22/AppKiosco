import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { checkLicense }    from '@/services/license'
import { AccesoProvider, useAcceso } from '@/context/AccesoContext'
import Layout              from '@/components/shared/Layout'
import PantallaPin         from '@/components/pin/PantallaPin'
import POS                 from '@/pages/POS'
import Stock               from '@/pages/Stock'
import Fiados              from '@/pages/Fiados'
import Reportes            from '@/pages/Reportes'
import Clientes            from '@/pages/Clientes'
import Licencia            from '@/pages/Licencia'
import Caja                from '@/pages/Caja'
import Configuracion       from '@/pages/Configuracion'

const Spinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

// Dentro de AccesoProvider
function AppInterna() {
  const { desbloqueado, cargando } = useAcceso()

  if (cargando)        return <Spinner />
  if (!desbloqueado)   return <PantallaPin />

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index                element={<Navigate to="/pos" replace />} />
        <Route path="pos"           element={<POS />} />
        <Route path="caja"          element={<Caja />} />
        <Route path="stock"         element={<Stock />} />
        <Route path="fiados"        element={<Fiados />} />
        <Route path="reportes"      element={<Reportes />} />
        <Route path="clientes"      element={<Clientes />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const [licenciaOk, setLicenciaOk] = useState(null)

  useEffect(() => {
    checkLicense().then(res => {
      setLicenciaOk(res.dev || res.valid)
    })
  }, [])

  if (licenciaOk === null) return <Spinner />
  if (!licenciaOk)         return <Licencia />

  return (
    <AccesoProvider>
      <AppInterna />
    </AccesoProvider>
  )
}
