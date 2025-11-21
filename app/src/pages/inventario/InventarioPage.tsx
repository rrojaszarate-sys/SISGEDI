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
import { devInventario, devUnidades, devCatalogos } from '../../lib/devStorage';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { Inventario, UnidadAdministrativa, ValorCatalogo } from '../../types/database';

const estados = [
  { key: 'Bueno', label: 'Bueno', color: 'success' },
  { key: 'Regular', label: 'Regular', color: 'warning' },
  { key: 'Malo', label: 'Malo', color: 'danger' },
  { key: 'Baja', label: 'Baja', color: 'default' },
];

export default function InventarioPage() {
  const { usuario, isDevMode } = useAuth();
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [, setUnidades] = useState<UnidadAdministrativa[]>([]);
  const [categorias, setCategorias] = useState<ValorCatalogo[]>([]);
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
    fetchUnidades();
    fetchCategorias();
  }, []);

  useEffect(() => {
    fetchInventario();
  }, [page, filtroCategoria]);

  const fetchUnidades = async () => {
    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const data = devUnidades.getActive();
      setUnidades(data);
      return;
    }

    // Produccion
    const { data, error } = await supabase
      .from('cat_unidades_administrativas')
      .select('*')
      .eq('estatus', true)
      .order('nombre_ua');

    if (!error && data) {
      setUnidades(data);
    }
  };

  const fetchCategorias = async () => {
    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const data = devCatalogos.getByTipo('Categoria_Inventario');
      setCategorias(data);
      return;
    }

    // Produccion
    const { data, error } = await supabase
      .from('cat_valores_catalogo')
      .select('*')
      .eq('tipo_catalogo', 'Categoria_Inventario')
      .eq('estatus', true)
      .order('orden_presentacion');

    if (!error && data) {
      setCategorias(data);
    }
  };

  const fetchInventario = async () => {
    setLoading(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      let data = devInventario.getAll();
      if (filtroCategoria !== 'todas') {
        data = data.filter(i => i.categoria === filtroCategoria);
      }
      setInventario(data);
      setTotal(data.length);
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
    if (!formData.descripcion || !formData.categoria) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const payload = {
      id_ua: usuario?.unidad_administrativa?.id_ua || 'ua-001',
      categoria: formData.categoria,
      descripcion: formData.descripcion,
      cantidad: parseInt(formData.cantidad) || 1,
      unidad: formData.unidad,
      estado: formData.estado as 'Bueno' | 'Regular' | 'Malo' | 'Baja',
      ubicacion: formData.ubicacion,
      responsable: formData.responsable,
      fecha_adquisicion: formData.fecha_adquisicion,
      valor_unitario: parseFloat(formData.valor_unitario) || 0,
      proveedor: formData.proveedor || null,
      marca: formData.marca || null,
      modelo: formData.modelo || null,
      serie: formData.serie || null,
    };

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      try {
        if (editingItem) {
          devInventario.update(editingItem.id_inventario, payload);
          toast.success('Articulo actualizado correctamente');
        } else {
          devInventario.create(payload);
          toast.success('Articulo registrado correctamente');
        }
        await fetchInventario();
        onClose();
      } catch (error) {
        toast.error('Error al guardar el articulo');
      }
      return;
    }

    // Produccion
    if (editingItem) {
      const { error } = await supabase
        .from('tbl_inventario')
        .update({
          ...payload,
          numero_inventario: formData.numero_inventario,
        })
        .eq('id_inventario', editingItem.id_inventario);

      if (error) {
        toast.error('Error al actualizar');
      } else {
        toast.success('Articulo actualizado');
        await fetchInventario();
        onClose();
      }
    } else {
      const { error } = await supabase.from('tbl_inventario').insert({
        ...payload,
        numero_inventario: formData.numero_inventario,
      });

      if (error) {
        toast.error('Error al crear articulo');
      } else {
        toast.success('Articulo registrado');
        await fetchInventario();
        onClose();
      }
    }
  };

  const handleDelete = async (id: string, descripcion: string) => {
    if (!confirm('Eliminar este articulo?')) return;

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const success = devInventario.delete(id);
      if (success) {
        toast.success(`"${descripcion}" eliminado correctamente`);
        await fetchInventario();
      } else {
        toast.error('Error al eliminar el articulo');
      }
      return;
    }

    // Produccion
    const { error } = await supabase.from('tbl_inventario').delete().eq('id_inventario', id);

    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Articulo eliminado');
      await fetchInventario();
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

  // Obtener lista de categorias para el select
  const categoriasOptions = categorias.length > 0
    ? categorias.map(c => c.valor)
    : ['Equipo de Computo', 'Mobiliario', 'Vehiculos', 'Equipo de Oficina'];

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
              {['todas', ...categoriasOptions].map((cat) => (
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
              {editingItem && (
                <Input
                  label="Numero de Inventario"
                  value={formData.numero_inventario}
                  isReadOnly
                  size="sm"
                />
              )}
              <Select
                label="Categoria"
                selectedKeys={formData.categoria ? [formData.categoria] : []}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, categoria: Array.from(keys)[0] as string })
                }
                isRequired
                size="sm"
              >
                {categoriasOptions.map((cat) => (
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
          Modo desarrollo - Datos persistidos en localStorage ({filteredItems.length} articulos)
        </p>
      )}
    </div>
  );
}
