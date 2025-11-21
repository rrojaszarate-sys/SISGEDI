import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Chip,
  Tooltip,
  Pagination,
  Select,
  SelectItem,
  Card,
  CardBody,
} from '@nextui-org/react';
import { Plus, Search, Eye, Send, FileText, Filter, RefreshCw } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { devDocumentosEntrantes, devCatalogos } from '../../lib/devStorage';
import { useAuth } from '../../contexts/AuthContext';
import type { DocumentoEntrante, ValorCatalogo } from '../../types/database';

interface DocExtendido extends DocumentoEntrante {
  prioridad?: ValorCatalogo;
  tipo_documento?: ValorCatalogo;
}

export default function DocumentosEntrantesPage() {
  const navigate = useNavigate();
  const { usuario, isDevMode } = useAuth();
  const [documentos, setDocumentos] = useState<DocExtendido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDocumentos();
  }, [page, filtroEstatus]);

  const fetchDocumentos = async () => {
    setLoading(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      let docs = devDocumentosEntrantes.getAll();

      // Enriquecer con datos de catalogos
      const catalogos = devCatalogos.getAll();
      const docsEnriquecidos: DocExtendido[] = docs.map(doc => ({
        ...doc,
        prioridad: catalogos.find(c => c.id_valor_catalogo === doc.id_prioridad),
        tipo_documento: catalogos.find(c => c.id_valor_catalogo === doc.id_tipo_doc),
      }));

      // Filtrar por estatus
      let filtered = docsEnriquecidos;
      if (filtroEstatus !== 'todos') {
        filtered = filtered.filter(d => d.estatus_general === filtroEstatus);
      }

      setDocumentos(filtered);
      setTotal(filtered.length);
      setLoading(false);
      return;
    }

    // Produccion
    let query = supabase
      .from('tbl_documento_entrante')
      .select(`
        *,
        prioridad:id_prioridad(id_valor_catalogo, valor),
        tipo_documento:id_tipo_doc(id_valor_catalogo, valor)
      `, { count: 'exact' })
      .eq('eliminado', false)
      .eq('id_ua_registro', usuario?.unidad_administrativa?.id_ua)
      .order('fecha_registro', { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

    if (filtroEstatus !== 'todos') {
      query = query.eq('estatus_general', filtroEstatus);
    }

    const { data, count, error } = await query;

    if (!error) {
      setDocumentos(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Pendiente': return 'warning';
      case 'En_Proceso': return 'primary';
      case 'Concluido': return 'success';
      case 'Archivado': return 'default';
      default: return 'default';
    }
  };

  const getPrioridadColor = (prioridad?: string) => {
    return prioridad === 'Urgente' ? 'danger' : 'default';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredDocs = documentos.filter(
    (doc) =>
      doc.folio_interno?.toLowerCase().includes(search.toLowerCase()) ||
      doc.asunto.toLowerCase().includes(search.toLowerCase()) ||
      doc.remitente_nombre?.toLowerCase().includes(search.toLowerCase())
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
            <FileText style={{ color: 'var(--theme-primary-600)' }} />
            Documentos Entrantes
          </h1>
          <p className="text-sm text-gray-500">Gestion de correspondencia recibida</p>
        </div>
        <div className="flex gap-2">
          <Button
            isIconOnly
            variant="flat"
            onPress={fetchDocumentos}
            isLoading={loading}
          >
            <RefreshCw size={18} />
          </Button>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            style={{ backgroundColor: 'var(--theme-primary-700)' }}
            onPress={() => navigate('/documentos/nuevo')}
          >
            <span className="hidden sm:inline">Nuevo Documento</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardBody className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              placeholder="Buscar por folio, asunto o remitente..."
              value={search}
              onValueChange={setSearch}
              startContent={<Search size={18} className="text-gray-400" />}
              className="flex-1"
              size="sm"
            />
            <Select
              placeholder="Estatus"
              selectedKeys={[filtroEstatus]}
              onSelectionChange={(keys) => setFiltroEstatus(Array.from(keys)[0] as string)}
              startContent={<Filter size={16} />}
              className="w-full sm:w-40"
              size="sm"
            >
              <SelectItem key="todos">Todos</SelectItem>
              <SelectItem key="Pendiente">Pendiente</SelectItem>
              <SelectItem key="En_Proceso">En Proceso</SelectItem>
              <SelectItem key="Concluido">Concluido</SelectItem>
              <SelectItem key="Archivado">Archivado</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm overflow-hidden">
        <Table
          aria-label="Documentos entrantes"
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
            <TableColumn className="text-xs">FOLIO</TableColumn>
            <TableColumn className="text-xs hidden sm:table-cell">FECHA</TableColumn>
            <TableColumn className="text-xs">ASUNTO</TableColumn>
            <TableColumn className="text-xs hidden md:table-cell">REMITENTE</TableColumn>
            <TableColumn className="text-xs hidden lg:table-cell">PRIORIDAD</TableColumn>
            <TableColumn className="text-xs">ESTATUS</TableColumn>
            <TableColumn className="text-xs">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody items={filteredDocs} isLoading={loading} emptyContent="Sin documentos">
            {(doc) => (
              <TableRow key={doc.id_doc_entrante} className="hover:bg-gray-50">
                <TableCell>
                  <span
                    className="font-mono text-xs sm:text-sm font-medium"
                    style={{ color: 'var(--theme-primary-700)' }}
                  >
                    {doc.folio_interno}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-xs text-gray-600">
                    {formatDate(doc.fecha_registro)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] sm:max-w-[200px] md:max-w-xs">
                    <p className="text-xs sm:text-sm truncate" title={doc.asunto}>
                      {doc.asunto}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs text-gray-600">
                    {doc.remitente_nombre || '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Chip
                    size="sm"
                    color={getPrioridadColor(doc.prioridad?.valor)}
                    variant="flat"
                  >
                    <span className="text-[10px]">
                      {doc.prioridad?.valor || 'Normal'}
                    </span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={getEstatusColor(doc.estatus_general)} variant="flat">
                    <span className="text-[10px]">
                      {doc.estatus_general.replace('_', ' ')}
                    </span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip content="Ver detalle">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => navigate(`/documentos/${doc.id_doc_entrante}`)}
                      >
                        <Eye size={16} style={{ color: 'var(--theme-primary-600)' }} />
                      </Button>
                    </Tooltip>
                    {doc.marca_seguimiento === 'Turnarse' && doc.estatus_general !== 'Concluido' && (
                      <Tooltip content="Turnar">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => navigate(`/turnado/nuevo/${doc.id_doc_entrante}`)}
                        >
                          <Send size={16} className="text-green-600" />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Mostrando {filteredDocs.length} documentos desde localStorage
        </p>
      )}
    </div>
  );
}
