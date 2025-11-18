import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">SISGEDI 2.0</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
          >
            <span>🏠</span>
            <span className="font-medium">Inicio</span>
          </a>
          <a
            href="/dashboard/documentos"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
          >
            <span>📄</span>
            <span className="font-medium">Documentos</span>
          </a>
          <a
            href="/dashboard/tramites"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
          >
            <span>📮</span>
            <span className="font-medium">Trámites</span>
          </a>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{user.email}</p>
              <p className="text-xs text-gray-500">Usuario</p>
            </div>
          </div>
          <form action="/auth/signout" method="post" className="mt-2">
            <button
              type="submit"
              className="w-full rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-16 border-b bg-white px-6 flex items-center">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}
