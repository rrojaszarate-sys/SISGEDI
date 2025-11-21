import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  RadioGroup,
  Radio,
  Divider,
} from '@nextui-org/react';
import { FileText, Upload, Save, ArrowLeft } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { ValorCatalogo } from '../../types/database';

// Datos mock para modo desarrollo
const MOCK_PRIORIDADES: ValorCatalogo[] = [
  { id_valor_catalogo: 'mock-pri-1', tipo_catalogo: 'Prioridad', valor: 'Urgente', descripcion: null, es_modificable: false, orden_presentacion: 1, estatus: true, fecha_creacion: '' },
  { id_valor_catalogo: 'mock-pri-2', tipo_catalogo: 'Prioridad', valor: 'Normal', descripcion: null, es_modificable: false, orden_presentacion: 2, estatus: true, fecha_creacion: '' },
  { id_valor_catalogo: 'mock-pri-3', tipo_catalogo: 'Prioridad', valor: 'Baja', descripcion: null, es_modificable: true, orden_presentacion: 3, estatus: true, fecha_creacion: '' },
];

const MOCK_TIPOS_DOC: ValorCatalogo[] = [
  { id_valor_catalogo: 'mock-tipo-1', tipo_catalogo: 'Tipo_Documento', valor: 'Oficio', descripcion: null, es_modificable: false, orden_presentacion: 1, estatus: true, fecha_creacion: '' },
  { id_valor_catalogo: 'mock-tipo-2', tipo_catalogo: 'Tipo_Documento', valor: 'Circular', descripcion: null, es_modificable: false, orden_presentacion: 2, estatus: true, fecha_creacion: '' },
  { id_valor_catalogo: 'mock-tipo-3', tipo_catalogo: 'Tipo_Documento', valor: 'Memorandum', descripcion: null, es_modificable: true, orden_presentacion: 3, estatus: true, fecha_creacion: '' },
];

const MOCK_AREAS: ValorCatalogo[] = [
  { id_valor_catalogo: 'mock-area-1', tipo_catalogo: 'Area_Remitente', valor: 'Gobierno Federal', descripcion: null, es_modificable: true, orden_presentacion: 1, estatus: true, fecha_creacion: '' },
  { id_valor_catalogo: 'mock-area-2', tipo_catalogo: 'Area_Remitente', valor: 'Gobierno Estatal', descripcion: null, es_modificable: true, orden_presentacion: 2, estatus: true, fecha_creacion: '' },
  { id_valor_catalogo: 'mock-area-3', tipo_catalogo: 'Area_Remitente', valor: 'Particular', descripcion: null, es_modificable: true, orden_presentacion: 3, estatus: true, fecha_creacion: '' },
];

export default function NuevoDocumentoPage() {
  const navigate = useNavigate();
  const { usuario, isDevMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prioridades, setPrioridades] = useState<ValorCatalogo[]>([]);
  const [tiposDoc, setTiposDoc] = useState<ValorCatalogo[]>([]);
  const [areasRemitente, setAreasRemitente] = useState<ValorCatalogo[]>([]);

  const [formData, setFormData] = useState({
    numero_oficio_externo: '',
    fecha_documento: '',
    asunto: '',
    id_prioridad: '',
    id_tipo_doc: '',
    id_area_remitente: '',
    remitente_nombre: '',
    remitente_cargo: '',
    remitente_institucion: '',
    marca_seguimiento: 'Turnarse',
  });

  const [archivo, setArchivo] = useState<File | null>(null);

  useEffect(() => {
    fetchCatalogos();
  }, []);

  const fetchCatalogos = async () => {
    // En modo desarrollo, usar datos mock
    if (isDevMode || DEV_MODE) {
      setPrioridades(MOCK_PRIORIDADES);
      setTiposDoc(MOCK_TIPOS_DOC);
      setAreasRemitente(MOCK_AREAS);
      return;
    }

    const [prioRes, tipoRes, areaRes] = await Promise.all([
      supabase.from('cat_valores_catalogo').select('*').eq('tipo_catalogo', 'Prioridad').eq('estatus', true),
      supabase.from('cat_valores_catalogo').select('*').eq('tipo_catalogo', 'Tipo_Documento').eq('estatus', true),
      supabase.from('cat_valores_catalogo').select('*').eq('tipo_catalogo', 'Area_Remitente').eq('estatus', true),
    ]);

    setPrioridades(prioRes.data || []);
    setTiposDoc(tipoRes.data || []);
    setAreasRemitente(areaRes.data || []);
  };

  const handleSubmit = async () => {
    if (!formData.asunto) {
      toast.error('El asunto es obligatorio');
      return;
    }

    setLoading(true);

    // En modo desarrollo, simular guardado
    if (isDevMode || DEV_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockFolio = `DOC-2025-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`;
      toast.success(`Documento ${mockFolio} registrado (modo desarrollo)`);
      navigate('/documentos');
      setLoading(false);
      return;
    }

    try {
      // Crear documento
      const { data: docData, error: docError } = await supabase
        .from('tbl_documento_entrante')
        .insert({
          numero_oficio_externo: formData.numero_oficio_externo || null,
          fecha_documento: formData.fecha_documento || null,
          asunto: formData.asunto,
          id_prioridad: formData.id_prioridad || null,
          id_tipo_doc: formData.id_tipo_doc || null,
          id_area_remitente: formData.id_area_remitente || null,
          remitente_nombre: formData.remitente_nombre || null,
          remitente_cargo: formData.remitente_cargo || null,
          remitente_institucion: formData.remitente_institucion || null,
          marca_seguimiento: formData.marca_seguimiento,
          id_ua_registro: usuario?.unidad_administrativa?.id_ua,
          id_usuario_registro: usuario?.id_usuario,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Subir archivo si existe
      if (archivo && docData) {
        const fileName = `${docData.id_doc_entrante}/${archivo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(fileName, archivo);

        if (!uploadError) {
          await supabase.from('tbl_anexos').insert({
            id_doc_entrante: docData.id_doc_entrante,
            nombre_archivo: archivo.name,
            storage_path: fileName,
            tipo_mime: archivo.type,
            tamano_bytes: archivo.size,
            cargado_por: usuario?.id_usuario,
          });
        }
      }

      toast.success('Documento registrado correctamente');
      navigate(`/documentos/${docData.id_doc_entrante}`);
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
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
            Nuevo Documento Entrante
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Registro de correspondencia recibida</p>
        </div>
      </div>

      {/* Formulario */}
      <Card className="shadow-sm">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
            Informacion del Documento
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Datos basicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Numero de Oficio Externo"
              placeholder="Ej: OF-2025-001"
              value={formData.numero_oficio_externo}
              onValueChange={(v) => setFormData({ ...formData, numero_oficio_externo: v })}
              size="sm"
            />
            <Input
              type="date"
              label="Fecha del Documento"
              value={formData.fecha_documento}
              onValueChange={(v) => setFormData({ ...formData, fecha_documento: v })}
              size="sm"
            />
          </div>

          <Textarea
            label="Asunto"
            placeholder="Describe el asunto del documento..."
            value={formData.asunto}
            onValueChange={(v) => setFormData({ ...formData, asunto: v })}
            isRequired
            minRows={3}
            size="sm"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Prioridad"
              selectedKeys={formData.id_prioridad ? [formData.id_prioridad] : []}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, id_prioridad: Array.from(keys)[0] as string })
              }
              size="sm"
            >
              {prioridades.map((p) => (
                <SelectItem key={p.id_valor_catalogo}>{p.valor}</SelectItem>
              ))}
            </Select>
            <Select
              label="Tipo de Documento"
              selectedKeys={formData.id_tipo_doc ? [formData.id_tipo_doc] : []}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, id_tipo_doc: Array.from(keys)[0] as string })
              }
              size="sm"
            >
              {tiposDoc.map((t) => (
                <SelectItem key={t.id_valor_catalogo}>{t.valor}</SelectItem>
              ))}
            </Select>
            <Select
              label="Area Remitente"
              selectedKeys={formData.id_area_remitente ? [formData.id_area_remitente] : []}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, id_area_remitente: Array.from(keys)[0] as string })
              }
              className="sm:col-span-2 lg:col-span-1"
              size="sm"
            >
              {areasRemitente.map((a) => (
                <SelectItem key={a.id_valor_catalogo}>{a.valor}</SelectItem>
              ))}
            </Select>
          </div>

          <Divider />

          {/* Datos del remitente */}
          <p className="font-medium text-sm" style={{ color: 'var(--theme-primary-700)' }}>
            Datos del Remitente
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Nombre del Remitente"
              placeholder="Nombre completo"
              value={formData.remitente_nombre}
              onValueChange={(v) => setFormData({ ...formData, remitente_nombre: v })}
              size="sm"
            />
            <Input
              label="Cargo"
              placeholder="Cargo o puesto"
              value={formData.remitente_cargo}
              onValueChange={(v) => setFormData({ ...formData, remitente_cargo: v })}
              size="sm"
            />
            <Input
              label="Institucion"
              placeholder="Institucion de procedencia"
              value={formData.remitente_institucion}
              onValueChange={(v) => setFormData({ ...formData, remitente_institucion: v })}
              className="sm:col-span-2 lg:col-span-1"
              size="sm"
            />
          </div>

          <Divider />

          {/* Marca de seguimiento */}
          <div>
            <p className="font-medium mb-3 text-sm" style={{ color: 'var(--theme-primary-700)' }}>
              Marca de Seguimiento
            </p>
            <RadioGroup
              orientation="horizontal"
              value={formData.marca_seguimiento}
              onValueChange={(v) => setFormData({ ...formData, marca_seguimiento: v })}
              size="sm"
              classNames={{ wrapper: 'gap-4 flex-wrap' }}
            >
              <Radio value="Turnarse">Para Turnarse</Radio>
              <Radio value="Archivo">Archivo</Radio>
              <Radio value="Conocimiento">Conocimiento</Radio>
            </RadioGroup>
          </div>

          <Divider />

          {/* Archivo adjunto */}
          <div>
            <p className="font-medium mb-3 text-sm" style={{ color: 'var(--theme-primary-700)' }}>
              Documento Digitalizado
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center"
              style={{ borderColor: 'var(--theme-primary-300)' }}
            >
              <input
                type="file"
                id="archivo"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="archivo"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload size={32} style={{ color: 'var(--theme-primary-400)' }} />
                {archivo ? (
                  <p className="font-medium text-sm" style={{ color: 'var(--theme-primary-700)' }}>
                    {archivo.name}
                  </p>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm">Arrastra o haz clic para subir</p>
                    <p className="text-xs text-gray-400">PDF, Word, imagenes (max. 10MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Botones */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <Button variant="light" onPress={() => navigate('/documentos')} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button
          color="primary"
          startContent={<Save size={18} />}
          onPress={handleSubmit}
          isLoading={loading}
          style={{ backgroundColor: 'var(--theme-primary-700)' }}
          className="w-full sm:w-auto"
        >
          Guardar Documento
        </Button>
      </div>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - El documento no se guardara en base de datos
        </p>
      )}
    </div>
  );
}
