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
  Card,
  CardBody,
} from '@nextui-org/react';
import { Plus, Search, Edit, Trash2, Building2, RefreshCw } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { devUnidades } from '../../lib/devStorage';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { UnidadAdministrativa } from '../../types/database';

const nivelesJerarquicos = [
  { key: '1', label: 'Subsecretaria' },
  { key: '2', label: 'Direccion General' },
  { key: '3', label: 'Direccion' },
  { key: '4', label: 'Jefatura/Subdireccion' },
];

export default function UnidadesAdminPage() {
  const { isDevMode } = useAuth();
  const [unidades, setUnidades] = useState<UnidadAdministrativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUA, setEditingUA] = useState<UnidadAdministrativa | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    nombre_ua: '',
    codigo_ua: '',
    nivel_jerarquico: '1',
    id_ua_superior: '',
    direccion: '',
    telefono: '',
    extension: '',
  });

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    setLoading(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const data = devUnidades.getAll();
      setUnidades(data);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cat_unidad_administrativa')
      .select('*')
      .order('nivel_jerarquico', { ascending: true });

    if (error) {
      toast.error('Error al cargar unidades administrativas');
    } else {
      setUnidades(data || []);
    }
    setLoading(false);
  };

  const handleOpenModal = (ua?: UnidadAdministrativa) => {
    if (ua) {
      setEditingUA(ua);
      setFormData({
        nombre_ua: ua.nombre_ua,
        codigo_ua: ua.codigo_ua || '',
        nivel_jerarquico: String(ua.nivel_jerarquico),
        id_ua_superior: ua.id_ua_superior || '',
        direccion: ua.direccion || '',
        telefono: ua.telefono || '',
        extension: ua.extension || '',
      });
    } else {
      setEditingUA(null);
      setFormData({
        nombre_ua: '',
        codigo_ua: '',
        nivel_jerarquico: '1',
        id_ua_superior: '',
        direccion: '',
        telefono: '',
        extension: '',
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.nombre_ua) {
      toast.error('El nombre es requerido');
      return;
    }

    const payload = {
      nombre_ua: formData.nombre_ua,
      codigo_ua: formData.codigo_ua || null,
      nivel_jerarquico: parseInt(formData.nivel_jerarquico),
      id_ua_superior: formData.id_ua_superior || null,
      direccion: formData.direccion || null,
      telefono: formData.telefono || null,
      extension: formData.extension || null,
      estatus: true,
    };

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      if (editingUA) {
        devUnidades.update(editingUA.id_ua, payload);
        toast.success('Unidad actualizada correctamente');
      } else {
        devUnidades.create(payload);
        toast.success('Unidad creada correctamente');
      }
      fetchUnidades();
      onClose();
      return;
    }

    if (editingUA) {
      const { error } = await supabase
        .from('cat_unidad_administrativa')
        .update(payload)
        .eq('id_ua', editingUA.id_ua);

      if (error) {
        toast.error('Error al actualizar');
      } else {
        toast.success('Unidad actualizada correctamente');
        fetchUnidades();
        onClose();
      }
    } else {
      const { error } = await supabase
        .from('cat_unidad_administrativa')
        .insert(payload);

      if (error) {
        toast.error('Error al crear unidad');
      } else {
        toast.success('Unidad creada correctamente');
        fetchUnidades();
        onClose();
      }
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm('Estas seguro de eliminar esta unidad?')) return;

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      devUnidades.delete(id);
      toast.success(`"${nombre}" desactivada correctamente`);
      fetchUnidades();
      return;
    }

    const { error } = await supabase
      .from('cat_unidad_administrativa')
      .update({ estatus: false })
      .eq('id_ua', id);

    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Unidad desactivada');
      fetchUnidades();
    }
  };

  const getNivelLabel = (nivel: number) => {
    return nivelesJerarquicos.find((n) => n.key === String(nivel))?.label || 'N/A';
  };

  const filteredUnidades = unidades.filter(
    (ua) =>
      ua.nombre_ua.toLowerCase().includes(search.toLowerCase()) ||
      ua.codigo_ua?.toLowerCase().includes(search.toLowerCase())
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
            <Building2 style={{ color: 'var(--theme-primary-600)' }} />
            Unidades Administrativas
          </h1>
          <p className="text-sm text-gray-500">Gestion de la estructura organizacional</p>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly variant="flat" onPress={fetchUnidades} isLoading={loading}>
            <RefreshCw size={18} />
          </Button>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            style={{ backgroundColor: 'var(--theme-primary-700)' }}
            onPress={() => handleOpenModal()}
          >
            <span className="hidden sm:inline">Nueva Unidad</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      </div>

      {/* Busqueda */}
      <Card className="shadow-sm">
        <CardBody className="p-3 sm:p-4">
          <Input
            placeholder="Buscar unidad..."
            value={search}
            onValueChange={setSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            size="sm"
          />
        </CardBody>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm overflow-hidden">
        <Table aria-label="Unidades Administrativas" removeWrapper>
          <TableHeader>
            <TableColumn className="text-xs">CODIGO</TableColumn>
            <TableColumn className="text-xs">NOMBRE</TableColumn>
            <TableColumn className="text-xs hidden md:table-cell">NIVEL</TableColumn>
            <TableColumn className="text-xs">ESTATUS</TableColumn>
            <TableColumn className="text-xs">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody
            items={filteredUnidades}
            isLoading={loading}
            emptyContent="No hay unidades registradas"
          >
            {(ua) => (
              <TableRow key={ua.id_ua} className="hover:bg-gray-50">
                <TableCell>
                  <span
                    className="font-mono text-xs sm:text-sm"
                    style={{ color: 'var(--theme-primary-700)' }}
                  >
                    {ua.codigo_ua || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs sm:text-sm font-medium">{ua.nombre_ua}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Chip size="sm" variant="flat">
                    <span className="text-[10px]">{getNivelLabel(ua.nivel_jerarquico)}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={ua.estatus ? 'success' : 'danger'} variant="flat">
                    <span className="text-[10px]">{ua.estatus ? 'Activo' : 'Inactivo'}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpenModal(ua)}
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
                        onPress={() => handleDelete(ua.id_ua, ua.nombre_ua)}
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
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader style={{ color: 'var(--theme-primary-700)' }}>
            {editingUA ? 'Editar Unidad Administrativa' : 'Nueva Unidad Administrativa'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Nombre de la unidad"
                value={formData.nombre_ua}
                onValueChange={(v) => setFormData({ ...formData, nombre_ua: v })}
                isRequired
                size="sm"
              />
              <Input
                label="Codigo"
                placeholder="Ej: DG-001"
                value={formData.codigo_ua}
                onValueChange={(v) => setFormData({ ...formData, codigo_ua: v })}
                size="sm"
              />
              <Select
                label="Nivel Jerarquico"
                selectedKeys={[formData.nivel_jerarquico]}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, nivel_jerarquico: Array.from(keys)[0] as string })
                }
                size="sm"
              >
                {nivelesJerarquicos.map((nivel) => (
                  <SelectItem key={nivel.key}>{nivel.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="Unidad Superior"
                selectedKeys={formData.id_ua_superior ? [formData.id_ua_superior] : []}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, id_ua_superior: Array.from(keys)[0] as string || '' })
                }
                size="sm"
              >
                {unidades
                  .filter((ua) => ua.id_ua !== editingUA?.id_ua)
                  .map((ua) => (
                    <SelectItem key={ua.id_ua}>{ua.nombre_ua}</SelectItem>
                  ))}
              </Select>
              <Input
                label="Direccion"
                placeholder="Direccion fisica"
                value={formData.direccion}
                onValueChange={(v) => setFormData({ ...formData, direccion: v })}
                className="sm:col-span-2"
                size="sm"
              />
              <Input
                label="Telefono"
                placeholder="55-1234-5678"
                value={formData.telefono}
                onValueChange={(v) => setFormData({ ...formData, telefono: v })}
                size="sm"
              />
              <Input
                label="Extension"
                placeholder="1234"
                value={formData.extension}
                onValueChange={(v) => setFormData({ ...formData, extension: v })}
                size="sm"
              />
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
              {editingUA ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - {filteredUnidades.length} unidades (datos persistidos en localStorage)
        </p>
      )}
    </div>
  );
}
