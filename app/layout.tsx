import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SISGEDI 2.0 - Sistema de Gestión de Documentación Integral',
  description: 'Sistema de Gestión de Documentación Integral para Instituciones de Gobierno',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  )
}
