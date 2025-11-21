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
} from '@nextui-org/react';
import { Plus, Search, Eye, FolderOpen, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { DocumentoSaliente } from '../../types/database';

export default function DocumentosSalientesPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoSaliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDocumentos();
  }, [page]);

  const fetchDocumentos = async () => {
    setLoading(true);

    const { data, count } = await supabase
      .from('tbl_documento_saliente')
      .select('*', { count: 'exact' })
      .eq('id_ua_emisora', usuario?.id_ua)
      .order('fecha_elaboracion', { ascending: false })
      .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

    setDocumentos(data || []);
    setTotal(count || 0);
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

  const filteredDocs = documentos.filter(
    (doc) =>
      doc.numero_folio.toLowerCase().includes(search.toLowerCase()) ||
      doc.asunto.toLowerCase().includes(search.toLowerCase()) ||
      doc.destinatario_nombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="text-primary" />
            Documentos Salientes
          </h1>
          <p className="text-gray-500">Oficios, circulares y memorándums emitidos</p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          onPress={() => navigate('/salientes/nuevo')}
        >
          Nuevo Documento
        </Button>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar por folio, asunto o destinatario..."
        value={search}
        onValueChange={setSearch}
        startContent={<Search size={18} className="text-gray-400" />}
        className="max-w-md"
      />

      {/* Tabla */}
      <Table
        aria-label="Documentos salientes"
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
          <TableColumn>TIPO</TableColumn>
          <TableColumn>FECHA</TableColumn>
          <TableColumn>ASUNTO</TableColumn>
          <TableColumn>DESTINATARIO</TableColumn>
          <TableColumn>ESTATUS</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={filteredDocs} isLoading={loading} emptyContent="Sin documentos">
          {(doc) => (
            <TableRow key={doc.id_doc_saliente}>
              <TableCell className="font-mono text-sm">{doc.numero_folio}</TableCell>
              <TableCell>
                <Chip size="sm" color={getTipoDocColor(doc.tipo_doc)} variant="flat">
                  {doc.tipo_doc.replace('_', ' ')}
                </Chip>
              </TableCell>
              <TableCell>{formatDate(doc.fecha_elaboracion)}</TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate">{doc.asunto}</p>
              </TableCell>
              <TableCell>{doc.destinatario_nombre || '-'}</TableCell>
              <TableCell>
                <Chip size="sm" color={getEstatusColor(doc.estatus_saliente)}>
                  {doc.estatus_saliente}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Tooltip content="Ver detalle">
                    <Button isIconOnly size="sm" variant="light">
                      <Eye size={16} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Imprimir">
                    <Button isIconOnly size="sm" variant="light">
                      <Printer size={16} />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
