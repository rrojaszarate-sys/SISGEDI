import { createClient } from '@supabase/supabase-js';

// Variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Modo desarrollo - bypass RLS y logs adicionales
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV === true;

// Validar configuracion
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error('SISGEDI: Variables de entorno de Supabase no configuradas');
  console.error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel');
}

if (DEV_MODE) {
  console.log('=================================');
  console.log('SISGEDI - MODO DESARROLLO ACTIVO');
  console.log('=================================');
  console.log('Supabase URL:', supabaseUrl ? 'Configurado' : 'NO CONFIGURADO');
  console.log('Supabase Key:', supabaseAnonKey ? 'Configurado' : 'NO CONFIGURADO');
}

// Opciones del cliente Supabase
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // En modo desarrollo, logs adicionales
  ...(DEV_MODE && {
    global: {
      headers: {
        'x-dev-mode': 'true',
      },
    },
  }),
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  supabaseOptions
);

// Helper para queries en modo desarrollo con bypass de errores RLS
export const devQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  const result = await queryFn();

  if (DEV_MODE && result.error) {
    console.warn('SISGEDI DEV - Error en query:', result.error.message);
    console.warn('Codigo:', result.error.code);
    console.warn('Hint:', result.error.hint);

    // Si es error de RLS, mostrar mensaje claro
    if (result.error.code === '42501' || result.error.message?.includes('RLS')) {
      console.warn('');
      console.warn('=== ERROR DE RLS (Row Level Security) ===');
      console.warn('Las politicas RLS estan bloqueando esta operacion.');
      console.warn('Opciones:');
      console.warn('1. Verifica que el usuario este autenticado');
      console.warn('2. Revisa las politicas RLS en Supabase Dashboard');
      console.warn('3. Temporalmente desactiva RLS en la tabla (solo desarrollo)');
      console.warn('==========================================');
    }
  }

  return result;
};

// Funcion para verificar conexion
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('usuarios').select('count').limit(1);
    if (error) {
      if (DEV_MODE) {
        console.error('SISGEDI DEV - Error de conexion:', error.message);
      }
      return false;
    }
    if (DEV_MODE) {
      console.log('SISGEDI DEV - Conexion a Supabase OK');
    }
    return true;
  } catch (e) {
    if (DEV_MODE) {
      console.error('SISGEDI DEV - Excepcion de conexion:', e);
    }
    return false;
  }
};
