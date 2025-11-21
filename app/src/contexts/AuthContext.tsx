import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, DEV_MODE } from '../lib/supabase';

// Usuarios mock para modo desarrollo
export const DEV_USERS = {
  admin: {
    id_usuario: 'dev-admin-001',
    clave_servidor_publico: 'ADMIN001',
    nombre_completo: 'Administrador General (DEV)',
    correo_institucional: 'admin@gobierno.gob.mx',
    telefono: '555-0001',
    estatus: 'Activo',
    rol: {
      id_rol: 'rol-admin',
      nombre_rol: 'Administrador General',
      descripcion: 'Acceso total al sistema',
      elementos_menu: { acciones: ['crear', 'editar', 'eliminar', 'ver', 'reportes'] }
    },
    unidad_administrativa: {
      id_ua: 'ua-central',
      nombre_ua: 'Direccion General',
      codigo_ua: 'DG-001',
      nivel_jerarquico: 1
    }
  },
  adminUA: {
    id_usuario: 'dev-adminua-001',
    clave_servidor_publico: 'ADMINUA001',
    nombre_completo: 'Administrador de Unidad (DEV)',
    correo_institucional: 'adminua@gobierno.gob.mx',
    telefono: '555-0002',
    estatus: 'Activo',
    rol: {
      id_rol: 'rol-adminua',
      nombre_rol: 'Administrador UA',
      descripcion: 'Administrador de Unidad Administrativa',
      elementos_menu: { acciones: ['crear', 'editar', 'ver'] }
    },
    unidad_administrativa: {
      id_ua: 'ua-juridico',
      nombre_ua: 'Direccion Juridica',
      codigo_ua: 'DJ-001',
      nivel_jerarquico: 2
    }
  },
  operador: {
    id_usuario: 'dev-operador-001',
    clave_servidor_publico: 'OPER001',
    nombre_completo: 'Operador de Ventanilla (DEV)',
    correo_institucional: 'operador@gobierno.gob.mx',
    telefono: '555-0003',
    estatus: 'Activo',
    rol: {
      id_rol: 'rol-operador',
      nombre_rol: 'Operador',
      descripcion: 'Captura y consulta de documentos',
      elementos_menu: { acciones: ['crear', 'ver'] }
    },
    unidad_administrativa: {
      id_ua: 'ua-ventanilla',
      nombre_ua: 'Ventanilla Unica',
      codigo_ua: 'VU-001',
      nivel_jerarquico: 3
    }
  },
  consulta: {
    id_usuario: 'dev-consulta-001',
    clave_servidor_publico: 'CONS001',
    nombre_completo: 'Usuario Consulta (DEV)',
    correo_institucional: 'consulta@gobierno.gob.mx',
    telefono: '555-0004',
    estatus: 'Activo',
    rol: {
      id_rol: 'rol-consulta',
      nombre_rol: 'Solo Consulta',
      descripcion: 'Solo puede ver documentos',
      elementos_menu: { acciones: ['ver'] }
    },
    unidad_administrativa: {
      id_ua: 'ua-archivo',
      nombre_ua: 'Archivo General',
      codigo_ua: 'AG-001',
      nivel_jerarquico: 3
    }
  }
};

export type DevUserType = keyof typeof DEV_USERS;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  usuario: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  devSignIn: (userType: DevUserType) => void;
  isAdmin: boolean;
  isAdminUA: boolean;
  permisos: string[];
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsuario(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUsuario(session.user.id);
        } else {
          setUsuario(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUsuario = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tbl_usuarios')
        .select('*, cat_roles (*), cat_unidad_administrativa (*)')
        .eq('id_usuario', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUsuario({
          ...data,
          rol: (data as any).cat_roles,
          unidad_administrativa: (data as any).cat_unidad_administrativa,
        });
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    // Limpiar usuario dev de sessionStorage
    sessionStorage.removeItem('sisgedi-dev-user');
  };

  // Login de desarrollo - entra directamente con usuario mock
  const devSignIn = (userType: DevUserType) => {
    if (!DEV_MODE) {
      console.warn('devSignIn solo funciona en modo desarrollo');
      return;
    }
    const devUser = DEV_USERS[userType];
    setUsuario(devUser);
    setLoading(false);
    // Guardar en sessionStorage para persistir durante la sesion
    sessionStorage.setItem('sisgedi-dev-user', userType);
    console.log(`SISGEDI DEV - Login como: ${devUser.nombre_completo}`);
  };

  // Cargar usuario dev de sessionStorage al iniciar
  useEffect(() => {
    if (DEV_MODE) {
      const savedDevUser = sessionStorage.getItem('sisgedi-dev-user') as DevUserType;
      if (savedDevUser && DEV_USERS[savedDevUser]) {
        setUsuario(DEV_USERS[savedDevUser]);
        setLoading(false);
      }
    }
  }, []);

  const isAdmin = usuario?.rol?.nombre_rol === 'Administrador General';
  const isAdminUA = usuario?.rol?.nombre_rol === 'Administrador UA' || isAdmin;
  const permisos = usuario?.rol?.elementos_menu?.acciones || [];

  return (
    <AuthContext.Provider value={{
      user, session, usuario, loading, signIn, signOut, devSignIn, isAdmin, isAdminUA, permisos, isDevMode: DEV_MODE,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
