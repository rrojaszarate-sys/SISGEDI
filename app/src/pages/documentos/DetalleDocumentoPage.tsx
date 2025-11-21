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
  Clock,
  User,
  Building2,
  Calendar,
  Paperclip,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function DetalleDocumentoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documento, setDocumento] = useState<any>(null);
  const [turnados, setTurnados] = useState<any[]>([]);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDocumento();
  }, [id]);

  const fetchDocumento = async () => {
    setLoading(true);

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <Spinner size="lg" />
      </div>
    );
  }

  if (!documento) {
    return <div className="text-center py-8">Documento no encontrado</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button isIconOnly variant="light" onPress={() => navigate('/documentos')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="text-primary" />
              {documento.folio_interno}
            </h1>
            <p className="text-gray-500">Detalle del documento</p>
          </div>
        </div>
        <div className="flex gap-2">
          {documento.marca_seguimiento === 'Turnarse' &&
            documento.estatus_general !== 'Concluido' && (
              <Button
                color="primary"
                startContent={<Send size={18} />}
                onPress={() => navigate(`/turnado/nuevo/${documento.id_doc_entrante}`)}
              >
                Turnar
              </Button>
            )}
        </div>
      </div>

      {/* Info principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex justify-between">
              <p className="font-semibold">Información del Documento</p>
              <div className="flex gap-2">
                <Chip color={getEstatusColor(documento.estatus_general)}>
                  {documento.estatus_general?.replace('_', ' ')}
                </Chip>
                {documento.prioridad?.valor === 'Urgente' && (
                  <Chip color="danger">Urgente</Chip>
                )}
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Asunto</p>
                <p className="font-medium">{documento.asunto}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Número de Oficio</p>
                  <p>{documento.numero_oficio_externo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo de Documento</p>
                  <p>{documento.tipo_documento?.valor || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha del Documento</p>
                  <p>{documento.fecha_documento || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Registro</p>
                  <p>{formatDate(documento.fecha_registro)}</p>
                </div>
              </div>

              <Divider />

              <div>
                <p className="text-sm text-gray-500 mb-2">Marca de Seguimiento</p>
                <Chip variant="flat">{documento.marca_seguimiento}</Chip>
              </div>
            </CardBody>
          </Card>

          {/* Historial de turnados */}
          <Card>
            <CardHeader>
              <p className="font-semibold">Historial de Turnados ({turnados.length})</p>
            </CardHeader>
            <Divider />
            <CardBody>
              {turnados.length > 0 ? (
                <Accordion>
                  {turnados.map((t, idx) => (
                    <AccordionItem
                      key={t.id_turnado}
                      title={
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {t.ua_origen?.nombre_ua} → {t.ua_destino?.nombre_ua}
                          </span>
                          <Chip size="sm" color={getEstatusColor(t.estatus_turnado)}>
                            {t.estatus_turnado}
                          </Chip>
                        </div>
                      }
                      subtitle={formatDate(t.fecha_turnado)}
                    >
                      <div className="space-y-3 p-2">
                        {t.instruccion && (
                          <div>
                            <p className="text-sm text-gray-500">Instrucción</p>
                            <p>{t.instruccion}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Vencimiento</p>
                          <p>{formatDate(t.fecha_vencimiento)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Avance</p>
                          <Progress value={t.porcentaje_avance} color="primary" showValueLabel />
                        </div>
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin turnados</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Remitente */}
          <Card>
            <CardHeader>
              <p className="font-semibold flex items-center gap-2">
                <User size={18} />
                Remitente
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2">
              <p className="font-medium">{documento.remitente_nombre || 'No especificado'}</p>
              {documento.remitente_cargo && (
                <p className="text-sm text-gray-500">{documento.remitente_cargo}</p>
              )}
              {documento.remitente_institucion && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 size={14} />
                  {documento.remitente_institucion}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Anexos */}
          <Card>
            <CardHeader>
              <p className="font-semibold flex items-center gap-2">
                <Paperclip size={18} />
                Anexos ({anexos.length})
              </p>
            </CardHeader>
            <Divider />
            <CardBody>
              {anexos.length > 0 ? (
                <div className="space-y-2">
                  {anexos.map((anexo) => (
                    <div
                      key={anexo.id_anexo}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium truncate">{anexo.nombre_archivo}</p>
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
                        <Download size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin anexos</p>
              )}
            </CardBody>
          </Card>

          {/* Información de registro */}
          <Card>
            <CardHeader>
              <p className="font-semibold flex items-center gap-2">
                <Calendar size={18} />
                Registro
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Registrado</span>
                <span>{formatDate(documento.fecha_registro)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidad</span>
                <span>{documento.cat_unidad_administrativa?.codigo_ua}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
