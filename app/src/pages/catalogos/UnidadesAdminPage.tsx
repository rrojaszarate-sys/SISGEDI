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
} from '@nextui-org/react';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { UnidadAdministrativa } from '../../types/database';

const nivelesJerarquicos = [
  { key: '1', label: 'Subsecretaría' },
  { key: '2', label: 'Dirección General' },
  { key: '3', label: 'Dirección' },
  { key: '4', label: 'Jefatura/Subdirección' },
];

export default function UnidadesAdminPage() {
  const [unidades, setUnidades] = useState<UnidadAdministrativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUA, setEditingUA] = useState<UnidadAdministrativa | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Form state
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
    };

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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta unidad?')) return;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="text-primary" />
            Unidades Administrativas
          </h1>
          <p className="text-gray-500">Gestión de la estructura organizacional</p>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={() => handleOpenModal()}>
          Nueva Unidad
        </Button>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar unidad..."
        value={search}
        onValueChange={setSearch}
        startContent={<Search size={18} className="text-gray-400" />}
        className="max-w-md"
      />

      {/* Tabla */}
      <Table aria-label="Unidades Administrativas">
        <TableHeader>
          <TableColumn>CÓDIGO</TableColumn>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>NIVEL</TableColumn>
          <TableColumn>ESTATUS</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody
          items={filteredUnidades}
          isLoading={loading}
          emptyContent="No hay unidades registradas"
        >
          {(ua) => (
            <TableRow key={ua.id_ua}>
              <TableCell>{ua.codigo_ua || '-'}</TableCell>
              <TableCell className="font-medium">{ua.nombre_ua}</TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {getNivelLabel(ua.nivel_jerarquico)}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" color={ua.estatus ? 'success' : 'danger'}>
                  {ua.estatus ? 'Activo' : 'Inactivo'}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Tooltip content="Editar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleOpenModal(ua)}
                    >
                      <Edit size={16} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Eliminar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDelete(ua.id_ua)}
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

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {editingUA ? 'Editar Unidad Administrativa' : 'Nueva Unidad Administrativa'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Nombre de la unidad"
                value={formData.nombre_ua}
                onValueChange={(v) => setFormData({ ...formData, nombre_ua: v })}
                isRequired
              />
              <Input
                label="Código"
                placeholder="Ej: DG-001"
                value={formData.codigo_ua}
                onValueChange={(v) => setFormData({ ...formData, codigo_ua: v })}
              />
              <Select
                label="Nivel Jerárquico"
                selectedKeys={[formData.nivel_jerarquico]}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, nivel_jerarquico: Array.from(keys)[0] as string })
                }
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
              >
                {unidades
                  .filter((ua) => ua.id_ua !== editingUA?.id_ua)
                  .map((ua) => (
                    <SelectItem key={ua.id_ua}>{ua.nombre_ua}</SelectItem>
                  ))}
              </Select>
              <Input
                label="Dirección"
                placeholder="Dirección física"
                value={formData.direccion}
                onValueChange={(v) => setFormData({ ...formData, direccion: v })}
              />
              <div className="flex gap-2">
                <Input
                  label="Teléfono"
                  placeholder="55-1234-5678"
                  value={formData.telefono}
                  onValueChange={(v) => setFormData({ ...formData, telefono: v })}
                />
                <Input
                  label="Extensión"
                  placeholder="1234"
                  value={formData.extension}
                  onValueChange={(v) => setFormData({ ...formData, extension: v })}
                  className="w-32"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingUA ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
