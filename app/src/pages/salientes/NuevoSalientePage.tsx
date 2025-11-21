import { useState } from 'react';
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
  Divider,
} from '@nextui-org/react';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { devDocumentosSalientes } from '../../lib/devStorage';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const tiposDocumento = [
  { key: 'Oficio', label: 'Oficio' },
  { key: 'Nota_Informativa', label: 'Nota Informativa' },
  { key: 'Circular', label: 'Circular' },
  { key: 'Memorandum', label: 'Memorandum' },
];

export default function NuevoSalientePage() {
  const navigate = useNavigate();
  const { usuario, isDevMode } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo_doc: 'Oficio',
    asunto: '',
    destinatario_nombre: '',
    destinatario_cargo: '',
    destinatario_institucion: '',
    contenido: '',
  });

  const handleSubmit = async () => {
    if (!formData.asunto) {
      toast.error('El asunto es obligatorio');
      return;
    }

    setLoading(true);

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const nuevoDoc = devDocumentosSalientes.create({
        tipo_doc: formData.tipo_doc,
        fecha_elaboracion: new Date().toISOString(),
        asunto: formData.asunto,
        destinatario_nombre: formData.destinatario_nombre || null,
        destinatario_cargo: formData.destinatario_cargo || null,
        destinatario_institucion: formData.destinatario_institucion || null,
        contenido_cuerpo: formData.contenido || null,
        estatus_saliente: 'Borrador',
        id_ua_emisora: usuario?.unidad_administrativa?.id_ua || 'ua-001',
        id_usuario_elabora: usuario?.id_usuario || 'usr-001',
      });
      toast.success(`Documento ${nuevoDoc.numero_folio} creado exitosamente`);
      navigate('/salientes');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tbl_documento_saliente')
      .insert({
        tipo_doc: formData.tipo_doc,
        ejercicio_fiscal: new Date().getFullYear(),
        asunto: formData.asunto,
        destinatario_nombre: formData.destinatario_nombre || null,
        destinatario_cargo: formData.destinatario_cargo || null,
        destinatario_institucion: formData.destinatario_institucion || null,
        contenido: formData.contenido || null,
        id_ua_emisora: usuario?.unidad_administrativa?.id_ua,
        id_usuario_elabora: usuario?.id_usuario,
      })
      .select()
      .single();

    if (error) {
      toast.error('Error al crear documento');
    } else {
      toast.success(`Documento ${data.numero_folio} creado`);
      navigate('/salientes');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
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
            <FileText style={{ color: 'var(--theme-primary-600)' }} />
            Nuevo Documento Saliente
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Crear oficio, circular o memorandum</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Documento"
              selectedKeys={[formData.tipo_doc]}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, tipo_doc: Array.from(keys)[0] as string })
              }
              isRequired
              size="sm"
            >
              {tiposDocumento.map((t) => (
                <SelectItem key={t.key}>{t.label}</SelectItem>
              ))}
            </Select>
            <div className="flex items-center">
              <p className="text-xs sm:text-sm text-gray-500">
                El numero de folio se generara automaticamente
              </p>
            </div>
          </div>

          <Textarea
            label="Asunto"
            placeholder="Describe el asunto del documento..."
            value={formData.asunto}
            onValueChange={(v) => setFormData({ ...formData, asunto: v })}
            isRequired
            minRows={2}
            size="sm"
          />

          <Divider />

          <p className="font-medium text-sm" style={{ color: 'var(--theme-primary-700)' }}>
            Datos del Destinatario
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Nombre del Destinatario"
              placeholder="Nombre completo"
              value={formData.destinatario_nombre}
              onValueChange={(v) => setFormData({ ...formData, destinatario_nombre: v })}
              size="sm"
            />
            <Input
              label="Cargo"
              placeholder="Cargo o puesto"
              value={formData.destinatario_cargo}
              onValueChange={(v) => setFormData({ ...formData, destinatario_cargo: v })}
              size="sm"
            />
            <Input
              label="Institucion"
              placeholder="Institucion destino"
              value={formData.destinatario_institucion}
              onValueChange={(v) => setFormData({ ...formData, destinatario_institucion: v })}
              className="sm:col-span-2 lg:col-span-1"
              size="sm"
            />
          </div>

          <Divider />

          <Textarea
            label="Contenido del Documento"
            placeholder="Redacta el contenido del documento..."
            value={formData.contenido}
            onValueChange={(v) => setFormData({ ...formData, contenido: v })}
            minRows={6}
            size="sm"
          />
        </CardBody>
      </Card>

      {/* Botones */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <Button
          variant="light"
          onPress={() => navigate('/salientes')}
          className="w-full sm:w-auto"
        >
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
          Guardar Borrador
        </Button>
      </div>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Los datos se guardan en almacenamiento local
        </p>
      )}
    </div>
  );
}
