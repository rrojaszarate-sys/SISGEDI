import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Progress,
  Chip,
  Divider,
  Button,
} from '@nextui-org/react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Send,
  Clock,
  Plus,
  Search,
  FolderOpen,
  Package,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { devIndicadores } from '../../lib/devStorage';

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
  const { usuario, isDevMode } = useAuth();
  const navigate = useNavigate();
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [docsRecientes, setDocsRecientes] = useState<DocReciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [usuario]);

  const fetchData = async () => {
    try {
      // En modo desarrollo, usar devStorage
      if (isDevMode || DEV_MODE) {
        const idUa = usuario?.unidad_administrativa?.id_ua;
        const dashboardData = devIndicadores.getDashboard(idUa);

        setIndicadores({
          total_documentos: dashboardData.totalDocumentos,
          verdes: dashboardData.verdes,
          amarillos: dashboardData.amarillos,
          rojos: dashboardData.rojos,
          promedio_avance: dashboardData.promedioAvance,
        });

        setDocsRecientes(dashboardData.documentosRecientes.map(doc => ({
          id_doc_entrante: doc.id_doc_entrante,
          folio_interno: doc.folio_interno || '',
          asunto: doc.asunto || '',
          fecha_registro: doc.fecha_registro || new Date().toISOString(),
          estatus_general: doc.estatus_general || 'Pendiente',
        })));

        setLoading(false);
        return;
      }

      // En produccion, obtener datos reales de Supabase
      if (usuario?.unidad_administrativa?.id_ua) {
        const { data: indData } = await supabase
          .rpc('obtener_indicadores_dashboard', { p_id_ua: usuario.unidad_administrativa.id_ua });

        if (indData && indData.length > 0) {
          setIndicadores(indData[0]);
        }

        const { data: docsData } = await supabase
          .from('tbl_documento_entrante')
          .select('id_doc_entrante, folio_interno, asunto, fecha_registro, estatus_general')
          .eq('id_ua_registro', usuario.unidad_administrativa.id_ua)
          .eq('eliminado', false)
          .order('fecha_registro', { ascending: false })
          .limit(5);

        if (docsData) {
          setDocsRecientes(docsData);
        }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold"
            style={{ color: 'var(--theme-primary-800)' }}
          >
            Bienvenido, {usuario?.nombre_completo?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="text-sm text-gray-500">
            {usuario?.unidad_administrativa?.nombre_ua || 'Unidad Administrativa'} - {formatDate(new Date().toISOString())}
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={18} />}
          style={{ backgroundColor: 'var(--theme-primary-700)' }}
          onPress={() => navigate('/documentos/nuevo')}
        >
          Nuevo Documento
        </Button>
      </div>

      {/* Badge de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <div
          className="p-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--theme-warning-bg)', color: 'var(--theme-warning-text)' }}
        >
          Modo Desarrollo - Mostrando datos de ejemplo
        </div>
      )}

      {/* Tarjetas de indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className="cursor-pointer hover:scale-[1.02] transition-transform"
          style={{ background: 'linear-gradient(135deg, var(--theme-primary-600) 0%, var(--theme-primary-700) 100%)' }}
          isPressable
          onPress={() => navigate('/documentos')}
        >
          <CardBody className="flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 text-white">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
              <FileText size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-sm opacity-80">Total Documentos</p>
              <p className="text-xl sm:text-3xl font-bold">{indicadores?.total_documentos || 0}</p>
            </div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:scale-[1.02] transition-transform"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
          isPressable
        >
          <CardBody className="flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 text-white">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
              <CheckCircle size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-sm opacity-80">En Tiempo</p>
              <p className="text-xl sm:text-3xl font-bold">{indicadores?.verdes || 0}</p>
            </div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:scale-[1.02] transition-transform"
          style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' }}
          isPressable
        >
          <CardBody className="flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 text-white">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
              <Clock size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-sm opacity-80">Por Vencer</p>
              <p className="text-xl sm:text-3xl font-bold">{indicadores?.amarillos || 0}</p>
            </div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:scale-[1.02] transition-transform"
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
          isPressable
        >
          <CardBody className="flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 text-white">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
              <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-sm opacity-80">Vencidos</p>
              <p className="text-xl sm:text-3xl font-bold">{indicadores?.rojos || 0}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Avance promedio */}
        <Card className="shadow-sm">
          <CardHeader className="flex gap-3 pb-0">
            <TrendingUp style={{ color: 'var(--theme-primary-600)' }} />
            <div>
              <p className="font-semibold text-sm sm:text-base">Avance Promedio</p>
              <p className="text-xs text-gray-500">Documentos en proceso</p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="text-center mb-4">
              <span
                className="text-3xl sm:text-4xl font-bold"
                style={{ color: 'var(--theme-primary-700)' }}
              >
                {indicadores?.promedio_avance?.toFixed(0) || 0}%
              </span>
            </div>
            <Progress
              value={indicadores?.promedio_avance || 0}
              size="lg"
              showValueLabel
              classNames={{
                indicator: "bg-gradient-to-r from-[var(--theme-primary-500)] to-[var(--theme-primary-700)]"
              }}
            />
          </CardBody>
        </Card>

        {/* Documentos recientes */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex gap-3 pb-0">
            <Calendar style={{ color: 'var(--theme-primary-600)' }} />
            <div>
              <p className="font-semibold text-sm sm:text-base">Documentos Recientes</p>
              <p className="text-xs text-gray-500">Ultimos 5 registros</p>
            </div>
          </CardHeader>
          <Divider className="mt-2" />
          <CardBody className="p-2 sm:p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : docsRecientes.length > 0 ? (
              <div className="space-y-2">
                {docsRecientes.map((doc) => (
                  <div
                    key={doc.id_doc_entrante}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                    onClick={() => navigate(`/documentos/${doc.id_doc_entrante}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium text-xs sm:text-sm"
                        style={{ color: 'var(--theme-primary-700)' }}
                      >
                        {doc.folio_interno}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                        {doc.asunto}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 ml-2">
                      <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                        {formatDate(doc.fecha_registro)}
                      </span>
                      <Chip size="sm" color={getEstatusColor(doc.estatus_general)} variant="flat">
                        <span className="text-[10px] sm:text-xs">
                          {doc.estatus_general.replace('_', ' ')}
                        </span>
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

      {/* Accesos rapidos */}
      <Card className="shadow-sm">
        <CardHeader className="pb-0">
          <p className="font-semibold text-sm sm:text-base">Acciones Rapidas</p>
        </CardHeader>
        <Divider className="mt-2" />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/documentos/nuevo')}
              className="flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--theme-primary-50)' }}
            >
              <div
                className="p-2 sm:p-3 rounded-lg mb-2"
                style={{ backgroundColor: 'var(--theme-primary-100)' }}
              >
                <Plus size={24} style={{ color: 'var(--theme-primary-700)' }} />
              </div>
              <span
                className="text-[10px] sm:text-xs font-medium text-center"
                style={{ color: 'var(--theme-primary-800)' }}
              >
                Nuevo Doc.
              </span>
            </button>

            <button
              onClick={() => navigate('/documentos')}
              className="flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all hover:scale-105 bg-blue-50"
            >
              <div className="p-2 sm:p-3 rounded-lg mb-2 bg-blue-100">
                <FileText size={24} className="text-blue-700" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center text-blue-800">
                Entrantes
              </span>
            </button>

            <button
              onClick={() => navigate('/turnado')}
              className="flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all hover:scale-105 bg-green-50"
            >
              <div className="p-2 sm:p-3 rounded-lg mb-2 bg-green-100">
                <Send size={24} className="text-green-700" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center text-green-800">
                Turnados
              </span>
            </button>

            <button
              onClick={() => navigate('/salientes')}
              className="flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all hover:scale-105 bg-purple-50"
            >
              <div className="p-2 sm:p-3 rounded-lg mb-2 bg-purple-100">
                <FolderOpen size={24} className="text-purple-700" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center text-purple-800">
                Salientes
              </span>
            </button>

            <button
              onClick={() => navigate('/inventario')}
              className="flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all hover:scale-105 bg-orange-50"
            >
              <div className="p-2 sm:p-3 rounded-lg mb-2 bg-orange-100">
                <Package size={24} className="text-orange-700" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center text-orange-800">
                Inventario
              </span>
            </button>

            <button
              onClick={() => navigate('/busqueda')}
              className="flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all hover:scale-105 bg-teal-50"
            >
              <div className="p-2 sm:p-3 rounded-lg mb-2 bg-teal-100">
                <Search size={24} className="text-teal-700" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center text-teal-800">
                Busqueda
              </span>
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
