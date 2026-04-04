import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from '@/components/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*
      HashRouter en lugar de BrowserRouter porque Electron carga
      archivos locales y no tiene un servidor que maneje rutas.
      Con Hash (#/pos, #/stock, etc.) todo funciona sin servidor.
    */}
    <HashRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1f2937' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
        }}
      />
    </HashRouter>
  </React.StrictMode>
)
