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
} from '@nextui-org/react';
import { Plus, Search, Edit, UserCog } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { Rol } from '../../types/database';

const modulosDisponibles = [
  { key: 'admin', label: 'Administración' },
  { key: 'admin_usuarios', label: 'Gestión de Usuarios' },
  { key: 'doc_entrante', label: 'Documentos Entrantes' },
  { key: 'seguimiento', label: 'Seguimiento/Turnado' },
  { key: 'doc_saliente', label: 'Documentos Salientes' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'consultas', label: 'Consultas/Búsqueda' },
  { key: 'auditoria', label: 'Auditoría' },
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
    };

    if (editingRol) {
      const { error } = await supabase
        .from('cat_roles')
        .update(payload)
        .eq('id_rol', editingRol.id_rol);

      if (error) {
        toast.error('Error al actualizar rol');
      } else {
        toast.success('Rol actualizado correctamente');
        fetchRoles();
        onClose();
      }
    } else {
      const { error } = await supabase.from('cat_roles').insert(payload);

      if (error) {
        toast.error('Error al crear rol');
      } else {
        toast.success('Rol creado correctamente');
        fetchRoles();
        onClose();
      }
    }
  };

  const filteredRoles = roles.filter((rol) =>
    rol.nombre_rol.toLowerCase().includes(search.toLowerCase())
  );

  const getModulosCount = (rol: Rol) => {
    const menu = rol.elementos_menu as { modulos?: string[] };
    return menu?.modulos?.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="text-primary" />
            Roles del Sistema
          </h1>
          <p className="text-gray-500">Gestión de permisos y accesos</p>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={() => handleOpenModal()}>
          Nuevo Rol
        </Button>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar rol..."
        value={search}
        onValueChange={setSearch}
        startContent={<Search size={18} className="text-gray-400" />}
        className="max-w-md"
      />

      {/* Tabla */}
      <Table aria-label="Roles del sistema">
        <TableHeader>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn>MÓDULOS</TableColumn>
          <TableColumn>ESTATUS</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={filteredRoles} isLoading={loading} emptyContent="No hay roles">
          {(rol) => (
            <TableRow key={rol.id_rol}>
              <TableCell className="font-medium">{rol.nombre_rol}</TableCell>
              <TableCell className="text-gray-500 max-w-xs truncate">
                {rol.descripcion || '-'}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {getModulosCount(rol)} módulos
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" color={rol.estatus ? 'success' : 'danger'}>
                  {rol.estatus ? 'Activo' : 'Inactivo'}
                </Chip>
              </TableCell>
              <TableCell>
                <Tooltip content="Editar">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleOpenModal(rol)}
                  >
                    <Edit size={16} />
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingRol ? 'Editar Rol' : 'Nuevo Rol'}</ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre del Rol"
                  placeholder="Ej: Supervisor"
                  value={formData.nombre_rol}
                  onValueChange={(v) => setFormData({ ...formData, nombre_rol: v })}
                  isRequired
                />
                <Textarea
                  label="Descripción"
                  placeholder="Descripción del rol..."
                  value={formData.descripcion}
                  onValueChange={(v) => setFormData({ ...formData, descripcion: v })}
                />
              </div>

              <div>
                <p className="font-medium mb-3">Módulos Permitidos</p>
                <CheckboxGroup
                  value={formData.modulos}
                  onValueChange={(v) => setFormData({ ...formData, modulos: v })}
                  orientation="horizontal"
                  className="gap-4"
                >
                  {modulosDisponibles.map((mod) => (
                    <Checkbox key={mod.key} value={mod.key}>
                      {mod.label}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </div>

              <div>
                <p className="font-medium mb-3">Acciones Permitidas</p>
                <CheckboxGroup
                  value={formData.acciones}
                  onValueChange={(v) => setFormData({ ...formData, acciones: v })}
                  orientation="horizontal"
                  className="gap-4"
                >
                  {accionesDisponibles.map((acc) => (
                    <Checkbox key={acc.key} value={acc.key}>
                      {acc.label}
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
            <Button color="primary" onPress={handleSubmit}>
              {editingRol ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
