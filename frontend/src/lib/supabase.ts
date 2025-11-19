import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase. Por favor configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'sisgedi-v2',
    },
  },
})

// Tipos de la base de datos (se generarán con Supabase CLI)
export type Database = {
  public: {
    Tables: {
      tbl_usuarios: {
        Row: {
          id_usuario: string
          clave_servidor_publico: string
          id_ua: string
          id_rol: string
          nombre_completo: string
          correo_institucional: string
          telefono: string | null
          estatus: string
          fecha_creacion: string
          ultima_sesion: string | null
        }
        Insert: {
          id_usuario?: string
          clave_servidor_publico: string
          id_ua: string
          id_rol: string
          nombre_completo: string
          correo_institucional: string
          telefono?: string | null
          estatus?: string
        }
        Update: {
          id_usuario?: string
          clave_servidor_publico?: string
          id_ua?: string
          id_rol?: string
          nombre_completo?: string
          correo_institucional?: string
          telefono?: string | null
          estatus?: string
          ultima_sesion?: string | null
        }
      }
      // Más tablas se agregarán aquí
    }
  }
}
