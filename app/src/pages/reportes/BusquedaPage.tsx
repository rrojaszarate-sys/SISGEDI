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
} from '@nextui-org/react';
import { Search, Eye, FileText, Calendar, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ResultadoBusqueda {
  id_doc_entrante: string;
  folio_interno: string;
  asunto: string;
  remitente_nombre: string;
  fecha_registro: string;
  rank: number;
}

export default function BusquedaPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase.rpc('search_documentos', {
        p_query: query,
        p_id_ua: usuario?.id_ua,
        p_limit: 50,
      });

      if (error) throw error;
      setResultados(data || []);
    } catch (error) {
      console.error('Error en búsqueda:', error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const highlightText = (text: string) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="text-primary" />
          Búsqueda Inteligente
        </h1>
        <p className="text-gray-500">Busca documentos por contenido, asunto o remitente</p>
      </div>

      {/* Barra de búsqueda */}
      <Card>
        <CardBody>
          <div className="flex gap-3">
            <Input
              placeholder="Escribe palabras clave para buscar..."
              value={query}
              onValueChange={setQuery}
              onKeyPress={handleKeyPress}
              startContent={<Search size={18} className="text-gray-400" />}
              size="lg"
              className="flex-1"
            />
            <Button
              color="primary"
              size="lg"
              onPress={handleSearch}
              isLoading={loading}
            >
              Buscar
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Puedes buscar por: asunto, contenido del documento, nombre del remitente
          </p>
        </CardBody>
      </Card>

      {/* Resultados */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" label="Buscando..." />
        </div>
      ) : searched ? (
        resultados.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Se encontraron <strong>{resultados.length}</strong> resultados
            </p>

            <Table aria-label="Resultados de búsqueda">
              <TableHeader>
                <TableColumn>FOLIO</TableColumn>
                <TableColumn>FECHA</TableColumn>
                <TableColumn>ASUNTO</TableColumn>
                <TableColumn>REMITENTE</TableColumn>
                <TableColumn>RELEVANCIA</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody items={resultados}>
                {(item) => (
                  <TableRow key={item.id_doc_entrante}>
                    <TableCell className="font-mono text-sm">
                      {item.folio_interno}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(item.fecha_registro)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div
                        className="truncate"
                        dangerouslySetInnerHTML={{ __html: highlightText(item.asunto) }}
                      />
                    </TableCell>
                    <TableCell>
                      {item.remitente_nombre ? (
                        <div className="flex items-center gap-1 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightText(item.remitente_nombre),
                            }}
                          />
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={item.rank > 0.5 ? 'success' : item.rank > 0.2 ? 'warning' : 'default'}
                        variant="flat"
                      >
                        {(item.rank * 100).toFixed(0)}%
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Tooltip content="Ver documento">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => navigate(`/documentos/${item.id_doc_entrante}`)}
                        >
                          <Eye size={16} />
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No se encontraron documentos</p>
              <p className="text-sm text-gray-400 mt-1">
                Intenta con otras palabras clave
              </p>
            </CardBody>
          </Card>
        )
      ) : (
        <Card>
          <CardBody className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Ingresa una búsqueda</p>
            <p className="text-sm text-gray-400 mt-1">
              Los resultados aparecerán aquí
            </p>
          </CardBody>
        </Card>
      )}

      {/* Tips de búsqueda */}
      <Card className="bg-blue-50 border-blue-200">
        <CardBody>
          <p className="font-medium text-blue-800 mb-2">Tips de búsqueda:</p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Usa palabras específicas para mejores resultados</li>
            <li>Puedes buscar por fragmentos de texto del documento</li>
            <li>La búsqueda ignora acentos y mayúsculas/minúsculas</li>
            <li>El sistema busca en asunto, contenido OCR y nombre del remitente</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
