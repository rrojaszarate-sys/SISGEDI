import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id_usuario: string
  clave_servidor_publico: string
  nombre_completo: string
  correo_institucional: string
  id_ua: string
  id_rol: string
  estatus: string
}

interface AuthState {
  user: User | null
  userProfile: UserProfile | null
  isLoading: boolean
  error: string | null
  signIn: (claveServidor: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      // Verificar si hay una sesión activa
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // Obtener perfil del usuario desde la base de datos
        const { data: profile, error } = await supabase
          .from('tbl_usuarios')
          .select('*')
          .eq('id_usuario', session.user.id)
          .single()

        if (error) throw error

        set({
          user: session.user,
          userProfile: profile,
          isLoading: false
        })
      } else {
        set({ isLoading: false })
      }

      // Escuchar cambios en la autenticación
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('tbl_usuarios')
            .select('*')
            .eq('id_usuario', session.user.id)
            .single()

          set({
            user: session.user,
            userProfile: profile
          })

          // Actualizar última sesión
          await supabase
            .from('tbl_usuarios')
            .update({ ultima_sesion: new Date().toISOString() })
            .eq('id_usuario', session.user.id)
        } else {
          set({ user: null, userProfile: null })
        }
      })
    } catch (error) {
      console.error('Error al inicializar autenticación:', error)
      set({ isLoading: false, error: 'Error al inicializar la sesión' })
    }
  },

  signIn: async (claveServidor: string, password: string) => {
    set({ isLoading: true, error: null })

    try {
      // Buscar el usuario por clave de servidor
      const { data: usuario, error: userError } = await supabase
        .from('tbl_usuarios')
        .select('correo_institucional, estatus, intentos_fallidos, fecha_bloqueo')
        .eq('clave_servidor_publico', claveServidor)
        .single()

      if (userError || !usuario) {
        throw new Error('Credenciales inválidas')
      }

      // Verificar si el usuario está bloqueado (RF1: 3 intentos = 10 min)
      if (usuario.fecha_bloqueo) {
        const bloqueoDate = new Date(usuario.fecha_bloqueo)
        const now = new Date()
        const minutosTranscurridos = (now.getTime() - bloqueoDate.getTime()) / (1000 * 60)

        if (minutosTranscurridos < 10) {
          throw new Error(`Usuario bloqueado. Intente nuevamente en ${Math.ceil(10 - minutosTranscurridos)} minutos`)
        }
      }

      // Verificar estatus del usuario
      if (usuario.estatus !== 'Activo') {
        throw new Error('Usuario inactivo. Contacte al administrador')
      }

      // Intentar iniciar sesión con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usuario.correo_institucional,
        password: password,
      })

      if (error) {
        // Incrementar intentos fallidos
        const nuevosIntentos = (usuario.intentos_fallidos || 0) + 1

        await supabase
          .from('tbl_usuarios')
          .update({
            intentos_fallidos: nuevosIntentos,
            fecha_bloqueo: nuevosIntentos >= 3 ? new Date().toISOString() : null
          })
          .eq('correo_institucional', usuario.correo_institucional)

        if (nuevosIntentos >= 3) {
          throw new Error('Usuario bloqueado por múltiples intentos fallidos. Espere 10 minutos')
        }

        throw new Error('Contraseña incorrecta')
      }

      // Resetear intentos fallidos en login exitoso
      await supabase
        .from('tbl_usuarios')
        .update({
          intentos_fallidos: 0,
          fecha_bloqueo: null,
          ultima_sesion: new Date().toISOString()
        })
        .eq('correo_institucional', usuario.correo_institucional)

      // Obtener perfil completo
      const { data: profile } = await supabase
        .from('tbl_usuarios')
        .select('*')
        .eq('id_usuario', data.user.id)
        .single()

      set({
        user: data.user,
        userProfile: profile,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Error al iniciar sesión'
      })
      throw error
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, userProfile: null, error: null })
    } catch (error: any) {
      set({ error: error.message || 'Error al cerrar sesión' })
      throw error
    }
  },
}))

// Inicializar la autenticación al cargar el store
useAuthStore.getState().initialize()
