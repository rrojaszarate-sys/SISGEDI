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
  Card,
  CardBody,
} from '@nextui-org/react';
import { Plus, Search, Edit, Package, Trash2, RefreshCw, Filter } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { Inventario } from '../../types/database';

const categorias = [
  'Mobiliario',
  'Equipo de Computo',
  'Equipo de Oficina',
  'Vehiculos',
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

// Datos mock para modo desarrollo
const MOCK_INVENTARIO: Inventario[] = [
  {
    id_inventario: 'mock-inv-1',
    id_ua: 'ua1',
    categoria: 'Equipo de Computo',
    descripcion: 'Laptop HP ProBook 450 G8 - Intel Core i7',
    cantidad: 1,
    unidad: 'Pieza',
    estado: 'Bueno',
    ubicacion: 'Oficina 201, Edificio Principal',
    responsable: 'Lic. Maria Garcia Lopez',
    numero_inventario: 'INV-2025-0001',
    fecha_adquisicion: '2024-01-15',
    valor_unitario: 25000,
    valor_total: 25000,
    proveedor: 'HP Mexico',
    marca: 'HP',
    modelo: 'ProBook 450 G8',
    serie: 'ABC123456',
    fecha_registro: new Date().toISOString(),
  },
  {
    id_inventario: 'mock-inv-2',
    id_ua: 'ua1',
    categoria: 'Mobiliario',
    descripcion: 'Escritorio ejecutivo de madera con cajones',
    cantidad: 1,
    unidad: 'Pieza',
    estado: 'Bueno',
    ubicacion: 'Oficina 201, Edificio Principal',
    responsable: 'Lic. Maria Garcia Lopez',
    numero_inventario: 'INV-2025-0002',
    fecha_adquisicion: '2023-06-20',
    valor_unitario: 8500,
    valor_total: 8500,
    proveedor: 'Muebles Oficina SA',
    marca: 'Office Plus',
    modelo: 'Ejecutivo E-500',
    serie: null,
    fecha_registro: new Date().toISOString(),
  },
  {
    id_inventario: 'mock-inv-3',
    id_ua: 'ua1',
    categoria: 'Equipo de Oficina',
    descripcion: 'Impresora multifuncional a color',
    cantidad: 1,
    unidad: 'Pieza',
    estado: 'Regular',
    ubicacion: 'Area de copiado, Planta Baja',
    responsable: 'Ing. Roberto Martinez',
    numero_inventario: 'INV-2024-0089',
    fecha_adquisicion: '2022-03-10',
    valor_unitario: 15000,
    valor_total: 15000,
    proveedor: 'Epson Mexico',
    marca: 'Epson',
    modelo: 'EcoTank L6270',
    serie: 'XYZ789012',
    fecha_registro: new Date().toISOString(),
  },
  {
    id_inventario: 'mock-inv-4',
    id_ua: 'ua1',
    categoria: 'Mobiliario',
    descripcion: 'Sillas ejecutivas ergonomicas',
    cantidad: 10,
    unidad: 'Pieza',
    estado: 'Bueno',
    ubicacion: 'Sala de juntas, Piso 2',
    responsable: 'C.P. Ana Hernandez',
    numero_inventario: 'INV-2024-0056',
    fecha_adquisicion: '2023-09-05',
    valor_unitario: 3500,
    valor_total: 35000,
    proveedor: 'Muebles Oficina SA',
    marca: 'ErgoMax',
    modelo: 'Comfort Pro',
    serie: null,
    fecha_registro: new Date().toISOString(),
  },
  {
    id_inventario: 'mock-inv-5',
    id_ua: 'ua1',
    categoria: 'Vehiculos',
    descripcion: 'Vehiculo oficial Nissan Sentra 2023',
    cantidad: 1,
    unidad: 'Pieza',
    estado: 'Bueno',
    ubicacion: 'Estacionamiento oficial',
    responsable: 'Lic. Carlos Ruiz',
    numero_inventario: 'INV-2023-0123',
    fecha_adquisicion: '2023-01-20',
    valor_unitario: 350000,
    valor_total: 350000,
    proveedor: 'Nissan Automotriz',
    marca: 'Nissan',
    modelo: 'Sentra 2023',
    serie: 'VIN123456789',
    fecha_registro: new Date().toISOString(),
  },
  {
    id_inventario: 'mock-inv-6',
    id_ua: 'ua1',
    categoria: 'Equipo de Computo',
    descripcion: 'Monitor LED 27 pulgadas',
    cantidad: 5,
    unidad: 'Pieza',
    estado: 'Malo',
    ubicacion: 'Almacen general',
    responsable: 'Ing. Roberto Martinez',
    numero_inventario: 'INV-2022-0045',
    fecha_adquisicion: '2020-11-15',
    valor_unitario: 4500,
    valor_total: 22500,
    proveedor: 'Dell Mexico',
    marca: 'Dell',
    modelo: 'P2719H',
    serie: null,
    fecha_registro: new Date().toISOString(),
  },
];

export default function InventarioPage() {
  const { usuario, isDevMode } = useAuth();
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
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
  }, [page, filtroCategoria]);

  const fetchInventario = async () => {
    setLoading(true);

    // En modo desarrollo, usar datos mock
    if (isDevMode || DEV_MODE) {
      let filtered = [...MOCK_INVENTARIO];
      if (filtroCategoria !== 'todas') {
        filtered = filtered.filter(i => i.categoria === filtroCategoria);
      }
      setInventario(filtered);
      setTotal(filtered.length);
      setLoading(false);
      return;
    }

    // Produccion
    let query = supabase
      .from('tbl_inventario')
      .select('*', { count: 'exact' })
      .eq('id_ua', usuario?.unidad_administrativa?.id_ua)
      .order('fecha_registro', { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

    if (filtroCategoria !== 'todas') {
      query = query.eq('categoria', filtroCategoria);
    }

    const { data, count, error } = await query;

    if (!error) {
      setInventario(data || []);
      setTotal(count || 0);
    }
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

    // En modo desarrollo, simular guardado
    if (isDevMode || DEV_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(editingItem ? 'Articulo actualizado (modo desarrollo)' : 'Articulo registrado (modo desarrollo)');
      onClose();
      return;
    }

    const payload = {
      id_ua: usuario?.unidad_administrativa?.id_ua,
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
        toast.success('Articulo actualizado');
        fetchInventario();
        onClose();
      }
    } else {
      const { error } = await supabase.from('tbl_inventario').insert(payload);

      if (error) {
        toast.error('Error al crear articulo');
      } else {
        toast.success('Articulo registrado');
        fetchInventario();
        onClose();
      }
    }
  };

  const handleDelete = async (id: string, descripcion: string) => {
    // En modo desarrollo, simular eliminacion
    if (isDevMode || DEV_MODE) {
      toast.success(`"${descripcion}" eliminado (modo desarrollo)`);
      return;
    }

    if (!confirm('Eliminar este articulo?')) return;

    const { error } = await supabase.from('tbl_inventario').delete().eq('id_inventario', id);

    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Articulo eliminado');
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--theme-primary-800)' }}
          >
            <Package style={{ color: 'var(--theme-primary-600)' }} />
            Inventario
          </h1>
          <p className="text-sm text-gray-500">Gestion de bienes y activos</p>
        </div>
        <div className="flex gap-2">
          <Button
            isIconOnly
            variant="flat"
            onPress={fetchInventario}
            isLoading={loading}
          >
            <RefreshCw size={18} />
          </Button>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            style={{ backgroundColor: 'var(--theme-primary-700)' }}
            onPress={() => handleOpenModal()}
          >
            <span className="hidden sm:inline">Nuevo Articulo</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardBody className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              placeholder="Buscar por descripcion, numero o categoria..."
              value={search}
              onValueChange={setSearch}
              startContent={<Search size={18} className="text-gray-400" />}
              className="flex-1"
              size="sm"
            />
            <Select
              placeholder="Categoria"
              selectedKeys={[filtroCategoria]}
              onSelectionChange={(keys) => setFiltroCategoria(Array.from(keys)[0] as string)}
              startContent={<Filter size={16} />}
              className="w-full sm:w-48"
              size="sm"
            >
              {['todas', ...categorias].map((cat) => (
                <SelectItem key={cat}>{cat === 'todas' ? 'Todas' : cat}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm overflow-hidden">
        <Table
          aria-label="Inventario"
          removeWrapper
          bottomContent={
            total > itemsPerPage && (
              <div className="flex justify-center py-2">
                <Pagination
                  total={Math.ceil(total / itemsPerPage)}
                  page={page}
                  onChange={setPage}
                  size="sm"
                />
              </div>
            )
          }
        >
          <TableHeader>
            <TableColumn className="text-xs">NO. INVENTARIO</TableColumn>
            <TableColumn className="text-xs">DESCRIPCION</TableColumn>
            <TableColumn className="text-xs hidden md:table-cell">CATEGORIA</TableColumn>
            <TableColumn className="text-xs hidden sm:table-cell">CANTIDAD</TableColumn>
            <TableColumn className="text-xs">ESTADO</TableColumn>
            <TableColumn className="text-xs hidden lg:table-cell">VALOR</TableColumn>
            <TableColumn className="text-xs">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody items={filteredItems} isLoading={loading} emptyContent="Sin articulos">
            {(item) => (
              <TableRow key={item.id_inventario} className="hover:bg-gray-50">
                <TableCell>
                  <span
                    className="font-mono text-xs sm:text-sm font-medium"
                    style={{ color: 'var(--theme-primary-700)' }}
                  >
                    {item.numero_inventario}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] sm:max-w-[200px] md:max-w-xs">
                    <p className="text-xs sm:text-sm truncate" title={item.descripcion}>
                      {item.descripcion}
                    </p>
                    {item.marca && (
                      <p className="text-[10px] text-gray-500 truncate">
                        {item.marca} {item.modelo}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Chip size="sm" variant="flat">
                    <span className="text-[10px]">{item.categoria}</span>
                  </Chip>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-xs">
                    {item.cantidad} {item.unidad}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={getEstadoColor(item.estado)} variant="flat">
                    <span className="text-[10px]">{item.estado}</span>
                  </Chip>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-xs font-medium">
                    {formatCurrency(item.valor_total)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip content="Editar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpenModal(item)}
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
                        onPress={() => handleDelete(item.id_inventario, item.descripcion)}
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
            {editingItem ? 'Editar Articulo' : 'Nuevo Articulo'}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Numero de Inventario"
                placeholder="INV-2025-001"
                value={formData.numero_inventario}
                onValueChange={(v) => setFormData({ ...formData, numero_inventario: v })}
                isRequired
                size="sm"
              />
              <Select
                label="Categoria"
                selectedKeys={formData.categoria ? [formData.categoria] : []}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, categoria: Array.from(keys)[0] as string })
                }
                isRequired
                size="sm"
              >
                {categorias.map((cat) => (
                  <SelectItem key={cat}>{cat}</SelectItem>
                ))}
              </Select>
              <Textarea
                label="Descripcion"
                placeholder="Descripcion del articulo..."
                value={formData.descripcion}
                onValueChange={(v) => setFormData({ ...formData, descripcion: v })}
                className="sm:col-span-2"
                isRequired
                size="sm"
              />
              <Input
                type="number"
                label="Cantidad"
                value={formData.cantidad}
                onValueChange={(v) => setFormData({ ...formData, cantidad: v })}
                min={1}
                size="sm"
              />
              <Input
                label="Unidad"
                placeholder="Pieza, Juego, etc."
                value={formData.unidad}
                onValueChange={(v) => setFormData({ ...formData, unidad: v })}
                size="sm"
              />
              <Select
                label="Estado"
                selectedKeys={[formData.estado]}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, estado: Array.from(keys)[0] as string })
                }
                size="sm"
              >
                {estados.map((e) => (
                  <SelectItem key={e.key}>{e.label}</SelectItem>
                ))}
              </Select>
              <Input
                type="date"
                label="Fecha de Adquisicion"
                value={formData.fecha_adquisicion}
                onValueChange={(v) => setFormData({ ...formData, fecha_adquisicion: v })}
                size="sm"
              />
              <Input
                type="number"
                label="Valor Unitario"
                placeholder="0.00"
                value={formData.valor_unitario}
                onValueChange={(v) => setFormData({ ...formData, valor_unitario: v })}
                startContent="$"
                size="sm"
              />
              <Input
                label="Ubicacion"
                placeholder="Edificio, piso, area..."
                value={formData.ubicacion}
                onValueChange={(v) => setFormData({ ...formData, ubicacion: v })}
                size="sm"
              />
              <Input
                label="Responsable"
                placeholder="Nombre del responsable"
                value={formData.responsable}
                onValueChange={(v) => setFormData({ ...formData, responsable: v })}
                size="sm"
              />
              <Input
                label="Proveedor"
                placeholder="Nombre del proveedor"
                value={formData.proveedor}
                onValueChange={(v) => setFormData({ ...formData, proveedor: v })}
                size="sm"
              />
              <Input
                label="Marca"
                value={formData.marca}
                onValueChange={(v) => setFormData({ ...formData, marca: v })}
                size="sm"
              />
              <Input
                label="Modelo"
                value={formData.modelo}
                onValueChange={(v) => setFormData({ ...formData, modelo: v })}
                size="sm"
              />
              <Input
                label="Serie"
                value={formData.serie}
                onValueChange={(v) => setFormData({ ...formData, serie: v })}
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
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Mostrando {filteredItems.length} articulos de ejemplo
        </p>
      )}
    </div>
  );
}
