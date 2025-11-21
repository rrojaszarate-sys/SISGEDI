import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,
  Divider,
  Spinner,
  Progress,
  Accordion,
  AccordionItem,
} from '@nextui-org/react';
import {
  ArrowLeft,
  FileText,
  Send,
  Download,
  User,
  Building2,
  Calendar,
  Paperclip,
} from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

// Mock data for development mode
const MOCK_DOCUMENTO = {
  id_doc_entrante: 'mock-doc-001',
  folio_interno: 'DOC-2025-0156',
  numero_oficio_externo: 'OF-EXTERNO-2025-089',
  fecha_documento: '2025-01-15',
  fecha_registro: new Date().toISOString(),
  asunto: 'Solicitud de informacion sobre programa de apoyo social 2025 para comunidades rurales del estado',
  remitente_nombre: 'Lic. Maria Garcia Lopez',
  remitente_cargo: 'Directora de Desarrollo Social',
  remitente_institucion: 'Secretaria de Bienestar',
  estatus_general: 'En_Proceso',
  marca_seguimiento: 'Turnarse',
  prioridad: { valor: 'Urgente' },
  tipo_documento: { valor: 'Oficio' },
  area_remitente: { valor: 'Gobierno Federal' },
  cat_unidad_administrativa: {
    id_ua: 'mock-ua-1',
    codigo_ua: 'DG-001',
    nombre_ua: 'Direccion General de Correspondencia',
  },
};

const MOCK_TURNADOS = [
  {
    id_turnado: 'mock-turn-1',
    ua_origen: { nombre_ua: 'Direccion General de Correspondencia' },
    ua_destino: { nombre_ua: 'Direccion de Programas Sociales' },
    estatus_turnado: 'Recibido',
    fecha_turnado: new Date(Date.now() - 86400000 * 2).toISOString(),
    fecha_vencimiento: new Date(Date.now() + 86400000 * 5).toISOString(),
    instruccion: 'Para su atencion y seguimiento correspondiente',
    porcentaje_avance: 45,
  },
  {
    id_turnado: 'mock-turn-2',
    ua_origen: { nombre_ua: 'Oficina del Titular' },
    ua_destino: { nombre_ua: 'Direccion General de Correspondencia' },
    estatus_turnado: 'Concluido',
    fecha_turnado: new Date(Date.now() - 86400000 * 5).toISOString(),
    fecha_vencimiento: new Date(Date.now() - 86400000 * 2).toISOString(),
    instruccion: 'Turnar a area correspondiente para su atencion',
    porcentaje_avance: 100,
  },
];

const MOCK_ANEXOS = [
  {
    id_anexo: 'mock-anexo-1',
    nombre_archivo: 'Oficio_Solicitud_2025.pdf',
    storage_path: 'mock-path/oficio.pdf',
    tamano_bytes: 245760,
    tipo_mime: 'application/pdf',
  },
  {
    id_anexo: 'mock-anexo-2',
    nombre_archivo: 'Anexo_Estadisticas.xlsx',
    storage_path: 'mock-path/estadisticas.xlsx',
    tamano_bytes: 89120,
    tipo_mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
];

export default function DetalleDocumentoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDevMode } = useAuth();
  const [documento, setDocumento] = useState<any>(null);
  const [turnados, setTurnados] = useState<any[]>([]);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDocumento();
  }, [id]);

  const fetchDocumento = async () => {
    setLoading(true);

    // En modo desarrollo, usar datos mock
    if (isDevMode || DEV_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setDocumento(MOCK_DOCUMENTO);
      setTurnados(MOCK_TURNADOS);
      setAnexos(MOCK_ANEXOS);
      setLoading(false);
      return;
    }

    // Documento principal
    const { data: docData } = await supabase
      .from('tbl_documento_entrante')
      .select(`
        *,
        cat_unidad_administrativa(*),
        prioridad:id_prioridad(valor),
        tipo_documento:id_tipo_doc(valor),
        area_remitente:id_area_remitente(valor)
      `)
      .eq('id_doc_entrante', id)
      .single();

    setDocumento(docData);

    // Turnados
    const { data: turnadosData } = await supabase
      .from('tbl_turnado')
      .select(`
        *,
        ua_destino:id_ua_destino(nombre_ua),
        ua_origen:id_ua_origen(nombre_ua)
      `)
      .eq('id_doc_entrante', id)
      .order('fecha_turnado', { ascending: false });

    setTurnados(turnadosData || []);

    // Anexos
    const { data: anexosData } = await supabase
      .from('tbl_anexos')
      .select('*')
      .eq('id_doc_entrante', id);

    setAnexos(anexosData || []);

    setLoading(false);
  };

  const handleDownload = async (path: string, nombre: string) => {
    // En modo desarrollo, simular descarga
    if (isDevMode || DEV_MODE) {
      toast.info(`Descarga simulada: ${nombre}`);
      return;
    }

    const { data } = await supabase.storage.from('documentos').download(path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      a.click();
    } else {
      toast.error('Error al descargar archivo');
    }
  };

  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEstatusColor = (estatus: string) => {
    const colors: Record<string, 'warning' | 'primary' | 'success' | 'default' | 'danger'> = {
      Pendiente: 'warning',
      En_Proceso: 'primary',
      Concluido: 'success',
      Archivado: 'default',
      Turnado: 'warning',
      Recibido: 'primary',
      Rechazado: 'danger',
    };
    return colors[estatus] || 'default';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="text-sm text-gray-500 mt-3">Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="text-center py-8">
        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Documento no encontrado</p>
        <Button
          variant="light"
          className="mt-4"
          onPress={() => navigate('/documentos')}
          style={{ color: 'var(--theme-primary-600)' }}
        >
          Volver a documentos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate('/documentos')}
            size="sm"
          >
            <ArrowLeft size={20} style={{ color: 'var(--theme-primary-600)' }} />
          </Button>
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold flex items-center gap-2"
              style={{ color: 'var(--theme-primary-800)' }}
            >
              <FileText style={{ color: 'var(--theme-primary-600)' }} />
              {documento.folio_interno}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">Detalle del documento</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto sm:ml-0">
          {documento.marca_seguimiento === 'Turnarse' &&
            documento.estatus_general !== 'Concluido' && (
              <Button
                color="primary"
                startContent={<Send size={18} />}
                onPress={() => navigate(`/turnado/nuevo/${documento.id_doc_entrante}`)}
                style={{ backgroundColor: 'var(--theme-primary-700)' }}
                size="sm"
                className="sm:size-md"
              >
                <span className="hidden sm:inline">Turnar</span>
                <span className="sm:hidden">Turnar</span>
              </Button>
            )}
        </div>
      </div>

      {/* Info principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                Informacion del Documento
              </p>
              <div className="flex gap-2 flex-wrap">
                <Chip size="sm" color={getEstatusColor(documento.estatus_general)}>
                  {documento.estatus_general?.replace('_', ' ')}
                </Chip>
                {documento.prioridad?.valor === 'Urgente' && (
                  <Chip size="sm" color="danger">Urgente</Chip>
                )}
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4 p-4 sm:p-6">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Asunto</p>
                <p className="font-medium text-sm sm:text-base">{documento.asunto}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Numero de Oficio</p>
                  <p className="text-sm sm:text-base">{documento.numero_oficio_externo || '-'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Tipo de Documento</p>
                  <p className="text-sm sm:text-base">{documento.tipo_documento?.valor || '-'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Fecha del Documento</p>
                  <p className="text-sm sm:text-base">{documento.fecha_documento || '-'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Fecha de Registro</p>
                  <p className="text-sm sm:text-base">{formatDateShort(documento.fecha_registro)}</p>
                </div>
              </div>

              <Divider />

              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-2">Marca de Seguimiento</p>
                <Chip variant="flat" size="sm">{documento.marca_seguimiento}</Chip>
              </div>
            </CardBody>
          </Card>

          {/* Historial de turnados */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                Historial de Turnados ({turnados.length})
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="p-4 sm:p-6">
              {turnados.length > 0 ? (
                <Accordion>
                  {turnados.map((t) => (
                    <AccordionItem
                      key={t.id_turnado}
                      title={
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                          <span className="text-xs sm:text-sm">
                            {t.ua_origen?.nombre_ua} → {t.ua_destino?.nombre_ua}
                          </span>
                          <Chip size="sm" color={getEstatusColor(t.estatus_turnado)}>
                            {t.estatus_turnado}
                          </Chip>
                        </div>
                      }
                      subtitle={
                        <span className="text-xs">{formatDateShort(t.fecha_turnado)}</span>
                      }
                    >
                      <div className="space-y-3 p-2">
                        {t.instruccion && (
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">Instruccion</p>
                            <p className="text-sm">{t.instruccion}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Vencimiento</p>
                          <p className="text-sm">{formatDateShort(t.fecha_vencimiento)}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500 mb-1">Avance</p>
                          <Progress
                            value={t.porcentaje_avance}
                            color="primary"
                            showValueLabel
                            size="sm"
                          />
                        </div>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">Sin turnados</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Remitente */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                <User size={18} style={{ color: 'var(--theme-primary-600)' }} />
                Remitente
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2 p-4 sm:p-6">
              <p className="font-medium text-sm sm:text-base">{documento.remitente_nombre || 'No especificado'}</p>
              {documento.remitente_cargo && (
                <p className="text-xs sm:text-sm text-gray-500">{documento.remitente_cargo}</p>
              )}
              {documento.remitente_institucion && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Building2 size={14} style={{ color: 'var(--theme-primary-500)' }} />
                  {documento.remitente_institucion}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Anexos */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                <Paperclip size={18} style={{ color: 'var(--theme-primary-600)' }} />
                Anexos ({anexos.length})
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="p-4 sm:p-6">
              {anexos.length > 0 ? (
                <div className="space-y-2">
                  {anexos.map((anexo) => (
                    <div
                      key={anexo.id_anexo}
                      className="flex items-center justify-between p-2 rounded"
                      style={{ backgroundColor: 'var(--theme-primary-50)' }}
                    >
                      <div className="flex-1 truncate">
                        <p className="text-xs sm:text-sm font-medium truncate">{anexo.nombre_archivo}</p>
                        <p className="text-xs text-gray-500">
                          {(anexo.tamano_bytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleDownload(anexo.storage_path, anexo.nombre_archivo)}
                      >
                        <Download size={16} style={{ color: 'var(--theme-primary-600)' }} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">Sin anexos</p>
              )}
            </CardBody>
          </Card>

          {/* Informacion de registro */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                <Calendar size={18} style={{ color: 'var(--theme-primary-600)' }} />
                Registro
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2 text-xs sm:text-sm p-4 sm:p-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Registrado</span>
                <span>{formatDateShort(documento.fecha_registro)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidad</span>
                <span>{documento.cat_unidad_administrativa?.codigo_ua}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Datos de ejemplo
        </p>
      )}
    </div>
  );
}
