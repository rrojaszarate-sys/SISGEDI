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
} from '@nextui-org/react';
import { Plus, Search, Edit, Trash2, ListTree } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { ValorCatalogo } from '../../types/database';

const tiposCatalogo = [
  { key: 'Prioridad', label: 'Prioridad' },
  { key: 'Tipo_Documento', label: 'Tipo de Documento' },
  { key: 'Area_Remitente', label: 'Área Remitente' },
  { key: 'Instruccion', label: 'Instrucción de Turnado' },
  { key: 'Categoria_Inventario', label: 'Categoría de Inventario' },
];

export default function CatalogosPage() {
  const [valores, setValores] = useState<ValorCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Prioridad');
  const [editingValor, setEditingValor] = useState<ValorCatalogo | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    tipo_catalogo: 'Prioridad',
    valor: '',
    descripcion: '',
    orden_presentacion: '0',
  });

  useEffect(() => {
    fetchValores();
  }, [tipoSeleccionado]);

  const fetchValores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cat_valores_catalogo')
      .select('*')
      .eq('tipo_catalogo', tipoSeleccionado)
      .order('orden_presentacion');

    if (error) {
      toast.error('Error al cargar catálogos');
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
      });
    } else {
      setEditingValor(null);
      setFormData({
        tipo_catalogo: tipoSeleccionado,
        valor: '',
        descripcion: '',
        orden_presentacion: '0',
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.valor) {
      toast.error('El valor es requerido');
      return;
    }

    const payload = {
      tipo_catalogo: formData.tipo_catalogo,
      valor: formData.valor,
      descripcion: formData.descripcion || null,
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
  };

  const handleDelete = async (id: string, esModificable: boolean) => {
    if (!esModificable) {
      toast.error('Este valor no puede ser eliminado');
      return;
    }
    if (!confirm('¿Eliminar este valor?')) return;

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
    v.valor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTree className="text-primary" />
            Catálogos del Sistema
          </h1>
          <p className="text-gray-500">Gestión de valores de catálogos</p>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={() => handleOpenModal()}>
          Nuevo Valor
        </Button>
      </div>

      {/* Tabs de tipos */}
      <Tabs
        selectedKey={tipoSeleccionado}
        onSelectionChange={(key) => setTipoSeleccionado(key as string)}
      >
        {tiposCatalogo.map((tipo) => (
          <Tab key={tipo.key} title={tipo.label} />
        ))}
      </Tabs>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar valor..."
        value={search}
        onValueChange={setSearch}
        startContent={<Search size={18} className="text-gray-400" />}
        className="max-w-md"
      />

      {/* Tabla */}
      <Table aria-label="Valores de catálogo">
        <TableHeader>
          <TableColumn>VALOR</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn>ORDEN</TableColumn>
          <TableColumn>MODIFICABLE</TableColumn>
          <TableColumn>ESTATUS</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={filteredValores} isLoading={loading} emptyContent="Sin valores">
          {(valor) => (
            <TableRow key={valor.id_valor_catalogo}>
              <TableCell className="font-medium">{valor.valor}</TableCell>
              <TableCell className="text-gray-500">{valor.descripcion || '-'}</TableCell>
              <TableCell>{valor.orden_presentacion}</TableCell>
              <TableCell>
                <Chip size="sm" color={valor.es_modificable ? 'success' : 'warning'}>
                  {valor.es_modificable ? 'Sí' : 'No'}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" color={valor.estatus ? 'success' : 'danger'}>
                  {valor.estatus ? 'Activo' : 'Inactivo'}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Tooltip content="Editar">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleOpenModal(valor)}
                      isDisabled={!valor.es_modificable}
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
                      onPress={() => handleDelete(valor.id_valor_catalogo, valor.es_modificable)}
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

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>{editingValor ? 'Editar Valor' : 'Nuevo Valor'}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Tipo de Catálogo"
                selectedKeys={[formData.tipo_catalogo]}
                onSelectionChange={(keys) =>
                  setFormData({ ...formData, tipo_catalogo: Array.from(keys)[0] as string })
                }
                isDisabled={!!editingValor}
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
              />
              <Input
                label="Descripción"
                placeholder="Descripción opcional"
                value={formData.descripcion}
                onValueChange={(v) => setFormData({ ...formData, descripcion: v })}
              />
              <Input
                type="number"
                label="Orden de Presentación"
                value={formData.orden_presentacion}
                onValueChange={(v) => setFormData({ ...formData, orden_presentacion: v })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingValor ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
