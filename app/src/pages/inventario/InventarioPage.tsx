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
  Pagination,
  Textarea,
} from '@nextui-org/react';
import { Plus, Search, Edit, Package, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { Inventario } from '../../types/database';

const categorias = [
  'Mobiliario',
  'Equipo de Cómputo',
  'Equipo de Oficina',
  'Vehículos',
  'Herramientas',
  'Material de Oficina',
  'Otros',
];

const estados = [
  { key: 'Bueno', label: 'Bueno', color: 'success' },
  { key: 'Regular', label: 'Regular', color: 'warning' },
  { key: 'Malo', label: 'Malo', color: 'danger' },
  { key: 'Baja', label: 'Baja', color: 'default' },
];

export default function InventarioPage() {
  const { usuario } = useAuth();
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingItem, setEditingItem] = useState<Inventario | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    categoria: '',
    descripcion: '',
    cantidad: '1',
    unidad: 'Pieza',
    estado: 'Bueno',
    ubicacion: '',
    responsable: '',
    numero_inventario: '',
    fecha_adquisicion: '',
    valor_unitario: '0',
    proveedor: '',
    marca: '',
    modelo: '',
    serie: '',
  });

  useEffect(() => {
    fetchInventario();
  }, [page]);

  const fetchInventario = async () => {
    setLoading(true);

    const { data, count } = await supabase
      .from('tbl_inventario')
      .select('*', { count: 'exact' })
      .eq('id_ua', usuario?.id_ua)
      .order('fecha_registro', { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

    setInventario(data || []);
    setTotal(count || 0);
    setLoading(false);
  };

  const handleOpenModal = (item?: Inventario) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        categoria: item.categoria,
        descripcion: item.descripcion,
        cantidad: String(item.cantidad),
        unidad: item.unidad,
        estado: item.estado,
        ubicacion: item.ubicacion,
        responsable: item.responsable,
        numero_inventario: item.numero_inventario,
        fecha_adquisicion: item.fecha_adquisicion,
        valor_unitario: String(item.valor_unitario),
        proveedor: item.proveedor || '',
        marca: item.marca || '',
        modelo: item.modelo || '',
        serie: item.serie || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        categoria: '',
        descripcion: '',
        cantidad: '1',
        unidad: 'Pieza',
        estado: 'Bueno',
        ubicacion: '',
        responsable: '',
        numero_inventario: '',
        fecha_adquisicion: new Date().toISOString().split('T')[0],
        valor_unitario: '0',
        proveedor: '',
        marca: '',
        modelo: '',
        serie: '',
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.descripcion || !formData.numero_inventario || !formData.categoria) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const payload = {
      id_ua: usuario?.id_ua,
      categoria: formData.categoria,
      descripcion: formData.descripcion,
      cantidad: parseInt(formData.cantidad) || 1,
      unidad: formData.unidad,
      estado: formData.estado as 'Bueno' | 'Regular' | 'Malo' | 'Baja',
      ubicacion: formData.ubicacion,
      responsable: formData.responsable,
      numero_inventario: formData.numero_inventario,
      fecha_adquisicion: formData.fecha_adquisicion,
      valor_unitario: parseFloat(formData.valor_unitario) || 0,
      proveedor: formData.proveedor || null,
      marca: formData.marca || null,
      modelo: formData.modelo || null,
      serie: formData.serie || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('tbl_inventario')
        .update(payload)
        .eq('id_inventario', editingItem.id_inventario);

      if (error) {
        toast.error('Error al actualizar');
      } else {
        toast.success('Artículo actualizado');
        fetchInventario();
        onClose();
      }
    } else {
      const { error } = await supabase.from('tbl_inventario').insert(payload);

      if (error) {
        toast.error('Error al crear artículo');
      } else {
        toast.success('Artículo registrado');
        fetchInventario();
        onClose();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return;

    const { error } = await supabase.from('tbl_inventario').delete().eq('id_inventario', id);

    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Artículo eliminado');
      fetchInventario();
    }
  };

  const getEstadoColor = (estado: string) => {
    const e = estados.find((x) => x.key === estado);
    return e?.color as 'success' | 'warning' | 'danger' | 'default';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const filteredItems = inventario.filter(
    (item) =>
      item.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      item.numero_inventario.toLowerCase().includes(search.toLowerCase()) ||
      item.categoria.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-primary" />
            Inventario
          </h1>
          <p className="text-gray-500">Gestión de bienes y activos</p>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={() => handleOpenModal()}>
          Nuevo Artículo
        </Button>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar por descripción, número o categoría..."
        value={search}
        onValueChange={setSearch}
        startContent={<Search size={18} className="text-gray-400" />}
        className="max-w-md"
      />

      {/* Tabla */}
      <Table
        aria-label="Inventario"
        bottomContent={
          total > itemsPerPage && (
            <div className="flex justify-center">
              <Pagination
                total={Math.ceil(total / itemsPerPage)}
                page={page}
                onChange={setPage}
              />
            </div>
          )
        }
      >
        <TableHeader>
          <TableColumn>NO. INVENTARIO</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn>CATEGORÍA</TableColumn>
          <TableColumn>CANTIDAD</TableColumn>
          <TableColumn>ESTADO</TableColumn>
          <TableColumn>VALOR</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={filteredItems} isLoading={loading} emptyContent="Sin artículos">
          {(item) => (
            <TableRow key={item.id_inventario}>
              <TableCell className="font-mono text-sm">{item.numero_inventario}</TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate">{item.descripcion}</p>
                {item.marca && (
                  <p className="text-xs text-gray-500">
                    {item.marca} {item.modelo}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {item.categoria}
                </Chip>
              </TableCell>
              <TableCell>
                {item.cantidad} {item.unidad}
              </TableCell>
              <TableCell>
                <Chip size="sm" color={getEstadoColor(item.estado)}>
                  {item.estado}
                </Chip>
              </TableCell>
              <TableCell>{formatCurrency(item.valor_total)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Tooltip content="Editar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleOpenModal(item)}
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
                      onPress={() => handleDelete(item.id_inventario)}
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
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingItem ? 'Editar Artículo' : 'Nuevo Artículo'}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Inventario"
                placeholder="INV-2025-001"
                value={formData.numero_inventario}
                onValueChange={(v) => setFormData({ ...formData, numero_inventario: v })}
                isRequired
              />
              <Select
                label="Categoría"
                selectedKeys={formData.categoria ? [formData.categoria] : []}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, categoria: Array.from(keys)[0] as string })
                }
                isRequired
              >
                {categorias.map((cat) => (
                  <SelectItem key={cat}>{cat}</SelectItem>
                ))}
              </Select>
              <Textarea
                label="Descripción"
                placeholder="Descripción del artículo..."
                value={formData.descripcion}
                onValueChange={(v) => setFormData({ ...formData, descripcion: v })}
                className="col-span-2"
                isRequired
              />
              <Input
                type="number"
                label="Cantidad"
                value={formData.cantidad}
                onValueChange={(v) => setFormData({ ...formData, cantidad: v })}
                min={1}
              />
              <Input
                label="Unidad"
                placeholder="Pieza, Juego, etc."
                value={formData.unidad}
                onValueChange={(v) => setFormData({ ...formData, unidad: v })}
              />
              <Select
                label="Estado"
                selectedKeys={[formData.estado]}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, estado: Array.from(keys)[0] as string })
                }
              >
                {estados.map((e) => (
                  <SelectItem key={e.key}>{e.label}</SelectItem>
                ))}
              </Select>
              <Input
                type="date"
                label="Fecha de Adquisición"
                value={formData.fecha_adquisicion}
                onValueChange={(v) => setFormData({ ...formData, fecha_adquisicion: v })}
              />
              <Input
                type="number"
                label="Valor Unitario"
                placeholder="0.00"
                value={formData.valor_unitario}
                onValueChange={(v) => setFormData({ ...formData, valor_unitario: v })}
                startContent="$"
              />
              <Input
                label="Ubicación"
                placeholder="Edificio, piso, área..."
                value={formData.ubicacion}
                onValueChange={(v) => setFormData({ ...formData, ubicacion: v })}
              />
              <Input
                label="Responsable"
                placeholder="Nombre del responsable"
                value={formData.responsable}
                onValueChange={(v) => setFormData({ ...formData, responsable: v })}
              />
              <Input
                label="Proveedor"
                placeholder="Nombre del proveedor"
                value={formData.proveedor}
                onValueChange={(v) => setFormData({ ...formData, proveedor: v })}
              />
              <Input
                label="Marca"
                value={formData.marca}
                onValueChange={(v) => setFormData({ ...formData, marca: v })}
              />
              <Input
                label="Modelo"
                value={formData.modelo}
                onValueChange={(v) => setFormData({ ...formData, modelo: v })}
              />
              <Input
                label="Serie"
                value={formData.serie}
                onValueChange={(v) => setFormData({ ...formData, serie: v })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
