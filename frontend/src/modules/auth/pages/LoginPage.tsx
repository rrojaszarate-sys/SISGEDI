import { useState } from 'react'
import { Card, CardHeader, CardBody, Input, Button, Divider } from '@nextui-org/react'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [claveServidor, setClaveServidor] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, isLoading, error } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!claveServidor.trim()) {
      toast.error('Por favor ingrese su clave de servidor público')
      return
    }

    if (!password.trim()) {
      toast.error('Por favor ingrese su contraseña')
      return
    }

    try {
      await signIn(claveServidor, password)
      toast.success('¡Bienvenido a SISGEDI 2.0!')
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            SISGEDI 2.0
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sistema de Gestión Documental Inteligente
          </p>
        </div>

        {/* Card de login */}
        <Card className="shadow-2xl">
          <CardHeader className="flex flex-col gap-1 px-6 pt-6">
            <h2 className="text-2xl font-semibold">Iniciar Sesión</h2>
            <p className="text-sm text-gray-500">
              Ingrese sus credenciales para acceder al sistema
            </p>
          </CardHeader>

          <Divider />

          <CardBody className="px-6 py-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Campo: Clave de Servidor Público */}
              <Input
                label="Clave de Servidor Público"
                placeholder="Ingrese su clave de servidor"
                value={claveServidor}
                onChange={(e) => setClaveServidor(e.target.value)}
                startContent={<User className="text-gray-400" size={20} />}
                variant="bordered"
                isRequired
                autoComplete="username"
                classNames={{
                  input: "text-base",
                  label: "text-sm font-medium"
                }}
              />

              {/* Campo: Contraseña */}
              <Input
                label="Contraseña"
                placeholder="Ingrese su contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startContent={<Lock className="text-gray-400" size={20} />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="text-gray-400 hover:text-gray-600" size={20} />
                    ) : (
                      <Eye className="text-gray-400 hover:text-gray-600" size={20} />
                    )}
                  </button>
                }
                variant="bordered"
                isRequired
                autoComplete="current-password"
                classNames={{
                  input: "text-base",
                  label: "text-sm font-medium"
                }}
              />

              {/* Mensaje de error */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Información de seguridad */}
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  <strong>Seguridad:</strong> Su sesión expirará después de 30 minutos de inactividad.
                  Después de 3 intentos fallidos, su cuenta será bloqueada por 10 minutos.
                </p>
              </div>

              {/* Botón de submit */}
              <Button
                type="submit"
                color="primary"
                size="lg"
                isLoading={isLoading}
                className="mt-2 font-semibold"
                fullWidth
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>SISGEDI 2.0 - Sistema de Gestión Documental Inteligente</p>
          <p className="mt-1">© 2025 Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  )
}
