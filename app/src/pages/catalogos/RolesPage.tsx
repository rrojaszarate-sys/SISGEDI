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
  Tooltip,
  Textarea,
  CheckboxGroup,
  Checkbox,
  Card,
  CardBody,
} from '@nextui-org/react';
import { Plus, Search, Edit, UserCog, RefreshCw, Trash2 } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { Rol } from '../../types/database';
import { devRoles } from '../../lib/devStorage';

const modulosDisponibles = [
  { key: 'admin', label: 'Administracion' },
  { key: 'admin_usuarios', label: 'Gestion de Usuarios' },
  { key: 'doc_entrante', label: 'Documentos Entrantes' },
  { key: 'seguimiento', label: 'Seguimiento/Turnado' },
  { key: 'doc_saliente', label: 'Documentos Salientes' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'consultas', label: 'Consultas/Busqueda' },
  { key: 'auditoria', label: 'Auditoria' },
  { key: 'inventario', label: 'Inventario' },
];

const accionesDisponibles = [
  { key: 'crear', label: 'Crear' },
  { key: 'editar', label: 'Editar' },
  { key: 'eliminar', label: 'Eliminar' },
  { key: 'turnar', label: 'Turnar' },
  { key: 'firmar', label: 'Firmar' },
  { key: 'rechazar', label: 'Rechazar' },
  { key: 'concluir', label: 'Concluir' },
  { key: 'exportar', label: 'Exportar' },
  { key: 'ver', label: 'Ver' },
  { key: 'avance', label: 'Registrar Avance' },
  { key: 'elaborar', label: 'Elaborar Documentos' },
];


export default function RolesPage() {
  const { isDevMode } = useAuth();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingRol, setEditingRol] = useState<Rol | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    nombre_rol: '',
    descripcion: '',
    modulos: [] as string[],
    acciones: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const data = devRoles.getAll();
      setRoles(data);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cat_roles')
      .select('*')
      .order('nombre_rol');

    if (error) {
      toast.error('Error al cargar roles');
    } else {
      setRoles(data || []);
    }
    setLoading(false);
  };

  const handleOpenModal = (rol?: Rol) => {
    if (rol) {
      setEditingRol(rol);
      const menu = rol.elementos_menu as { modulos?: string[]; acciones?: string[] };
      setFormData({
        nombre_rol: rol.nombre_rol,
        descripcion: rol.descripcion || '',
        modulos: menu?.modulos || [],
        acciones: menu?.acciones || [],
      });
    } else {
      setEditingRol(null);
      setFormData({
        nombre_rol: '',
        descripcion: '',
        modulos: [],
        acciones: [],
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.nombre_rol) {
      toast.error('El nombre del rol es requerido');
      return;
    }

    const payload = {
      nombre_rol: formData.nombre_rol,
      descripcion: formData.descripcion || null,
      elementos_menu: {
        modulos: formData.modulos,
        acciones: formData.acciones,
      },
      estatus: true,
    };

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      if (editingRol) {
        devRoles.update(editingRol.id_rol, payload);
        toast.success('Rol actualizado correctamente');
      } else {
        devRoles.create(payload);
        toast.success('Rol creado correctamente');
      }
      await fetchRoles();
      onClose();
      return;
    }

    if (editingRol) {
      const { error } = await supabase
        .from('cat_roles')
        .update(payload)
        .eq('id_rol', editingRol.id_rol);

      if (error) {
        toast.error('Error al actualizar rol');
      } else {
        toast.success('Rol actualizado correctamente');
        await fetchRoles();
        onClose();
      }
    } else {
      const { error } = await supabase.from('cat_roles').insert(payload);

      if (error) {
        toast.error('Error al crear rol');
      } else {
        toast.success('Rol creado correctamente');
        await fetchRoles();
        onClose();
      }
    }
  };

  const handleDelete = async (rol: Rol) => {
    if (!confirm(`¿Estas seguro de eliminar el rol "${rol.nombre_rol}"?`)) {
      return;
    }

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      devRoles.delete(rol.id_rol);
      toast.success('Rol eliminado correctamente');
      await fetchRoles();
      return;
    }

    const { error } = await supabase
      .from('cat_roles')
      .update({ estatus: false })
      .eq('id_rol', rol.id_rol);

    if (error) {
      toast.error('Error al eliminar rol');
    } else {
      toast.success('Rol eliminado correctamente');
      await fetchRoles();
    }
  };

  const filteredRoles = roles.filter((rol) =>
    rol.nombre_rol.toLowerCase().includes(search.toLowerCase())
  );

  const getModulosCount = (rol: Rol) => {
    const menu = rol.elementos_menu as { modulos?: string[] };
    return menu?.modulos?.length || 0;
  };

  const getAccionesCount = (rol: Rol) => {
    const menu = rol.elementos_menu as { acciones?: string[] };
    return menu?.acciones?.length || 0;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--theme-primary-800)' }}
          >
            <UserCog style={{ color: 'var(--theme-primary-600)' }} />
            Roles del Sistema
          </h1>
          <p className="text-sm text-gray-500">Gestion de permisos y accesos</p>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly variant="flat" onPress={fetchRoles} isLoading={loading}>
            <RefreshCw size={18} />
          </Button>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            style={{ backgroundColor: 'var(--theme-primary-700)' }}
            onPress={() => handleOpenModal()}
          >
            <span className="hidden sm:inline">Nuevo Rol</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Busqueda */}
      <Card className="shadow-sm">
        <CardBody className="p-3 sm:p-4">
          <Input
            placeholder="Buscar rol..."
            value={search}
            onValueChange={setSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            size="sm"
          />
        </CardBody>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm overflow-hidden">
        <Table aria-label="Roles del sistema" removeWrapper>
          <TableHeader>
            <TableColumn className="text-xs">NOMBRE</TableColumn>
            <TableColumn className="text-xs hidden md:table-cell">DESCRIPCION</TableColumn>
            <TableColumn className="text-xs">MODULOS</TableColumn>
            <TableColumn className="text-xs hidden sm:table-cell">PERMISOS</TableColumn>
            <TableColumn className="text-xs">ESTATUS</TableColumn>
            <TableColumn className="text-xs">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody items={filteredRoles} isLoading={loading} emptyContent="No hay roles">
            {(rol) => (
              <TableRow key={rol.id_rol} className="hover:bg-gray-50">
                <TableCell>
                  <span
                    className="text-xs sm:text-sm font-medium"
                    style={{ color: 'var(--theme-primary-700)' }}
                  >
                    {rol.nombre_rol}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs text-gray-500 truncate max-w-xs">
                    {rol.descripcion || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="primary">
                    <span className="text-[10px]">{getModulosCount(rol)} modulos</span>
                  </Chip>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Chip size="sm" variant="flat" color="secondary">
                    <span className="text-[10px]">{getAccionesCount(rol)} acciones</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={rol.estatus ? 'success' : 'danger'} variant="flat">
                    <span className="text-[10px]">{rol.estatus ? 'Activo' : 'Inactivo'}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpenModal(rol)}
                      >
                        <Edit size={16} style={{ color: 'var(--theme-primary-600)' }} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Eliminar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDelete(rol)}
                      >
                        <Trash2 size={16} />
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
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader style={{ color: 'var(--theme-primary-700)' }}>
            {editingRol ? 'Editar Rol' : 'Nuevo Rol'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre del Rol"
                  placeholder="Ej: Supervisor"
                  value={formData.nombre_rol}
                  onValueChange={(v) => setFormData({ ...formData, nombre_rol: v })}
                  isRequired
                  size="sm"
                />
                <Textarea
                  label="Descripcion"
                  placeholder="Descripcion del rol..."
                  value={formData.descripcion}
                  onValueChange={(v) => setFormData({ ...formData, descripcion: v })}
                  size="sm"
                />
              </div>

              <div>
                <p className="font-medium mb-3 text-sm" style={{ color: 'var(--theme-primary-700)' }}>
                  Modulos Permitidos
                </p>
                <CheckboxGroup
                  value={formData.modulos}
                  onValueChange={(v) => setFormData({ ...formData, modulos: v })}
                  orientation="horizontal"
                  className="gap-3 flex-wrap"
                >
                  {modulosDisponibles.map((mod) => (
                    <Checkbox key={mod.key} value={mod.key} size="sm">
                      <span className="text-xs">{mod.label}</span>
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </div>

              <div>
                <p className="font-medium mb-3 text-sm" style={{ color: 'var(--theme-primary-700)' }}>
                  Acciones Permitidas
                </p>
                <CheckboxGroup
                  value={formData.acciones}
                  onValueChange={(v) => setFormData({ ...formData, acciones: v })}
                  orientation="horizontal"
                  className="gap-3 flex-wrap"
                >
                  {accionesDisponibles.map((acc) => (
                    <Checkbox key={acc.key} value={acc.key} size="sm">
                      <span className="text-xs">{acc.label}</span>
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </div>
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
              {editingRol ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Mostrando {filteredRoles.length} roles de ejemplo
        </p>
      )}
    </div>
  );
}
