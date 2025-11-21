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
  Card,
  CardBody,
  Select,
  SelectItem,
} from '@nextui-org/react';
import { Plus, Search, Eye, FolderOpen, Printer, RefreshCw, Filter } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { DocumentoSaliente } from '../../types/database';
import { toast } from 'sonner';

// Datos mock para modo desarrollo
const MOCK_DOCUMENTOS: DocumentoSaliente[] = [
  {
    id_doc_saliente: 'mock-sal-1',
    numero_folio: 'OF-2025-0089',
    tipo_doc: 'Oficio',
    fecha_elaboracion: new Date().toISOString(),
    asunto: 'Solicitud de recursos para programa de capacitacion del personal administrativo',
    destinatario_nombre: 'Lic. Roberto Mendoza Garcia',
    destinatario_cargo: 'Director de Recursos Humanos',
    destinatario_institucion: 'Secretaria de Finanzas',
    contenido_cuerpo: null,
    estatus_saliente: 'Enviado',
    id_ua_emisora: 'ua1',
    id_usuario_elabora: 'u1',
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_doc_saliente: 'mock-sal-2',
    numero_folio: 'OF-2025-0088',
    tipo_doc: 'Oficio',
    fecha_elaboracion: new Date(Date.now() - 86400000).toISOString(),
    asunto: 'Respuesta a oficio numero 456/2025 sobre revision de expedientes',
    destinatario_nombre: 'Ing. Patricia Sanchez',
    destinatario_cargo: 'Coordinadora de Proyectos',
    destinatario_institucion: 'Secretaria de Obras',
    contenido_cuerpo: null,
    estatus_saliente: 'Firmado',
    id_ua_emisora: 'ua1',
    id_usuario_elabora: 'u1',
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_doc_saliente: 'mock-sal-3',
    numero_folio: 'NI-2025-0023',
    tipo_doc: 'Nota_Informativa',
    fecha_elaboracion: new Date(Date.now() - 172800000).toISOString(),
    asunto: 'Informe de actividades del primer trimestre 2025',
    destinatario_nombre: 'C.P. Maria Elena Torres',
    destinatario_cargo: 'Directora General',
    destinatario_institucion: 'Direccion General de Administracion',
    contenido_cuerpo: null,
    estatus_saliente: 'Enviado',
    id_ua_emisora: 'ua1',
    id_usuario_elabora: 'u1',
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_doc_saliente: 'mock-sal-4',
    numero_folio: 'CIR-2025-0012',
    tipo_doc: 'Circular',
    fecha_elaboracion: new Date(Date.now() - 259200000).toISOString(),
    asunto: 'Lineamientos para el uso eficiente de recursos materiales',
    destinatario_nombre: 'Personal de la Unidad',
    destinatario_cargo: null,
    destinatario_institucion: 'Direccion General',
    contenido_cuerpo: null,
    estatus_saliente: 'Borrador',
    id_ua_emisora: 'ua1',
    id_usuario_elabora: 'u1',
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_doc_saliente: 'mock-sal-5',
    numero_folio: 'MEM-2025-0045',
    tipo_doc: 'Memorandum',
    fecha_elaboracion: new Date(Date.now() - 345600000).toISOString(),
    asunto: 'Recordatorio de entrega de informes mensuales',
    destinatario_nombre: 'Jefes de Departamento',
    destinatario_cargo: null,
    destinatario_institucion: 'Areas adscritas',
    contenido_cuerpo: null,
    estatus_saliente: 'Cancelado',
    id_ua_emisora: 'ua1',
    id_usuario_elabora: 'u1',
    fecha_creacion: new Date().toISOString(),
  },
];

export default function DocumentosSalientesPage() {
  const navigate = useNavigate();
  const { usuario, isDevMode } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoSaliente[]>([]);
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

    // En modo desarrollo, usar datos mock
    if (isDevMode || DEV_MODE) {
      let filtered = [...MOCK_DOCUMENTOS];
      if (filtroEstatus !== 'todos') {
        filtered = filtered.filter(d => d.estatus_saliente === filtroEstatus);
      }
      setDocumentos(filtered);
      setTotal(filtered.length);
      setLoading(false);
      return;
    }

    // Produccion
    let query = supabase
      .from('tbl_documento_saliente')
      .select('*', { count: 'exact' })
      .eq('id_ua_emisora', usuario?.unidad_administrativa?.id_ua)
      .order('fecha_elaboracion', { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

    if (filtroEstatus !== 'todos') {
      query = query.eq('estatus_saliente', filtroEstatus);
    }

    const { data, count, error } = await query;

    if (!error) {
      setDocumentos(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const getEstatusColor = (estatus: string) => {
    const colors: Record<string, 'warning' | 'primary' | 'success' | 'danger' | 'default'> = {
      Borrador: 'warning',
      Firmado: 'primary',
      Enviado: 'success',
      Cancelado: 'danger',
      Reactivado: 'default',
    };
    return colors[estatus] || 'default';
  };

  const getTipoDocColor = (tipo: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
      Oficio: 'primary',
      Nota_Informativa: 'secondary',
      Circular: 'success',
      Memorandum: 'warning',
    };
    return colors[tipo] || 'primary';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleVerDetalle = (id: string) => {
    if (isDevMode || DEV_MODE) {
      toast.info('Vista de detalle (modo desarrollo)');
    } else {
      navigate(`/salientes/${id}`);
    }
  };

  const handleImprimir = (folio: string) => {
    if (isDevMode || DEV_MODE) {
      toast.info(`Imprimiendo ${folio} (modo desarrollo)`);
    }
  };

  const filteredDocs = documentos.filter(
    (doc) =>
      doc.numero_folio.toLowerCase().includes(search.toLowerCase()) ||
      doc.asunto.toLowerCase().includes(search.toLowerCase()) ||
      doc.destinatario_nombre?.toLowerCase().includes(search.toLowerCase())
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
            <FolderOpen style={{ color: 'var(--theme-primary-600)' }} />
            Documentos Salientes
          </h1>
          <p className="text-sm text-gray-500">Oficios, circulares y memorandums emitidos</p>
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
            onPress={() => navigate('/salientes/nuevo')}
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
              placeholder="Buscar por folio, asunto o destinatario..."
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
              <SelectItem key="Borrador">Borrador</SelectItem>
              <SelectItem key="Firmado">Firmado</SelectItem>
              <SelectItem key="Enviado">Enviado</SelectItem>
              <SelectItem key="Cancelado">Cancelado</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm overflow-hidden">
        <Table
          aria-label="Documentos salientes"
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
            <TableColumn className="text-xs hidden sm:table-cell">TIPO</TableColumn>
            <TableColumn className="text-xs hidden md:table-cell">FECHA</TableColumn>
            <TableColumn className="text-xs">ASUNTO</TableColumn>
            <TableColumn className="text-xs hidden lg:table-cell">DESTINATARIO</TableColumn>
            <TableColumn className="text-xs">ESTATUS</TableColumn>
            <TableColumn className="text-xs">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody items={filteredDocs} isLoading={loading} emptyContent="Sin documentos">
            {(doc) => (
              <TableRow key={doc.id_doc_saliente} className="hover:bg-gray-50">
                <TableCell>
                  <span
                    className="font-mono text-xs sm:text-sm font-medium"
                    style={{ color: 'var(--theme-primary-700)' }}
                  >
                    {doc.numero_folio}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Chip size="sm" color={getTipoDocColor(doc.tipo_doc)} variant="flat">
                    <span className="text-[10px]">
                      {doc.tipo_doc.replace('_', ' ')}
                    </span>
                  </Chip>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs text-gray-600">
                    {formatDate(doc.fecha_elaboracion)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] sm:max-w-[200px] md:max-w-xs">
                    <p className="text-xs sm:text-sm truncate" title={doc.asunto}>
                      {doc.asunto}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-xs text-gray-600">
                    {doc.destinatario_nombre || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={getEstatusColor(doc.estatus_saliente)} variant="flat">
                    <span className="text-[10px]">{doc.estatus_saliente}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip content="Ver detalle">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleVerDetalle(doc.id_doc_saliente)}
                      >
                        <Eye size={16} style={{ color: 'var(--theme-primary-600)' }} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Imprimir">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleImprimir(doc.numero_folio)}
                      >
                        <Printer size={16} className="text-gray-600" />
                      </Button>
                    </Tooltip>
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
          Modo desarrollo - Mostrando {filteredDocs.length} documentos de ejemplo
        </p>
      )}
    </div>
  );
}
