import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Spinner,
  Select,
  SelectItem,
} from '@nextui-org/react';
import { Search, Eye, FileText, Calendar, User, Filter, Sparkles } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { devDocumentosEntrantes } from '../../lib/devStorage';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface ResultadoBusqueda {
  id_doc_entrante: string;
  folio_interno: string;
  asunto: string;
  remitente_nombre: string;
  fecha_registro: string;
  estatus_general: string;
  rank: number;
}

export default function BusquedaPage() {
  const navigate = useNavigate();
  const { usuario, isDevMode } = useAuth();
  const [query, setQuery] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Ingresa un termino de busqueda');
      return;
    }

    setLoading(true);
    setSearched(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const searchResults = devDocumentosEntrantes.search(query);

      let filtered = searchResults.map((doc, index) => ({
        id_doc_entrante: doc.id_doc_entrante,
        folio_interno: doc.folio_interno || '',
        asunto: doc.asunto || '',
        remitente_nombre: doc.remitente_nombre || '',
        fecha_registro: doc.fecha_registro || new Date().toISOString(),
        estatus_general: doc.estatus_general || 'Pendiente',
        rank: Math.max(0.3, 1 - (index * 0.15)), // Simular ranking por posicion
      }));

      if (filtroEstatus !== 'todos') {
        filtered = filtered.filter(r => r.estatus_general === filtroEstatus);
      }

      setResultados(filtered);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('search_documentos', {
        p_query: query,
        p_id_ua: usuario?.unidad_administrativa?.id_ua,
        p_limit: 50,
      });

      if (error) throw error;

      let filtered = data || [];
      if (filtroEstatus !== 'todos') {
        filtered = filtered.filter((r: ResultadoBusqueda) => r.estatus_general === filtroEstatus);
      }

      setResultados(filtered);
    } catch (error) {
      console.error('Error en busqueda:', error);
      toast.error('Error al realizar la busqueda');
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleVerDocumento = (id: string) => {
    navigate(`/documentos/${id}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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

  const highlightText = (text: string) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl sm:text-2xl font-bold flex items-center gap-2"
          style={{ color: 'var(--theme-primary-800)' }}
        >
          <Search style={{ color: 'var(--theme-primary-600)' }} />
          Busqueda Inteligente
        </h1>
        <p className="text-sm text-gray-500">Busca documentos por contenido, asunto o remitente</p>
      </div>

      {/* Barra de busqueda */}
      <Card className="shadow-sm">
        <CardBody className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Escribe palabras clave para buscar..."
              value={query}
              onValueChange={setQuery}
              onKeyPress={handleKeyPress}
              startContent={<Search size={18} className="text-gray-400" />}
              size="lg"
              className="flex-1"
            />
            <Select
              placeholder="Estatus"
              selectedKeys={[filtroEstatus]}
              onSelectionChange={(keys) => setFiltroEstatus(Array.from(keys)[0] as string)}
              startContent={<Filter size={16} />}
              className="w-full sm:w-40"
              size="lg"
            >
              <SelectItem key="todos">Todos</SelectItem>
              <SelectItem key="Pendiente">Pendiente</SelectItem>
              <SelectItem key="En_Proceso">En Proceso</SelectItem>
              <SelectItem key="Concluido">Concluido</SelectItem>
              <SelectItem key="Archivado">Archivado</SelectItem>
            </Select>
            <Button
              color="primary"
              size="lg"
              onPress={handleSearch}
              isLoading={loading}
              style={{ backgroundColor: 'var(--theme-primary-700)' }}
              className="w-full sm:w-auto"
            >
              Buscar
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Puedes buscar por: asunto, contenido del documento, nombre del remitente, numero de folio
          </p>
        </CardBody>
      </Card>

      {/* Resultados */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <Spinner size="lg" color="primary" />
            <p className="text-sm text-gray-500 mt-3">Buscando documentos...</p>
          </div>
        </div>
      ) : searched ? (
        resultados.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Se encontraron <strong style={{ color: 'var(--theme-primary-700)' }}>{resultados.length}</strong> resultados
              </p>
              <Chip size="sm" variant="flat" startContent={<Sparkles size={12} />}>
                Ordenados por relevancia
              </Chip>
            </div>

            <Card className="shadow-sm overflow-hidden">
              <Table aria-label="Resultados de busqueda" removeWrapper>
                <TableHeader>
                  <TableColumn className="text-xs">FOLIO</TableColumn>
                  <TableColumn className="text-xs hidden sm:table-cell">FECHA</TableColumn>
                  <TableColumn className="text-xs">ASUNTO</TableColumn>
                  <TableColumn className="text-xs hidden md:table-cell">REMITENTE</TableColumn>
                  <TableColumn className="text-xs hidden lg:table-cell">RELEVANCIA</TableColumn>
                  <TableColumn className="text-xs">ESTATUS</TableColumn>
                  <TableColumn className="text-xs">ACCIONES</TableColumn>
                </TableHeader>
                <TableBody items={resultados}>
                  {(item) => (
                    <TableRow key={item.id_doc_entrante} className="hover:bg-gray-50">
                      <TableCell>
                        <span
                          className="font-mono text-xs sm:text-sm font-medium"
                          style={{ color: 'var(--theme-primary-700)' }}
                        >
                          {item.folio_interno}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar size={12} />
                          {formatDate(item.fecha_registro)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] sm:max-w-[200px] md:max-w-sm">
                          <p
                            className="text-xs sm:text-sm truncate"
                            title={item.asunto}
                            dangerouslySetInnerHTML={{ __html: highlightText(item.asunto) }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.remitente_nombre ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <User size={12} />
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlightText(item.remitente_nombre),
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Chip
                          size="sm"
                          color={item.rank > 0.5 ? 'success' : item.rank > 0.2 ? 'warning' : 'default'}
                          variant="flat"
                        >
                          <span className="text-[10px]">{(item.rank * 100).toFixed(0)}%</span>
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color={getEstatusColor(item.estatus_general)} variant="flat">
                          <span className="text-[10px]">{item.estatus_general.replace('_', ' ')}</span>
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Tooltip content="Ver documento">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleVerDocumento(item.id_doc_entrante)}
                          >
                            <Eye size={16} style={{ color: 'var(--theme-primary-600)' }} />
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardBody className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No se encontraron documentos</p>
              <p className="text-sm text-gray-400 mt-1">
                Intenta con otras palabras clave o ajusta los filtros
              </p>
            </CardBody>
          </Card>
        )
      ) : (
        <Card className="shadow-sm">
          <CardBody className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Ingresa una busqueda</p>
            <p className="text-sm text-gray-400 mt-1">
              Los resultados apareceran aqui
            </p>
          </CardBody>
        </Card>
      )}

      {/* Tips de busqueda */}
      <Card
        className="shadow-sm"
        style={{ backgroundColor: 'var(--theme-primary-50)', borderColor: 'var(--theme-primary-200)' }}
      >
        <CardBody className="p-4">
          <p className="font-medium text-sm mb-2" style={{ color: 'var(--theme-primary-800)' }}>
            Tips de busqueda:
          </p>
          <ul className="text-xs space-y-1 list-disc list-inside" style={{ color: 'var(--theme-primary-700)' }}>
            <li>Usa palabras especificas para mejores resultados</li>
            <li>Puedes buscar por fragmentos de texto del documento</li>
            <li>La busqueda ignora acentos y mayusculas/minusculas</li>
            <li>El sistema busca en asunto, contenido OCR y nombre del remitente</li>
          </ul>
        </CardBody>
      </Card>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Busqueda simulada con datos de ejemplo
        </p>
      )}
    </div>
  );
}
