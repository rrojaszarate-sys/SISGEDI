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
} from '@nextui-org/react';
import {
  ArrowLeft,
  FileOutput,
  User,
  Building2,
  Calendar,
  Printer,
  Edit,
} from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { devDocumentosSalientes, devUnidades } from '../../lib/devStorage';
import { toast } from 'sonner';
import type { DocumentoSaliente, UnidadAdministrativa } from '../../types/database';

export default function DetalleDocumentoSalientePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDevMode } = useAuth();
  const [documento, setDocumento] = useState<DocumentoSaliente | null>(null);
  const [unidadEmisora, setUnidadEmisora] = useState<UnidadAdministrativa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDocumento();
  }, [id]);

  const fetchDocumento = async () => {
    setLoading(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const doc = devDocumentosSalientes.getById(id!);
      if (doc) {
        setDocumento(doc);
        const ua = devUnidades.getById(doc.id_ua_emisora);
        setUnidadEmisora(ua || null);
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tbl_documento_saliente')
      .select(`
        *,
        cat_unidad_administrativa(*)
      `)
      .eq('id_doc_saliente', id)
      .single();

    if (error) {
      toast.error('Error al cargar documento');
    } else {
      setDocumento(data);
      setUnidadEmisora(data.cat_unidad_administrativa);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    if (isDevMode || DEV_MODE) {
      toast.info('Funcion de impresion (modo desarrollo)');
      return;
    }
    window.print();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getEstatusColor = (estatus: string) => {
    const colors: Record<string, 'warning' | 'primary' | 'success' | 'default' | 'danger'> = {
      Borrador: 'warning',
      Firmado: 'primary',
      Enviado: 'success',
      Cancelado: 'danger',
      Reactivado: 'default',
    };
    return colors[estatus] || 'default';
  };

  const getTipoDocLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'Oficio': 'Oficio',
      'Nota_Informativa': 'Nota Informativa',
      'Circular': 'Circular',
      'Memorandum': 'Memorandum',
    };
    return labels[tipo] || tipo;
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
        <FileOutput size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Documento no encontrado</p>
        <Button
          variant="light"
          className="mt-4"
          onPress={() => navigate('/salientes')}
          style={{ color: 'var(--theme-primary-600)' }}
        >
          Volver a documentos salientes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate('/salientes')}
            size="sm"
          >
            <ArrowLeft size={20} style={{ color: 'var(--theme-primary-600)' }} />
          </Button>
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold flex items-center gap-2"
              style={{ color: 'var(--theme-primary-800)' }}
            >
              <FileOutput style={{ color: 'var(--theme-primary-600)' }} />
              {documento.numero_folio}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">Documento Saliente</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto sm:ml-0">
          {documento.estatus_saliente === 'Borrador' && (
            <Button
              variant="flat"
              startContent={<Edit size={18} />}
              onPress={() => toast.info('Edicion de documento (proximamente)')}
              size="sm"
            >
              Editar
            </Button>
          )}
          <Button
            color="primary"
            startContent={<Printer size={18} />}
            onPress={handlePrint}
            style={{ backgroundColor: 'var(--theme-primary-700)' }}
            size="sm"
          >
            Imprimir
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Informacion del documento */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                Informacion del Documento
              </p>
              <div className="flex gap-2 flex-wrap">
                <Chip size="sm" color={getEstatusColor(documento.estatus_saliente)}>
                  {documento.estatus_saliente}
                </Chip>
                <Chip size="sm" variant="flat">
                  {getTipoDocLabel(documento.tipo_doc)}
                </Chip>
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
                  <p className="text-xs sm:text-sm text-gray-500">Numero de Folio</p>
                  <p
                    className="font-mono font-medium text-sm sm:text-base"
                    style={{ color: 'var(--theme-primary-700)' }}
                  >
                    {documento.numero_folio}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Tipo de Documento</p>
                  <p className="text-sm sm:text-base">{getTipoDocLabel(documento.tipo_doc)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Fecha de Elaboracion</p>
                  <p className="text-sm sm:text-base">{formatDate(documento.fecha_elaboracion)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Estatus</p>
                  <Chip size="sm" color={getEstatusColor(documento.estatus_saliente)}>
                    {documento.estatus_saliente}
                  </Chip>
                </div>
              </div>

              {documento.contenido_cuerpo && (
                <>
                  <Divider />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">Contenido</p>
                    <div
                      className="p-4 rounded-lg text-sm"
                      style={{ backgroundColor: 'var(--theme-primary-50)' }}
                    >
                      <p className="whitespace-pre-wrap">{documento.contenido_cuerpo}</p>
                    </div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Destinatario */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                <User size={18} style={{ color: 'var(--theme-primary-600)' }} />
                Destinatario
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2 p-4 sm:p-6">
              <p className="font-medium text-sm sm:text-base">
                {documento.destinatario_nombre || 'No especificado'}
              </p>
              {documento.destinatario_cargo && (
                <p className="text-xs sm:text-sm text-gray-500">{documento.destinatario_cargo}</p>
              )}
              {documento.destinatario_institucion && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Building2 size={14} style={{ color: 'var(--theme-primary-500)' }} />
                  {documento.destinatario_institucion}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Unidad Emisora */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                <Building2 size={18} style={{ color: 'var(--theme-primary-600)' }} />
                Unidad Emisora
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2 p-4 sm:p-6">
              {unidadEmisora ? (
                <>
                  <p className="font-medium text-sm sm:text-base">{unidadEmisora.nombre_ua}</p>
                  <Chip size="sm" variant="flat">{unidadEmisora.codigo_ua}</Chip>
                </>
              ) : (
                <p className="text-sm text-gray-500">No disponible</p>
              )}
            </CardBody>
          </Card>

          {/* Fechas */}
          <Card className="shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
                <Calendar size={18} style={{ color: 'var(--theme-primary-600)' }} />
                Fechas
              </p>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-2 text-xs sm:text-sm p-4 sm:p-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Elaboracion</span>
                <span>{formatDate(documento.fecha_elaboracion)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Creacion</span>
                <span>{formatDate(documento.fecha_creacion)}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Documento desde localStorage
        </p>
      )}
    </div>
  );
}
