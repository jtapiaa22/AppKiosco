import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { checkLicense }   from '@/services/license'
import { RolProvider }    from '@/context/RolContext'
import { useRol }         from '@/context/RolContext'
import Layout             from '@/components/shared/Layout'
import PantallaPin        from '@/components/pin/PantallaPin'
import POS                from '@/pages/POS'
import Stock              from '@/pages/Stock'
import Fiados             from '@/pages/Fiados'
import Reportes           from '@/pages/Reportes'
import Clientes           from '@/pages/Clientes'
import Licencia           from '@/pages/Licencia'
import Caja               from '@/pages/Caja'
import Configuracion      from '@/pages/Configuracion'

// ---------------------------------------------------------------------------
// AppInterna: usa useRol(), por eso debe estar dentro de <RolProvider>
// ---------------------------------------------------------------------------
function AppInterna() {
  const { rol, hayPin, cargando } = useRol()

  // Mientras verifica si hay PIN configurado
  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Hay PIN configurado y todavía no se autenticaron → mostrar pantalla de PIN
  if (hayPin && !rol) {
    return <PantallaPin />
  }

  // App normal
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index              element={<Navigate to="/pos" replace />} />
        <Route path="pos"         element={<POS />} />
        <Route path="caja"        element={<Caja />} />
        <Route path="stock"       element={<Stock />} />
        <Route path="fiados"      element={<Fiados />} />
        <Route path="reportes"    element={<Reportes />} />
        <Route path="clientes"    element={<Clientes />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
  )
}

// ---------------------------------------------------------------------------
// App: guard de licencia + proveedor de rol
// ---------------------------------------------------------------------------
export default function App() {
  const [licenciaOk, setLicenciaOk] = useState(null)

  useEffect(() => {
    checkLicense().then(res => {
      if (res.dev || res.valid) setLicenciaOk(true)
      else setLicenciaOk(false)
    })
  }, [])

  if (licenciaOk === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!licenciaOk) return <Licencia />

  return (
    <RolProvider>
      <AppInterna />
    </RolProvider>
  )
}
