import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Usuario, Rol, UnidadAdministrativa } from '../types/database';

interface UsuarioCompleto extends Usuario {
  rol?: Rol;
  unidad_administrativa?: UnidadAdministrativa;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  usuario: UsuarioCompleto | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAdminUA: boolean;
  permisos: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsuario(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
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
        .select(`
          *,
          cat_roles (*),
          cat_unidad_administrativa (*)
        `)
        .eq('id_usuario', userId)
        .single();

      if (error) throw error;

      setUsuario({
        ...data,
        rol: data.cat_roles,
        unidad_administrativa: data.cat_unidad_administrativa,
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  const isAdmin = usuario?.rol?.nombre_rol === 'Administrador General';
  const isAdminUA = usuario?.rol?.nombre_rol === 'Administrador UA' || isAdmin;

  const permisos = usuario?.rol?.elementos_menu
    ? (typeof usuario.rol.elementos_menu === 'object'
        ? (usuario.rol.elementos_menu as { acciones?: string[] }).acciones || []
        : [])
    : [];

  return (
    <AuthContext.Provider value={{
      user,
      session,
      usuario,
      loading,
      signIn,
      signOut,
      isAdmin,
      isAdminUA,
      permisos,
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
