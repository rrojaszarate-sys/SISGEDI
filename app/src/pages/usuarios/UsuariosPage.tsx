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
} from '@nextui-org/react';
import { Plus, Search, Edit, Users, UserX, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import type { Usuario, Rol, UnidadAdministrativa } from '../../types/database';

interface UsuarioExtendido extends Usuario {
  cat_roles?: Rol;
  cat_unidad_administrativa?: UnidadAdministrativa;
}

export default function UsuariosPage() {
  const { usuario: currentUser, isAdmin } = useAuth();
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
        id_ua: currentUser?.id_ua || '',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-primary" />
            Usuarios del Sistema
          </h1>
          <p className="text-gray-500">Gestión de usuarios y permisos</p>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={() => handleOpenModal()}>
          Nuevo Usuario
        </Button>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar usuario..."
        value={search}
        onValueChange={setSearch}
        startContent={<Search size={18} className="text-gray-400" />}
        className="max-w-md"
      />

      {/* Tabla */}
      <Table aria-label="Usuarios">
        <TableHeader>
          <TableColumn>USUARIO</TableColumn>
          <TableColumn>CLAVE</TableColumn>
          <TableColumn>UNIDAD</TableColumn>
          <TableColumn>ROL</TableColumn>
          <TableColumn>ESTATUS</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={filteredUsers} isLoading={loading} emptyContent="Sin usuarios">
          {(user) => (
            <TableRow key={user.id_usuario}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
                    size="sm"
                    name={user.nombre_completo.charAt(0)}
                    className="bg-primary text-white"
                  />
                  <div>
                    <p className="font-medium">{user.nombre_completo}</p>
                    <p className="text-xs text-gray-500">{user.correo_institucional}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.clave_servidor_publico}</TableCell>
              <TableCell className="text-sm">
                {user.cat_unidad_administrativa?.nombre_ua || '-'}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {user.cat_roles?.nombre_rol || '-'}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" color={getStatusColor(user.estatus)}>
                  {user.estatus}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Tooltip content="Editar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleOpenModal(user)}
                    >
                      <Edit size={16} />
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

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre Completo"
                placeholder="Nombre del servidor público"
                value={formData.nombre_completo}
                onValueChange={(v) => setFormData({ ...formData, nombre_completo: v })}
                isRequired
              />
              <Input
                label="Clave de Servidor Público"
                placeholder="CSP-001"
                value={formData.clave_servidor_publico}
                onValueChange={(v) => setFormData({ ...formData, clave_servidor_publico: v })}
                isRequired
              />
              <Input
                type="email"
                label="Correo Institucional"
                placeholder="correo@institucion.gob.mx"
                value={formData.correo_institucional}
                onValueChange={(v) => setFormData({ ...formData, correo_institucional: v })}
                isRequired
              />
              <Input
                label="Teléfono"
                placeholder="55-1234-5678"
                value={formData.telefono}
                onValueChange={(v) => setFormData({ ...formData, telefono: v })}
              />
              <Select
                label="Unidad Administrativa"
                selectedKeys={formData.id_ua ? [formData.id_ua] : []}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, id_ua: Array.from(keys)[0] as string })
                }
                isRequired
                isDisabled={!isAdmin}
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
            <Button color="primary" onPress={handleSubmit}>
              {editingUser ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
