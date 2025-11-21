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
} from '@nextui-org/react';
import { Plus, Search, Eye, Send, FileText, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { DocumentoEntrante, ValorCatalogo } from '../../types/database';

interface DocExtendido extends DocumentoEntrante {
  prioridad?: ValorCatalogo;
  tipo_documento?: ValorCatalogo;
}

export default function DocumentosEntrantesPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
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

    let query = supabase
      .from('tbl_documento_entrante')
      .select(`
        *,
        prioridad:id_prioridad(id_valor_catalogo, valor),
        tipo_documento:id_tipo_doc(id_valor_catalogo, valor)
      `, { count: 'exact' })
      .eq('eliminado', false)
      .eq('id_ua_registro', usuario?.id_ua)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary" />
            Documentos Entrantes
          </h1>
          <p className="text-gray-500">Gestión de correspondencia recibida</p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={() => navigate('/documentos/nuevo')}
        >
          Nuevo Documento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Buscar por folio, asunto o remitente..."
          value={search}
          onValueChange={setSearch}
          startContent={<Search size={18} className="text-gray-400" />}
          className="max-w-md"
        />
        <Select
          placeholder="Filtrar por estatus"
          selectedKeys={[filtroEstatus]}
          onSelectionChange={(keys) => setFiltroEstatus(Array.from(keys)[0] as string)}
          startContent={<Filter size={18} />}
          className="w-48"
        >
          <SelectItem key="todos">Todos</SelectItem>
          <SelectItem key="Pendiente">Pendiente</SelectItem>
          <SelectItem key="En_Proceso">En Proceso</SelectItem>
          <SelectItem key="Concluido">Concluido</SelectItem>
          <SelectItem key="Archivado">Archivado</SelectItem>
        </Select>
      </div>

      {/* Tabla */}
      <Table
        aria-label="Documentos entrantes"
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
          <TableColumn>FOLIO</TableColumn>
          <TableColumn>FECHA</TableColumn>
          <TableColumn>ASUNTO</TableColumn>
          <TableColumn>REMITENTE</TableColumn>
          <TableColumn>PRIORIDAD</TableColumn>
          <TableColumn>ESTATUS</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={filteredDocs} isLoading={loading} emptyContent="Sin documentos">
          {(doc) => (
            <TableRow key={doc.id_doc_entrante}>
              <TableCell className="font-mono text-sm">{doc.folio_interno}</TableCell>
              <TableCell>{formatDate(doc.fecha_registro)}</TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate" title={doc.asunto}>
                  {doc.asunto}
                </p>
              </TableCell>
              <TableCell>{doc.remitente_nombre || '-'}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={getPrioridadColor(doc.prioridad?.valor)}
                  variant="flat"
                >
                  {doc.prioridad?.valor || 'Normal'}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip size="sm" color={getEstatusColor(doc.estatus_general)}>
                  {doc.estatus_general.replace('_', ' ')}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Tooltip content="Ver detalle">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => navigate(`/documentos/${doc.id_doc_entrante}`)}
                    >
                      <Eye size={16} />
                    </Button>
                  </Tooltip>
                  {doc.marca_seguimiento === 'Turnarse' && doc.estatus_general !== 'Concluido' && (
                    <Tooltip content="Turnar">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => navigate(`/turnado/nuevo/${doc.id_doc_entrante}`)}
                      >
                        <Send size={16} />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
