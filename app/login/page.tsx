/**
 * Página de Login - Inicio de sesión
 * Punto de entrada principal para usuarios no autenticados
 */

import { LoginForm } from '@/components/auth/LoginForm'
import { FileText } from 'lucide-react'

export const metadata = {
  title: 'Iniciar Sesión - SISGEDI 2.0',
  description: 'Inicie sesión en el Sistema de Gestión de Documentación Integral',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SISGEDI 2.0
          </h1>
          <p className="text-gray-600">
            Sistema de Gestión de Documentación Integral
          </p>
        </div>

        {/* Tarjeta de login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Iniciar Sesión
          </h2>

          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 SISGEDI 2.0 - Todos los derechos reservados</p>
          <p className="mt-2">Secretaría de Salud</p>
        </div>
      </div>
    </div>
  )
}
