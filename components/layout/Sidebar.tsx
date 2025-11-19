/**
 * Componente Sidebar - Barra lateral de navegación
 * Menú contextual según rol del usuario
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  FileText,
  Send,
  Archive,
  Users,
  Settings,
  BarChart3,
  Bell,
  Package,
  Search,
  Folder,
  LogOut,
} from 'lucide-react'

interface MenuItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Docs. Entrantes', href: '/dashboard/documentos/entrantes', icon: FileText },
  { name: 'Docs. Salientes', href: '/dashboard/documentos/salientes', icon: Send },
  { name: 'Turnados', href: '/dashboard/turnados', icon: Folder },
  { name: 'Inventario', href: '/dashboard/inventario', icon: Package },
  { name: 'Búsqueda', href: '/dashboard/busqueda', icon: Search },
  { name: 'Notificaciones', href: '/dashboard/notificaciones', icon: Bell, badge: 3 },
  { name: 'Administración', href: '/dashboard/admin', icon: Settings },
]

interface SidebarProps {
  userName: string
  userRole: string
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo y título */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">SISGEDI 2.0</h1>
            <p className="text-xs text-gray-500">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Usuario */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon
                className={clsx(
                  'h-5 w-5',
                  isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              <span className="flex-1 text-sm font-medium">{item.name}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors w-full group"
        >
          <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
