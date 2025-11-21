import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Select,
  SelectItem,
  Tooltip,
  Avatar,
  Card,
  CardBody,
} from '@nextui-org/react';
import { Plus, Search, Edit, Users, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { devUsuarios, devRoles, devUnidades } from '../../lib/devStorage';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import type { Usuario, Rol, UnidadAdministrativa } from '../../types/database';

interface UsuarioExtendido extends Usuario {
  cat_roles?: Rol;
  cat_unidad_administrativa?: UnidadAdministrativa;
}

export default function UsuariosPage() {
  const { usuario: currentUser, isAdmin, isDevMode } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioExtendido[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [unidades, setUnidades] = useState<UnidadAdministrativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UsuarioExtendido | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    clave_servidor_publico: '',
    nombre_completo: '',
    correo_institucional: '',
    telefono: '',
    id_ua: '',
    id_rol: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      // Obtener datos desde devStorage
      const rolesData = devRoles.getActive();
      const unidadesData = devUnidades.getActive();
      const usuariosData = devUsuarios.getAll();

      // Expandir usuarios con sus relaciones
      const usuariosExtendidos: UsuarioExtendido[] = usuariosData.map(usr => ({
        ...usr,
        cat_roles: rolesData.find(r => r.id_rol === usr.id_rol),
        cat_unidad_administrativa: unidadesData.find(u => u.id_ua === usr.id_ua),
      }));

      // Si no es admin, filtrar por UA
      const usuariosFiltrados = isAdmin
        ? usuariosExtendidos
        : usuariosExtendidos.filter(u => u.id_ua === currentUser?.id_ua);

      setUsuarios(usuariosFiltrados);
      setRoles(rolesData);
      setUnidades(unidadesData);
      setLoading(false);
      return;
    }

    // Fetch usuarios
    let query = supabase
      .from('tbl_usuarios')
      .select(`*, cat_roles(*), cat_unidad_administrativa(*)`)
      .order('nombre_completo');

    // Si no es admin general, solo ver usuarios de su UA
    if (!isAdmin && currentUser?.id_ua) {
      query = query.eq('id_ua', currentUser.id_ua);
    }

    const { data: usersData } = await query;
    setUsuarios(usersData || []);

    // Fetch roles
    const { data: rolesData } = await supabase
      .from('cat_roles')
      .select('*')
      .eq('estatus', true);
    setRoles(rolesData || []);

    // Fetch unidades
    const { data: uasData } = await supabase
      .from('cat_unidad_administrativa')
      .select('*')
      .eq('estatus', true);
    setUnidades(uasData || []);

    setLoading(false);
  };

  const handleOpenModal = (user?: UsuarioExtendido) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        clave_servidor_publico: user.clave_servidor_publico,
        nombre_completo: user.nombre_completo,
        correo_institucional: user.correo_institucional,
        telefono: user.telefono || '',
        id_ua: user.id_ua,
        id_rol: user.id_rol,
      });
    } else {
      setEditingUser(null);
      setFormData({
        clave_servidor_publico: '',
        nombre_completo: '',
        correo_institucional: '',
        telefono: '',
        id_ua: currentUser?.unidad_administrativa?.id_ua || '',
        id_rol: '',
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.nombre_completo || !formData.correo_institucional || !formData.id_rol) {
      toast.error('Completa los campos requeridos');
      return;
    }

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      if (editingUser) {
        // Actualizar usuario existente
        const updated = devUsuarios.update(editingUser.id_usuario, {
          clave_servidor_publico: formData.clave_servidor_publico,
          nombre_completo: formData.nombre_completo,
          correo_institucional: formData.correo_institucional,
          telefono: formData.telefono || null,
          id_ua: formData.id_ua,
          id_rol: formData.id_rol,
        });
        if (updated) {
          toast.success('Usuario actualizado');
          await fetchData();
          onClose();
        } else {
          toast.error('Error al actualizar usuario');
        }
      } else {
        // Crear nuevo usuario
        devUsuarios.create({
          clave_servidor_publico: formData.clave_servidor_publico,
          nombre_completo: formData.nombre_completo,
          correo_institucional: formData.correo_institucional,
          telefono: formData.telefono || null,
          id_ua: formData.id_ua,
          id_rol: formData.id_rol,
          estatus: 'Activo',
        });
        toast.success('Usuario creado');
        await fetchData();
        onClose();
      }
      return;
    }

    if (editingUser) {
      const { error } = await supabase
        .from('tbl_usuarios')
        .update({
          clave_servidor_publico: formData.clave_servidor_publico,
          nombre_completo: formData.nombre_completo,
          correo_institucional: formData.correo_institucional,
          telefono: formData.telefono || null,
          id_ua: formData.id_ua,
          id_rol: formData.id_rol,
        })
        .eq('id_usuario', editingUser.id_usuario);

      if (error) {
        toast.error('Error al actualizar usuario');
      } else {
        toast.success('Usuario actualizado');
        fetchData();
        onClose();
      }
    } else {
      toast.info('Para crear usuarios, usa el panel de Supabase Auth');
    }
  };

  const handleToggleStatus = async (user: UsuarioExtendido) => {
    const newStatus = user.estatus === 'Activo' ? 'Inhabilitado' : 'Activo';

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const updated = devUsuarios.toggleStatus(user.id_usuario);
      if (updated) {
        toast.success(`Usuario ${newStatus === 'Activo' ? 'activado' : 'inhabilitado'}`);
        await fetchData();
      } else {
        toast.error('Error al cambiar estatus');
      }
      return;
    }

    const { error } = await supabase
      .from('tbl_usuarios')
      .update({ estatus: newStatus })
      .eq('id_usuario', user.id_usuario);

    if (error) {
      toast.error('Error al cambiar estatus');
    } else {
      toast.success(`Usuario ${newStatus === 'Activo' ? 'activado' : 'inhabilitado'}`);
      fetchData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'success';
      case 'Inhabilitado': return 'warning';
      case 'Suspendido': return 'danger';
      default: return 'default';
    }
  };

  const filteredUsers = usuarios.filter(
    (u) =>
      u.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
      u.correo_institucional.toLowerCase().includes(search.toLowerCase()) ||
      u.clave_servidor_publico.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--theme-primary-800)' }}
          >
            <Users style={{ color: 'var(--theme-primary-600)' }} />
            Usuarios del Sistema
          </h1>
          <p className="text-sm text-gray-500">Gestion de usuarios y permisos</p>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly variant="flat" onPress={fetchData} isLoading={loading}>
            <RefreshCw size={18} />
          </Button>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            style={{ backgroundColor: 'var(--theme-primary-700)' }}
            onPress={() => handleOpenModal()}
          >
            <span className="hidden sm:inline">Nuevo Usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Busqueda */}
      <Card className="shadow-sm">
        <CardBody className="p-3 sm:p-4">
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onValueChange={setSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            size="sm"
          />
        </CardBody>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm overflow-hidden">
        <Table aria-label="Usuarios" removeWrapper>
          <TableHeader>
            <TableColumn className="text-xs">USUARIO</TableColumn>
            <TableColumn className="text-xs hidden md:table-cell">CLAVE</TableColumn>
            <TableColumn className="text-xs hidden lg:table-cell">UNIDAD</TableColumn>
            <TableColumn className="text-xs hidden sm:table-cell">ROL</TableColumn>
            <TableColumn className="text-xs">ESTATUS</TableColumn>
            <TableColumn className="text-xs">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody items={filteredUsers} isLoading={loading} emptyContent="Sin usuarios">
            {(user) => (
              <TableRow key={user.id_usuario} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar
                      size="sm"
                      name={user.nombre_completo.charAt(0)}
                      style={{ backgroundColor: 'var(--theme-primary-600)' }}
                      className="text-white w-7 h-7 sm:w-8 sm:h-8 text-xs"
                    />
                    <div className="min-w-0">
                      <p
                        className="text-xs sm:text-sm font-medium truncate"
                        style={{ color: 'var(--theme-primary-700)' }}
                      >
                        {user.nombre_completo}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                        {user.correo_institucional}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs font-mono">{user.clave_servidor_publico}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-xs text-gray-600 truncate max-w-[150px]">
                    {user.cat_unidad_administrativa?.nombre_ua || '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Chip size="sm" variant="flat">
                    <span className="text-[10px]">{user.cat_roles?.nombre_rol || '-'}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={getStatusColor(user.estatus)} variant="flat">
                    <span className="text-[10px]">{user.estatus}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpenModal(user)}
                      >
                        <Edit size={16} style={{ color: 'var(--theme-primary-600)' }} />
                      </Button>
                    </Tooltip>
                    <Tooltip content={user.estatus === 'Activo' ? 'Inhabilitar' : 'Activar'}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color={user.estatus === 'Activo' ? 'warning' : 'success'}
                        onPress={() => handleToggleStatus(user)}
                      >
                        {user.estatus === 'Activo' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader style={{ color: 'var(--theme-primary-700)' }}>
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre Completo"
                placeholder="Nombre del servidor publico"
                value={formData.nombre_completo}
                onValueChange={(v) => setFormData({ ...formData, nombre_completo: v })}
                isRequired
                size="sm"
              />
              <Input
                label="Clave de Servidor Publico"
                placeholder="CSP-001"
                value={formData.clave_servidor_publico}
                onValueChange={(v) => setFormData({ ...formData, clave_servidor_publico: v })}
                isRequired
                size="sm"
              />
              <Input
                type="email"
                label="Correo Institucional"
                placeholder="correo@institucion.gob.mx"
                value={formData.correo_institucional}
                onValueChange={(v) => setFormData({ ...formData, correo_institucional: v })}
                isRequired
                size="sm"
              />
              <Input
                label="Telefono"
                placeholder="55-1234-5678"
                value={formData.telefono}
                onValueChange={(v) => setFormData({ ...formData, telefono: v })}
                size="sm"
              />
              <Select
                label="Unidad Administrativa"
                selectedKeys={formData.id_ua ? [formData.id_ua] : []}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, id_ua: Array.from(keys)[0] as string })
                }
                isRequired
                isDisabled={!isAdmin && !(isDevMode || DEV_MODE)}
                size="sm"
              >
                {unidades.map((ua) => (
                  <SelectItem key={ua.id_ua}>{ua.nombre_ua}</SelectItem>
                ))}
              </Select>
              <Select
                label="Rol"
                selectedKeys={formData.id_rol ? [formData.id_rol] : []}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, id_rol: Array.from(keys)[0] as string })
                }
                isRequired
                size="sm"
              >
                {roles.map((rol) => (
                  <SelectItem key={rol.id_rol}>{rol.nombre_rol}</SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              style={{ backgroundColor: 'var(--theme-primary-700)' }}
            >
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Mostrando {filteredUsers.length} usuarios de ejemplo
        </p>
      )}
    </div>
  );
}
