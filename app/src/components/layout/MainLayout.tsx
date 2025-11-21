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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const menuItems = [
  { key: 'dashboard', label: 'Inicio', icon: Home, path: '/' },
  { key: 'documentos', label: 'Documentos Entrantes', icon: FileText, path: '/documentos' },
  { key: 'turnado', label: 'Bandeja de Turnados', icon: Send, path: '/turnado' },
  { key: 'salientes', label: 'Documentos Salientes', icon: FolderOpen, path: '/salientes' },
  { key: 'inventario', label: 'Inventario', icon: Package, path: '/inventario' },
  { key: 'busqueda', label: 'Búsqueda', icon: Search, path: '/busqueda' },
];

const catalogosItems = [
  { key: 'unidades', label: 'Unidades Administrativas', icon: Building2, path: '/catalogos/unidades' },
  { key: 'roles', label: 'Roles', icon: UserCog, path: '/catalogos/roles' },
  { key: 'valores', label: 'Catálogos', icon: ListTree, path: '/catalogos/valores' },
];

export default function MainLayout() {
  const { usuario, signOut, isAdmin, isAdminUA } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar superior */}
      <Navbar isBordered className="bg-white shadow-sm" maxWidth="full">
        <NavbarBrand className="gap-3">
          <Button
            isIconOnly
            variant="light"
            onPress={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="text-primary" size={28} />
            <span className="font-bold text-xl text-primary">SISGEDI</span>
          </div>
        </NavbarBrand>

        <NavbarContent justify="end" className="gap-4">
          {/* Búsqueda rápida */}
          <NavbarItem>
            <Button
              variant="flat"
              startContent={<Search size={18} />}
              onPress={() => navigate('/busqueda')}
            >
              Buscar
            </Button>
          </NavbarItem>

          {/* Notificaciones */}
          <NavbarItem>
            <Badge content="3" color="danger" size="sm">
              <Button isIconOnly variant="light">
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
                  className="bg-primary text-white"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{usuario?.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{usuario?.rol?.nombre_rol}</p>
                </div>
                <ChevronDown size={16} />
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="Acciones de usuario">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{usuario?.correo_institucional}</p>
                <p className="text-xs text-gray-500">{usuario?.unidad_administrativa?.nombre_ua}</p>
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut size={16} />}
                onPress={handleSignOut}
              >
                Cerrar Sesión
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
          } bg-white border-r transition-all duration-300 overflow-hidden min-h-[calc(100vh-64px)]`}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Separador */}
            <div className="border-t my-4" />

            {/* Catálogos - Solo admin */}
            {isAdminUA && (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="light"
                    className="w-full justify-start gap-3 px-4 py-3 h-auto"
                    startContent={<Settings size={20} />}
                    endContent={<ChevronDown size={16} />}
                  >
                    Catálogos
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Catálogos">
                  {catalogosItems.map((item) => (
                    <DropdownItem
                      key={item.key}
                      startContent={<item.icon size={16} />}
                      onPress={() => navigate(item.path)}
                    >
                      {item.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}

            {/* Usuarios - Solo admin */}
            {isAdminUA && (
              <Link
                to="/usuarios"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/usuarios')
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users size={20} />
                <span>Usuarios</span>
              </Link>
            )}
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className={`flex-1 p-6 ${sidebarOpen ? '' : 'ml-0'}`}>
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
