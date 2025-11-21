/**
 * Layout del Dashboard - Estructura base de la aplicación
 * Incluye Sidebar, Header y área de contenido
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener datos del usuario desde tbl_usuarios
  const { data: userData } = await supabase
    .from('tbl_usuarios')
    .select(`
      id_usuario,
      nombre_completo,
      correo_institucional,
      estatus,
      id_rol,
      id_ua,
      cat_roles (
        nombre_rol,
        elementos_menu
      ),
      cat_unidad_administrativa (
        nombre_ua,
        codigo_ua
      )
    `)
    .eq('id_usuario', user.id)
    .single()

  if (!userData || userData.estatus !== 'Activo') {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        userName={userData.nombre_completo}
        userRole={(userData.cat_roles as any)?.nombre_rol || 'Usuario'}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
