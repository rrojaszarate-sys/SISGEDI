import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Input,
  Textarea,
  Button,
  Divider,
  Chip,
} from '@nextui-org/react';
import { ArrowLeft, Send, FileText, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { UnidadAdministrativa } from '../../types/database';

export default function TurnadoPage() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [documento, setDocumento] = useState<any>(null);
  const [unidades, setUnidades] = useState<UnidadAdministrativa[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id_ua_destino: '',
    instruccion: '',
    observaciones: '',
    dias_para_atencion: '5',
  });

  useEffect(() => {
    if (docId) {
      fetchDocumento();
      fetchUnidades();
    }
  }, [docId]);

  const fetchDocumento = async () => {
    const { data } = await supabase
      .from('tbl_documento_entrante')
      .select('*, cat_unidad_administrativa(*)')
      .eq('id_doc_entrante', docId)
      .single();
    setDocumento(data);
  };

  const fetchUnidades = async () => {
    const { data } = await supabase
      .from('cat_unidad_administrativa')
      .select('*')
      .eq('estatus', true)
      .neq('id_ua', usuario?.id_ua)
      .order('nombre_ua');
    setUnidades(data || []);
  };

  const handleSubmit = async () => {
    if (!formData.id_ua_destino) {
      toast.error('Selecciona una unidad destino');
      return;
    }

    setLoading(true);

    const dias = parseInt(formData.dias_para_atencion) || 5;
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);

    const { error } = await supabase.from('tbl_turnado').insert({
      id_doc_entrante: docId,
      id_ua_origen: usuario?.id_ua,
      id_usuario_turno: usuario?.id_usuario,
      id_ua_destino: formData.id_ua_destino,
      instruccion: formData.instruccion || null,
      observaciones: formData.observaciones || null,
      dias_para_atencion: dias,
      fecha_vencimiento: fechaVencimiento.toISOString(),
    });

    if (error) {
      toast.error('Error al turnar documento');
    } else {
      // Actualizar estatus del documento
      await supabase
        .from('tbl_documento_entrante')
        .update({ estatus_general: 'En_Proceso' })
        .eq('id_doc_entrante', docId);

      toast.success('Documento turnado correctamente');
      navigate('/turnado');
    }

    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="light" onPress={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="text-primary" />
            Turnar Documento
          </h1>
          <p className="text-gray-500">Asignar documento a otra unidad</p>
        </div>
      </div>

      {/* Info del documento */}
      {documento && (
        <Card>
          <CardHeader>
            <p className="font-semibold flex items-center gap-2">
              <FileText size={18} />
              Documento a Turnar
            </p>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Folio</p>
                <p className="font-mono font-medium">{documento.folio_interno}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha Registro</p>
                <p>{formatDate(documento.fecha_registro)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Asunto</p>
                <p>{documento.asunto}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remitente</p>
                <p>{documento.remitente_nombre || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidad de Registro</p>
                <Chip size="sm">{documento.cat_unidad_administrativa?.codigo_ua}</Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Formulario de turnado */}
      <Card>
        <CardHeader>
          <p className="font-semibold">Datos del Turnado</p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          <Select
            label="Unidad Destino"
            placeholder="Selecciona la unidad a turnar"
            selectedKeys={formData.id_ua_destino ? [formData.id_ua_destino] : []}
            onSelectionChange={(keys) =>
              setFormData({ ...formData, id_ua_destino: Array.from(keys)[0] as string })
            }
            isRequired
          >
            {unidades.map((ua) => (
              <SelectItem key={ua.id_ua} textValue={ua.nombre_ua}>
                <div>
                  <p className="font-medium">{ua.nombre_ua}</p>
                  <p className="text-xs text-gray-500">{ua.codigo_ua}</p>
                </div>
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Instrucción"
            placeholder="Ej: Para su conocimiento y atención"
            value={formData.instruccion}
            onValueChange={(v) => setFormData({ ...formData, instruccion: v })}
          />

          <Textarea
            label="Observaciones"
            placeholder="Observaciones adicionales..."
            value={formData.observaciones}
            onValueChange={(v) => setFormData({ ...formData, observaciones: v })}
          />

          <Input
            type="number"
            label="Días para Atención"
            placeholder="5"
            value={formData.dias_para_atencion}
            onValueChange={(v) => setFormData({ ...formData, dias_para_atencion: v })}
            min={1}
            max={90}
            startContent={<Calendar size={18} className="text-gray-400" />}
            description="Número de días hábiles para dar atención"
          />
        </CardBody>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button variant="light" onPress={() => navigate(-1)}>
          Cancelar
        </Button>
        <Button
          color="primary"
          startContent={<Send size={18} />}
          onPress={handleSubmit}
          isLoading={loading}
        >
          Turnar Documento
        </Button>
      </div>
    </div>
  );
}
