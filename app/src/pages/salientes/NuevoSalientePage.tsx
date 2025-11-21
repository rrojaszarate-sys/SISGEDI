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
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const tiposDocumento = [
  { key: 'Oficio', label: 'Oficio' },
  { key: 'Nota_Informativa', label: 'Nota Informativa' },
  { key: 'Circular', label: 'Circular' },
  { key: 'Memorandum', label: 'Memorándum' },
];

export default function NuevoSalientePage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
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
        id_ua_emisora: usuario?.id_ua,
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="light" onPress={() => navigate('/salientes')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary" />
            Nuevo Documento Saliente
          </h1>
          <p className="text-gray-500">Crear oficio, circular o memorándum</p>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <p className="font-semibold">Información del Documento</p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Documento"
              selectedKeys={[formData.tipo_doc]}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, tipo_doc: Array.from(keys)[0] as string })
              }
              isRequired
            >
              {tiposDocumento.map((t) => (
                <SelectItem key={t.key}>{t.label}</SelectItem>
              ))}
            </Select>
            <div className="flex items-center">
              <p className="text-sm text-gray-500">
                El número de folio se generará automáticamente
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
          />

          <Divider />

          <p className="font-medium">Datos del Destinatario</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nombre del Destinatario"
              placeholder="Nombre completo"
              value={formData.destinatario_nombre}
              onValueChange={(v) => setFormData({ ...formData, destinatario_nombre: v })}
            />
            <Input
              label="Cargo"
              placeholder="Cargo o puesto"
              value={formData.destinatario_cargo}
              onValueChange={(v) => setFormData({ ...formData, destinatario_cargo: v })}
            />
            <Input
              label="Institución"
              placeholder="Institución destino"
              value={formData.destinatario_institucion}
              onValueChange={(v) => setFormData({ ...formData, destinatario_institucion: v })}
            />
          </div>

          <Divider />

          <Textarea
            label="Contenido del Documento"
            placeholder="Redacta el contenido del documento..."
            value={formData.contenido}
            onValueChange={(v) => setFormData({ ...formData, contenido: v })}
            minRows={8}
          />
        </CardBody>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button variant="light" onPress={() => navigate('/salientes')}>
          Cancelar
        </Button>
        <Button
          color="primary"
          startContent={<Save size={18} />}
          onPress={handleSubmit}
          isLoading={loading}
        >
          Guardar Borrador
        </Button>
      </div>
    </div>
  );
}
