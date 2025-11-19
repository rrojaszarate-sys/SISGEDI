import { useState } from 'react'
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from '@nextui-org/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/modules/auth/store/authStore'
import {
  Menu,
  X,
  Home,
  FileText,
  Send,
  Search,
  Settings,
  Users,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { userProfile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada correctamente')
      navigate('/login')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  const menuItems = [
    { label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'Documentos Entrantes', icon: <FileText size={20} />, path: '/documentos-entrantes' },
    { label: 'Documentos Salientes', icon: <Send size={20} />, path: '/documentos-salientes' },
    { label: 'Consultas', icon: <Search size={20} />, path: '/consultas' },
    { label: 'Administración', icon: <Settings size={20} />, path: '/administracion' },
    { label: 'Usuarios', icon: <Users size={20} />, path: '/usuarios' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-primary">SISGEDI 2.0</h1>
          )}
          <Button
            isIconOnly
            variant="light"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                    ${
                      window.location.pathname === item.path
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {item.icon}
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  {sidebarOpen && window.location.pathname === item.path && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Dropdown placement="top-start">
            <DropdownTrigger>
              <div
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  !sidebarOpen && 'justify-center'
                }`}
              >
                <Avatar
                  name={userProfile?.nombre_completo}
                  size="sm"
                  className="flex-shrink-0"
                />
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {userProfile?.nombre_completo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userProfile?.correo_institucional}
                    </p>
                  </div>
                )}
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="User Actions">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Sesión iniciada como</p>
                <p className="font-semibold">{userProfile?.correo_institucional}</p>
              </DropdownItem>
              <DropdownItem key="settings" startContent={<Settings size={18} />}>
                Configuración
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut size={18} />}
                onClick={handleLogout}
              >
                Cerrar Sesión
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {menuItems.find((item) => item.path === window.location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
