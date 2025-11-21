import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  { key: 'documentos', label: 'Doc. Entrantes', icon: FileText, path: '/documentos' },
  { key: 'turnado', label: 'Turnados', icon: Send, path: '/turnado' },
  { key: 'salientes', label: 'Doc. Salientes', icon: FolderOpen, path: '/salientes' },
  { key: 'inventario', label: 'Inventario', icon: Package, path: '/inventario' },
  { key: 'busqueda', label: 'Busqueda', icon: Search, path: '/busqueda' },
];

const catalogosItems = [
  { key: 'unidades', label: 'Unidades Administrativas', icon: Building2, path: '/catalogos/unidades' },
  { key: 'roles', label: 'Roles', icon: UserCog, path: '/catalogos/roles' },
  { key: 'valores', label: 'Catalogos', icon: ListTree, path: '/catalogos/valores' },
];

export default function MainLayout() {
  const { usuario, signOut, isAdminUA, isDevMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // En desktop, sidebar abierto por defecto
      if (!mobile) {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar sidebar al cambiar de ruta en mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesion cerrada correctamente');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
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
        <NavbarBrand className="gap-2 sm:gap-3">
          <Button
            isIconOnly
            variant="light"
            className="text-white"
            size="sm"
            onPress={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="p-1.5 sm:p-2 rounded-lg"
              style={{ backgroundColor: 'var(--theme-primary-600)' }}
            >
              <FileText className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="hidden xs:block sm:block">
              <span className="font-bold text-base sm:text-xl text-white">SISGEDI</span>
              <p className="text-[10px] sm:text-xs text-white opacity-60 hidden sm:block">Gestion Documental Inteligente</p>
            </div>
          </div>
        </NavbarBrand>

        <NavbarContent justify="end" className="gap-1 sm:gap-2 md:gap-4">
          {/* Badge de modo desarrollo */}
          {isDevMode && (
            <NavbarItem className="hidden md:flex">
              <span className="px-2 py-1 text-[10px] font-bold rounded bg-yellow-500 text-black">
                DEV
              </span>
            </NavbarItem>
          )}

          {/* Busqueda rapida - solo desktop */}
          <NavbarItem className="hidden lg:flex">
            <Button
              variant="flat"
              className="text-white"
              size="sm"
              style={{ backgroundColor: 'var(--theme-primary-600)' }}
              startContent={<Search size={16} />}
              onPress={() => handleMenuClick('/busqueda')}
            >
              Buscar
            </Button>
          </NavbarItem>

          {/* Selector de Tema - solo tablet+ */}
          <NavbarItem className="hidden md:flex">
            <ThemePalettePicker />
          </NavbarItem>

          {/* Notificaciones */}
          <NavbarItem>
            <Badge content="3" color="warning" size="sm">
              <Button
                isIconOnly
                variant="light"
                className="text-white"
                size="sm"
              >
                <Bell size={18} />
              </Button>
            </Badge>
          </NavbarItem>

          {/* Usuario */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div className="flex items-center gap-1 sm:gap-2 cursor-pointer">
                <Avatar
                  size="sm"
                  name={usuario?.nombre_completo?.charAt(0) || 'U'}
                  style={{ backgroundColor: 'var(--theme-secondary)' }}
                  className="text-white w-7 h-7 sm:w-8 sm:h-8"
                />
                <div className="hidden lg:block text-left max-w-[120px]">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">{usuario?.nombre_completo}</p>
                  <p className="text-[10px] sm:text-xs text-white opacity-60 truncate">{usuario?.rol?.nombre_rol}</p>
                </div>
                <ChevronDown size={14} className="text-white hidden sm:block" />
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="Acciones de usuario">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold text-sm" style={{ color: 'var(--theme-primary-700)' }}>
                  {usuario?.correo_institucional}
                </p>
                <p className="text-xs text-gray-500">{usuario?.unidad_administrativa?.nombre_ua}</p>
              </DropdownItem>
              {/* Theme picker en mobile */}
              <DropdownItem key="theme" className="md:hidden">
                <div className="py-1">
                  <ThemePalettePicker />
                </div>
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

      <div className="flex relative">
        {/* Overlay para cerrar sidebar en mobile */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            ${isMobile ? 'fixed left-0 top-[64px] z-30' : 'relative'}
            ${sidebarOpen ? (isMobile ? 'w-64' : 'w-56 lg:w-64') : 'w-0'}
            bg-white transition-all duration-300 overflow-hidden min-h-[calc(100vh-64px)] shadow-lg
          `}
          style={{ borderRight: sidebarOpen ? '1px solid var(--theme-primary-200)' : 'none' }}
        >
          {/* Header del sidebar */}
          <div
            className="p-3 lg:p-4"
            style={{
              borderBottom: '1px solid var(--theme-primary-100)',
              backgroundColor: 'var(--theme-primary-50)'
            }}
          >
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: 'var(--theme-primary-600)' }} />
              <span
                className="text-xs lg:text-sm font-medium"
                style={{ color: 'var(--theme-primary-700)' }}
              >
                Menu Principal
              </span>
            </div>
          </div>

          <nav className="p-2 lg:p-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.path)}
                className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 text-left"
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
                <item.icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}

            {/* Separador */}
            <div
              className="my-3 lg:my-4"
              style={{ borderTop: '1px solid var(--theme-primary-100)' }}
            />

            {/* Catalogos - Solo admin */}
            {isAdminUA && (
              <>
                <div className="px-3 lg:px-4 py-2">
                  <span
                    className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--theme-primary-400)' }}
                  >
                    Administracion
                  </span>
                </div>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="light"
                      className="w-full justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 h-auto text-gray-700 text-sm"
                      startContent={<Settings size={18} />}
                      endContent={<ChevronDown size={14} />}
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
                        onPress={() => handleMenuClick(item.path)}
                        className="text-gray-700"
                      >
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>

                {/* Usuarios - Solo admin */}
                <button
                  onClick={() => handleMenuClick('/usuarios')}
                  className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 text-left"
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
                  <Users size={18} />
                  <span className="font-medium text-sm">Usuarios</span>
                </button>
              </>
            )}
          </nav>

          {/* Footer del sidebar */}
          <div
            className="absolute bottom-0 left-0 right-0 p-3 lg:p-4"
            style={{
              borderTop: '1px solid var(--theme-primary-100)',
              backgroundColor: 'var(--theme-primary-50)'
            }}
          >
            <div className="text-center">
              <p
                className="text-[10px] lg:text-xs"
                style={{ color: 'var(--theme-primary-500)' }}
              >
                SISGEDI v2.0
              </p>
              <p className="text-[10px] lg:text-xs text-gray-400">Gestion Documental Inteligente</p>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main
          className={`flex-1 p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-64px)] transition-all duration-300`}
          style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
        >
          <div className="animate-fade-in max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
