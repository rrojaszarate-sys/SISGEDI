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
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { ValorCatalogo } from '../../types/database';

export default function NuevoDocumentoPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
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
          id_ua_registro: usuario?.id_ua,
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate('/documentos')}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary" />
            Nuevo Documento Entrante
          </h1>
          <p className="text-gray-500">Registro de correspondencia recibida</p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <p className="font-semibold">Información del Documento</p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número de Oficio Externo"
              placeholder="Ej: OF-2025-001"
              value={formData.numero_oficio_externo}
              onValueChange={(v) => setFormData({ ...formData, numero_oficio_externo: v })}
            />
            <Input
              type="date"
              label="Fecha del Documento"
              value={formData.fecha_documento}
              onValueChange={(v) => setFormData({ ...formData, fecha_documento: v })}
            />
          </div>

          <Textarea
            label="Asunto"
            placeholder="Describe el asunto del documento..."
            value={formData.asunto}
            onValueChange={(v) => setFormData({ ...formData, asunto: v })}
            isRequired
            minRows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Prioridad"
              selectedKeys={formData.id_prioridad ? [formData.id_prioridad] : []}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, id_prioridad: Array.from(keys)[0] as string })
              }
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
            >
              {tiposDoc.map((t) => (
                <SelectItem key={t.id_valor_catalogo}>{t.valor}</SelectItem>
              ))}
            </Select>
            <Select
              label="Área Remitente"
              selectedKeys={formData.id_area_remitente ? [formData.id_area_remitente] : []}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, id_area_remitente: Array.from(keys)[0] as string })
              }
            >
              {areasRemitente.map((a) => (
                <SelectItem key={a.id_valor_catalogo}>{a.valor}</SelectItem>
              ))}
            </Select>
          </div>

          <Divider />

          {/* Datos del remitente */}
          <p className="font-medium">Datos del Remitente</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nombre del Remitente"
              placeholder="Nombre completo"
              value={formData.remitente_nombre}
              onValueChange={(v) => setFormData({ ...formData, remitente_nombre: v })}
            />
            <Input
              label="Cargo"
              placeholder="Cargo o puesto"
              value={formData.remitente_cargo}
              onValueChange={(v) => setFormData({ ...formData, remitente_cargo: v })}
            />
            <Input
              label="Institución"
              placeholder="Institución de procedencia"
              value={formData.remitente_institucion}
              onValueChange={(v) => setFormData({ ...formData, remitente_institucion: v })}
            />
          </div>

          <Divider />

          {/* Marca de seguimiento */}
          <div>
            <p className="font-medium mb-3">Marca de Seguimiento</p>
            <RadioGroup
              orientation="horizontal"
              value={formData.marca_seguimiento}
              onValueChange={(v) => setFormData({ ...formData, marca_seguimiento: v })}
            >
              <Radio value="Turnarse">Para Turnarse</Radio>
              <Radio value="Archivo">Archivo</Radio>
              <Radio value="Conocimiento">Conocimiento</Radio>
            </RadioGroup>
          </div>

          <Divider />

          {/* Archivo adjunto */}
          <div>
            <p className="font-medium mb-3">Documento Digitalizado</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                <Upload size={32} className="text-gray-400" />
                {archivo ? (
                  <p className="text-primary font-medium">{archivo.name}</p>
                ) : (
                  <>
                    <p className="text-gray-600">Arrastra o haz clic para subir</p>
                    <p className="text-xs text-gray-400">PDF, Word, imágenes (máx. 10MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button variant="light" onPress={() => navigate('/documentos')}>
          Cancelar
        </Button>
        <Button
          color="primary"
          startContent={<Save size={18} />}
          onPress={handleSubmit}
          isLoading={loading}
        >
          Guardar Documento
        </Button>
      </div>
    </div>
  );
}
