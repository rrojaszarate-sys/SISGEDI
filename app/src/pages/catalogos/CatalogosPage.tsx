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
  Tabs,
  Tab,
  Card,
  CardBody,
} from '@nextui-org/react';
import { Plus, Search, Edit, Trash2, ListTree, RefreshCw } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { devCatalogos } from '../../lib/devStorage';
import { toast } from 'sonner';
import type { ValorCatalogo } from '../../types/database';

const tiposCatalogo = [
  { key: 'Prioridad', label: 'Prioridad' },
  { key: 'Tipo_Documento', label: 'Tipo de Documento' },
  { key: 'Area_Remitente', label: 'Area Remitente' },
  { key: 'Instruccion', label: 'Instruccion de Turnado' },
  { key: 'Categoria_Inventario', label: 'Categoria de Inventario' },
];

export default function CatalogosPage() {
  const { isDevMode } = useAuth();
  const [valores, setValores] = useState<ValorCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Prioridad');
  const [editingValor, setEditingValor] = useState<ValorCatalogo | null>(null);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    tipo_catalogo: 'Prioridad',
    valor: '',
    descripcion: '',
    orden_presentacion: '0',
    es_modificable: true,
  });

  useEffect(() => {
    fetchValores();
  }, [tipoSeleccionado]);

  const fetchValores = async () => {
    setLoading(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const data = devCatalogos.getByTipo(tipoSeleccionado);
      setValores(data);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cat_valores_catalogo')
      .select('*')
      .eq('tipo_catalogo', tipoSeleccionado)
      .eq('estatus', true)
      .order('orden_presentacion');

    if (error) {
      toast.error('Error al cargar catalogos');
    } else {
      setValores(data || []);
    }
    setLoading(false);
  };

  const handleOpenModal = (valor?: ValorCatalogo) => {
    if (valor) {
      setEditingValor(valor);
      setFormData({
        tipo_catalogo: valor.tipo_catalogo,
        valor: valor.valor,
        descripcion: valor.descripcion || '',
        orden_presentacion: String(valor.orden_presentacion),
        es_modificable: valor.es_modificable,
      });
    } else {
      setEditingValor(null);
      setFormData({
        tipo_catalogo: tipoSeleccionado,
        valor: '',
        descripcion: '',
        orden_presentacion: String(valores.length + 1),
        es_modificable: true,
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.valor.trim()) {
      toast.error('El valor es requerido');
      return;
    }

    setSaving(true);

    // En modo desarrollo, usar devStorage con persistencia real
    if (isDevMode || DEV_MODE) {
      try {
        if (editingValor) {
          const updated = devCatalogos.update(editingValor.id_valor_catalogo, {
            valor: formData.valor.trim(),
            descripcion: formData.descripcion.trim() || null,
            orden_presentacion: parseInt(formData.orden_presentacion) || 0,
          });
          if (updated) {
            toast.success('Valor actualizado correctamente');
          } else {
            toast.error('Error al actualizar');
          }
        } else {
          devCatalogos.create({
            tipo_catalogo: formData.tipo_catalogo,
            valor: formData.valor.trim(),
            descripcion: formData.descripcion.trim() || null,
            orden_presentacion: parseInt(formData.orden_presentacion) || 0,
            es_modificable: formData.es_modificable,
            estatus: true,
          });
          toast.success('Valor creado correctamente');
        }
        fetchValores();
        onClose();
      } catch {
        toast.error('Error al guardar');
      }
      setSaving(false);
      return;
    }

    const payload = {
      tipo_catalogo: formData.tipo_catalogo,
      valor: formData.valor.trim(),
      descripcion: formData.descripcion.trim() || null,
      orden_presentacion: parseInt(formData.orden_presentacion) || 0,
    };

    if (editingValor) {
      const { error } = await supabase
        .from('cat_valores_catalogo')
        .update(payload)
        .eq('id_valor_catalogo', editingValor.id_valor_catalogo);

      if (error) {
        toast.error('Error al actualizar');
      } else {
        toast.success('Valor actualizado');
        fetchValores();
        onClose();
      }
    } else {
      const { error } = await supabase.from('cat_valores_catalogo').insert(payload);

      if (error) {
        toast.error('Error al crear valor');
      } else {
        toast.success('Valor creado correctamente');
        fetchValores();
        onClose();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, esModificable: boolean, valor: string) => {
    if (!esModificable) {
      toast.error('Este valor no puede ser eliminado porque es del sistema');
      return;
    }

    if (!confirm(`¿Desea desactivar el valor "${valor}"?`)) return;

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const deleted = devCatalogos.delete(id);
      if (deleted) {
        toast.success(`"${valor}" desactivado correctamente`);
        fetchValores();
      } else {
        toast.error('Error al desactivar');
      }
      return;
    }

    const { error } = await supabase
      .from('cat_valores_catalogo')
      .update({ estatus: false })
      .eq('id_valor_catalogo', id);

    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Valor desactivado');
      fetchValores();
    }
  };

  const filteredValores = valores.filter((v) =>
    v.valor.toLowerCase().includes(search.toLowerCase()) ||
    v.descripcion?.toLowerCase().includes(search.toLowerCase())
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
            <ListTree style={{ color: 'var(--theme-primary-600)' }} />
            Catalogos del Sistema
          </h1>
          <p className="text-sm text-gray-500">Gestion de valores de catalogos</p>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly variant="flat" onPress={fetchValores} isLoading={loading}>
            <RefreshCw size={18} />
          </Button>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            style={{ backgroundColor: 'var(--theme-primary-700)' }}
            onPress={() => handleOpenModal()}
          >
            <span className="hidden sm:inline">Nuevo Valor</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Tabs de tipos */}
      <Card className="shadow-sm overflow-x-auto">
        <CardBody className="p-2 sm:p-3">
          <Tabs
            selectedKey={tipoSeleccionado}
            onSelectionChange={(key) => setTipoSeleccionado(key as string)}
            size="sm"
            variant="underlined"
            classNames={{
              tabList: 'flex-wrap gap-1',
              tab: 'px-2 sm:px-4',
            }}
          >
            {tiposCatalogo.map((tipo) => (
              <Tab key={tipo.key} title={<span className="text-xs sm:text-sm">{tipo.label}</span>} />
            ))}
          </Tabs>
        </CardBody>
      </Card>

      {/* Busqueda */}
      <Card className="shadow-sm">
        <CardBody className="p-3 sm:p-4">
          <Input
            placeholder="Buscar valor..."
            value={search}
            onValueChange={setSearch}
            startContent={<Search size={18} className="text-gray-400" />}
            size="sm"
            isClearable
            onClear={() => setSearch('')}
          />
        </CardBody>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm overflow-hidden">
        <Table aria-label="Valores de catalogo" removeWrapper>
          <TableHeader>
            <TableColumn className="text-xs">VALOR</TableColumn>
            <TableColumn className="text-xs hidden md:table-cell">DESCRIPCION</TableColumn>
            <TableColumn className="text-xs hidden sm:table-cell">ORDEN</TableColumn>
            <TableColumn className="text-xs">MODIFICABLE</TableColumn>
            <TableColumn className="text-xs">ESTATUS</TableColumn>
            <TableColumn className="text-xs">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody items={filteredValores} isLoading={loading} emptyContent="Sin valores en este catalogo">
            {(valor) => (
              <TableRow key={valor.id_valor_catalogo} className="hover:bg-gray-50">
                <TableCell>
                  <span
                    className="text-xs sm:text-sm font-medium"
                    style={{ color: 'var(--theme-primary-700)' }}
                  >
                    {valor.valor}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs text-gray-500">{valor.descripcion || '-'}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-xs">{valor.orden_presentacion}</span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={valor.es_modificable ? 'success' : 'warning'} variant="flat">
                    <span className="text-[10px]">{valor.es_modificable ? 'Si' : 'No'}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={valor.estatus ? 'success' : 'danger'} variant="flat">
                    <span className="text-[10px]">{valor.estatus ? 'Activo' : 'Inactivo'}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip content={valor.es_modificable ? 'Editar' : 'No editable'}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleOpenModal(valor)}
                        isDisabled={!valor.es_modificable}
                      >
                        <Edit size={16} style={{ color: valor.es_modificable ? 'var(--theme-primary-600)' : '#ccc' }} />
                      </Button>
                    </Tooltip>
                    <Tooltip content={valor.es_modificable ? 'Eliminar' : 'No eliminable'}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDelete(valor.id_valor_catalogo, valor.es_modificable, valor.valor)}
                        isDisabled={!valor.es_modificable}
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
      <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
        <ModalContent>
          <ModalHeader style={{ color: 'var(--theme-primary-700)' }}>
            {editingValor ? 'Editar Valor' : 'Nuevo Valor'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Tipo de Catalogo"
                selectedKeys={[formData.tipo_catalogo]}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, tipo_catalogo: Array.from(keys)[0] as string })
                }
                isDisabled={!!editingValor}
                size="sm"
              >
                {tiposCatalogo.map((tipo) => (
                  <SelectItem key={tipo.key}>{tipo.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="Valor"
                placeholder="Nombre del valor"
                value={formData.valor}
                onValueChange={(v) => setFormData({ ...formData, valor: v })}
                isRequired
                size="sm"
              />
              <Input
                label="Descripcion"
                placeholder="Descripcion opcional"
                value={formData.descripcion}
                onValueChange={(v) => setFormData({ ...formData, descripcion: v })}
                size="sm"
              />
              <Input
                type="number"
                label="Orden de Presentacion"
                value={formData.orden_presentacion}
                onValueChange={(v) => setFormData({ ...formData, orden_presentacion: v })}
                size="sm"
                min={0}
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
              isLoading={saving}
              style={{ backgroundColor: 'var(--theme-primary-700)' }}
            >
              {editingValor ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Los datos se guardan localmente ({filteredValores.length} valores)
        </p>
      )}
    </div>
  );
}
