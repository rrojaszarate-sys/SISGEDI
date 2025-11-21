/**
 * Componente LoginForm - Formulario de inicio de sesión
 * Maneja la autenticación de usuarios con Supabase
 */

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Mail, Lock } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Verificar si el usuario existe en tbl_usuarios
        const { data: userData, error: userError } = await supabase
          .from('tbl_usuarios')
          .select('id_usuario, nombre_completo, id_rol, id_ua, estatus')
          .eq('id_usuario', data.user.id)
          .single()

        if (userError || !userData) {
          setError('Usuario no encontrado en el sistema. Contacte al administrador.')
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        if (userData.estatus !== 'Activo') {
          setError('Su cuenta está inactiva. Contacte al administrador.')
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        // Redireccionar al dashboard
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intente nuevamente.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert
          type="error"
          title="Error de autenticación"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <Input
        label="Correo Institucional"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        placeholder="usuario@salud.gob.mx"
        leftIcon={<Mail className="h-5 w-5" />}
        disabled={isLoading}
      />

      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        placeholder="••••••••"
        leftIcon={<Lock className="h-5 w-5" />}
        disabled={isLoading}
      />

      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Iniciar Sesión
      </Button>

      <div className="text-center">
        <a
          href="#"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  )
}
