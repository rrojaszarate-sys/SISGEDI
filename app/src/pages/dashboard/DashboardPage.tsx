import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Progress,
  Chip,
  Divider,
} from '@nextui-org/react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  Send,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Indicadores {
  total_documentos: number;
  verdes: number;
  amarillos: number;
  rojos: number;
  promedio_avance: number;
}

interface DocReciente {
  id_doc_entrante: string;
  folio_interno: string;
  asunto: string;
  fecha_registro: string;
  estatus_general: string;
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [docsRecientes, setDocsRecientes] = useState<DocReciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usuario?.id_ua) {
      fetchData();
    }
  }, [usuario]);

  const fetchData = async () => {
    try {
      // Obtener indicadores del dashboard
      const { data: indData } = await supabase
        .rpc('obtener_indicadores_dashboard', { p_id_ua: usuario?.id_ua });

      if (indData && indData.length > 0) {
        setIndicadores(indData[0]);
      }

      // Obtener documentos recientes
      const { data: docsData } = await supabase
        .from('tbl_documento_entrante')
        .select('id_doc_entrante, folio_interno, asunto, fecha_registro, estatus_general')
        .eq('id_ua_registro', usuario?.id_ua)
        .eq('eliminado', false)
        .order('fecha_registro', { ascending: false })
        .limit(5);

      if (docsData) {
        setDocsRecientes(docsData);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Pendiente': return 'warning';
      case 'En_Proceso': return 'primary';
      case 'Concluido': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {usuario?.nombre_completo?.split(' ')[0]}
        </h1>
        <p className="text-gray-500">
          {usuario?.unidad_administrativa?.nombre_ua} - {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Tarjetas de indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm opacity-80">Total Documentos</p>
              <p className="text-3xl font-bold">{indicadores?.total_documentos || 0}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm opacity-80">En Tiempo</p>
              <p className="text-3xl font-bold">{indicadores?.verdes || 0}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm opacity-80">Por Vencer</p>
              <p className="text-3xl font-bold">{indicadores?.amarillos || 0}</p>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm opacity-80">Vencidos</p>
              <p className="text-3xl font-bold">{indicadores?.rojos || 0}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avance promedio */}
        <Card>
          <CardHeader className="flex gap-3">
            <TrendingUp className="text-primary" />
            <div>
              <p className="font-semibold">Avance Promedio</p>
              <p className="text-sm text-gray-500">Documentos en proceso</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-primary">
                {indicadores?.promedio_avance?.toFixed(0) || 0}%
              </span>
            </div>
            <Progress
              value={indicadores?.promedio_avance || 0}
              color="primary"
              size="lg"
              showValueLabel
            />
          </CardBody>
        </Card>

        {/* Documentos recientes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex gap-3">
            <Calendar className="text-primary" />
            <div>
              <p className="font-semibold">Documentos Recientes</p>
              <p className="text-sm text-gray-500">Últimos 5 registros</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-12 w-full" />
                ))}
              </div>
            ) : docsRecientes.length > 0 ? (
              <div className="space-y-3">
                {docsRecientes.map((doc) => (
                  <div
                    key={doc.id_doc_entrante}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.folio_interno}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {doc.asunto}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {formatDate(doc.fecha_registro)}
                      </span>
                      <Chip size="sm" color={getEstatusColor(doc.estatus_general)}>
                        {doc.estatus_general.replace('_', ' ')}
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-2 opacity-50" />
                <p>No hay documentos recientes</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card>
        <CardHeader>
          <p className="font-semibold">Acciones Rápidas</p>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/documentos/nuevo"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FileText className="text-blue-600 mb-2" size={32} />
              <span className="text-sm font-medium text-blue-800">Nuevo Documento</span>
            </a>
            <a
              href="/turnado"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Send className="text-green-600 mb-2" size={32} />
              <span className="text-sm font-medium text-green-800">Ver Turnados</span>
            </a>
            <a
              href="/salientes/nuevo"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FileText className="text-purple-600 mb-2" size={32} />
              <span className="text-sm font-medium text-purple-800">Nuevo Oficio</span>
            </a>
            <a
              href="/busqueda"
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Users className="text-orange-600 mb-2" size={32} />
              <span className="text-sm font-medium text-orange-800">Buscar</span>
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
