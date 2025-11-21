import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Badge,
} from '@nextui-org/react';
import {
  Home,
  FileText,
  Send,
  FolderOpen,
  Users,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Package,
  Building2,
  UserCog,
  ListTree,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { ThemePalettePicker } from '../../shared/components/theme';

const menuItems = [
  { key: 'dashboard', label: 'Inicio', icon: Home, path: '/' },
  { key: 'documentos', label: 'Documentos Entrantes', icon: FileText, path: '/documentos' },
  { key: 'turnado', label: 'Bandeja de Turnados', icon: Send, path: '/turnado' },
  { key: 'salientes', label: 'Documentos Salientes', icon: FolderOpen, path: '/salientes' },
  { key: 'inventario', label: 'Inventario', icon: Package, path: '/inventario' },
  { key: 'busqueda', label: 'Busqueda', icon: Search, path: '/busqueda' },
];

const catalogosItems = [
  { key: 'unidades', label: 'Unidades Administrativas', icon: Building2, path: '/catalogos/unidades' },
  { key: 'roles', label: 'Roles', icon: UserCog, path: '/catalogos/roles' },
  { key: 'valores', label: 'Catalogos', icon: ListTree, path: '/catalogos/valores' },
];

export default function MainLayout() {
  const { usuario, signOut, isAdminUA } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesion cerrada correctamente');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
      {/* Navbar superior */}
      <Navbar
        isBordered
        maxWidth="full"
        className="shadow-lg"
        style={{ backgroundColor: 'var(--theme-primary-700)' }}
      >
        <NavbarBrand className="gap-3">
          <Button
            isIconOnly
            variant="light"
            className="text-white"
            onPress={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--theme-primary-600)' }}
            >
              <FileText className="text-white" size={24} />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-xl text-white">SISGEDI</span>
              <p className="text-xs text-white opacity-60">Gestion Documental</p>
            </div>
          </div>
        </NavbarBrand>

        <NavbarContent justify="end" className="gap-2 sm:gap-4">
          {/* Busqueda rapida */}
          <NavbarItem className="hidden sm:flex">
            <Button
              variant="flat"
              className="text-white"
              style={{ backgroundColor: 'var(--theme-primary-600)' }}
              startContent={<Search size={18} />}
              onPress={() => navigate('/busqueda')}
            >
              Buscar
            </Button>
          </NavbarItem>

          {/* Selector de Tema */}
          <NavbarItem className="hidden sm:flex">
            <ThemePalettePicker />
          </NavbarItem>

          {/* Notificaciones */}
          <NavbarItem>
            <Badge content="3" color="warning" size="sm">
              <Button
                isIconOnly
                variant="light"
                className="text-white"
              >
                <Bell size={20} />
              </Button>
            </Badge>
          </NavbarItem>

          {/* Usuario */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar
                  size="sm"
                  name={usuario?.nombre_completo?.charAt(0) || 'U'}
                  style={{ backgroundColor: 'var(--theme-secondary)' }}
                  className="text-white"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{usuario?.nombre_completo}</p>
                  <p className="text-xs text-white opacity-60">{usuario?.rol?.nombre_rol}</p>
                </div>
                <ChevronDown size={16} className="text-white" />
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="Acciones de usuario">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold" style={{ color: 'var(--theme-primary-700)' }}>
                  {usuario?.correo_institucional}
                </p>
                <p className="text-xs text-gray-500">{usuario?.unidad_administrativa?.nombre_ua}</p>
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut size={16} />}
                onPress={handleSignOut}
              >
                Cerrar Sesion
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>
      </Navbar>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } bg-white transition-all duration-300 overflow-hidden min-h-[calc(100vh-64px)] shadow-sm`}
          style={{ borderRight: '1px solid var(--theme-primary-200)' }}
        >
          {/* Header del sidebar */}
          <div
            className="p-4"
            style={{
              borderBottom: '1px solid var(--theme-primary-100)',
              backgroundColor: 'var(--theme-primary-50)'
            }}
          >
            <div className="flex items-center gap-2">
              <Shield size={18} style={{ color: 'var(--theme-primary-600)' }} />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--theme-primary-700)' }}
              >
                Menu Principal
              </span>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                style={
                  isActive(item.path)
                    ? {
                        backgroundColor: 'var(--theme-primary-700)',
                        color: 'white',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }
                    : { color: '#374151' }
                }
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'var(--theme-primary-50)';
                    e.currentTarget.style.color = 'var(--theme-primary-700)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}

            {/* Separador */}
            <div
              className="my-4"
              style={{ borderTop: '1px solid var(--theme-primary-100)' }}
            />

            {/* Catalogos - Solo admin */}
            {isAdminUA && (
              <>
                <div className="px-4 py-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--theme-primary-400)' }}
                  >
                    Administracion
                  </span>
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="light"
                      className="w-full justify-start gap-3 px-4 py-3 h-auto text-gray-700"
                      startContent={<Settings size={20} />}
                      endContent={<ChevronDown size={16} />}
                    >
                      Catalogos
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Catalogos">
                    {catalogosItems.map((item) => (
                      <DropdownItem
                        key={item.key}
                        startContent={
                          <item.icon
                            size={16}
                            style={{ color: 'var(--theme-primary-600)' }}
                          />
                        }
                        onPress={() => navigate(item.path)}
                        className="text-gray-700"
                      >
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>

                {/* Usuarios - Solo admin */}
                <Link
                  to="/usuarios"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200"
                  style={
                    isActive('/usuarios')
                      ? {
                          backgroundColor: 'var(--theme-primary-700)',
                          color: 'white',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }
                      : { color: '#374151' }
                  }
                >
                  <Users size={20} />
                  <span className="font-medium">Usuarios</span>
                </Link>
              </>
            )}
          </nav>

          {/* Footer del sidebar */}
          <div
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{
              borderTop: '1px solid var(--theme-primary-100)',
              backgroundColor: 'var(--theme-primary-50)'
            }}
          >
            <div className="text-center">
              <p
                className="text-xs"
                style={{ color: 'var(--theme-primary-500)' }}
              >
                SISGEDI v2.0
              </p>
              <p className="text-xs text-gray-400">Gestion Documental</p>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main
          className={`flex-1 p-6 ${sidebarOpen ? '' : 'ml-0'} min-h-[calc(100vh-64px)]`}
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        >
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
