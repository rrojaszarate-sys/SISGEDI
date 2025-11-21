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
import { supabase, DEV_MODE } from '../../lib/supabase';
import { devDocumentosEntrantes, devTurnados, devUnidades } from '../../lib/devStorage';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { UnidadAdministrativa } from '../../types/database';

export default function TurnadoPage() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { usuario, isDevMode } = useAuth();
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
    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const doc = devDocumentosEntrantes.getById(docId!);
      if (doc) {
        const unidadesAll = devUnidades.getAll();
        const unidadRegistro = unidadesAll.find(u => u.id_ua === doc.id_ua_registro);
        setDocumento({
          ...doc,
          cat_unidad_administrativa: unidadRegistro ? {
            id_ua: unidadRegistro.id_ua,
            codigo_ua: unidadRegistro.codigo_ua,
            nombre_ua: unidadRegistro.nombre_ua,
          } : null,
        });
      }
      return;
    }

    const { data } = await supabase
      .from('tbl_documento_entrante')
      .select('*, cat_unidad_administrativa(*)')
      .eq('id_doc_entrante', docId)
      .single();
    setDocumento(data);
  };

  const fetchUnidades = async () => {
    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const unidadesActivas = devUnidades.getActive();
      // Filtrar la unidad del usuario actual si existe
      const unidadesFiltradas = unidadesActivas.filter(u =>
        u.id_ua !== (usuario?.unidad_administrativa?.id_ua || usuario?.id_ua)
      );
      setUnidades(unidadesFiltradas);
      return;
    }

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

    // En modo desarrollo, usar devStorage para persistencia real
    if (isDevMode || DEV_MODE) {
      try {
        devTurnados.create({
          id_doc_entrante: docId!,
          id_ua_origen: usuario?.unidad_administrativa?.id_ua || 'ua-001',
          id_usuario_turno: usuario?.id_usuario || 'usr-001',
          id_ua_destino: formData.id_ua_destino,
          instruccion: formData.instruccion || null,
          observaciones: formData.observaciones || null,
          dias_para_atencion: dias,
          fecha_vencimiento: fechaVencimiento.toISOString(),
        });

        const unidadDestino = unidades.find(u => u.id_ua === formData.id_ua_destino);
        toast.success(`Documento turnado a ${unidadDestino?.nombre_ua || 'unidad destino'}`);
        navigate('/turnado');
      } catch (error) {
        console.error(error);
        toast.error('Error al turnar documento');
      } finally {
        setLoading(false);
      }
      return;
    }

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
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate(-1)}
          size="sm"
        >
          <ArrowLeft size={20} style={{ color: 'var(--theme-primary-600)' }} />
        </Button>
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--theme-primary-800)' }}
          >
            <Send style={{ color: 'var(--theme-primary-600)' }} />
            Turnar Documento
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Asignar documento a otra unidad</p>
        </div>
      </div>

      {/* Info del documento */}
      {documento && (
        <Card className="shadow-sm">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <p className="font-semibold flex items-center gap-2 text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
              <FileText size={18} style={{ color: 'var(--theme-primary-600)' }} />
              Documento a Turnar
            </p>
          </CardHeader>
          <Divider />
          <CardBody className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Folio</p>
                <p
                  className="font-mono font-medium text-sm sm:text-base"
                  style={{ color: 'var(--theme-primary-700)' }}
                >
                  {documento.folio_interno}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Fecha Registro</p>
                <p className="text-sm sm:text-base">{formatDate(documento.fecha_registro)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-500">Asunto</p>
                <p className="text-sm sm:text-base">{documento.asunto}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Remitente</p>
                <p className="text-sm sm:text-base">{documento.remitente_nombre || '-'}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Unidad de Registro</p>
                <Chip size="sm" variant="flat">{documento.cat_unidad_administrativa?.codigo_ua}</Chip>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Formulario de turnado */}
      <Card className="shadow-sm">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--theme-primary-700)' }}>
            Datos del Turnado
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4 p-4 sm:p-6">
          <Select
            label="Unidad Destino"
            placeholder="Selecciona la unidad a turnar"
            selectedKeys={formData.id_ua_destino ? [formData.id_ua_destino] : []}
            onSelectionChange={(keys) =>
              setFormData({ ...formData, id_ua_destino: Array.from(keys)[0] as string })
            }
            isRequired
            size="sm"
          >
            {unidades.map((ua) => (
              <SelectItem key={ua.id_ua} textValue={ua.nombre_ua}>
                <div>
                  <p className="font-medium text-sm">{ua.nombre_ua}</p>
                  <p className="text-xs text-gray-500">{ua.codigo_ua}</p>
                </div>
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Instruccion"
            placeholder="Ej: Para su conocimiento y atencion"
            value={formData.instruccion}
            onValueChange={(v) => setFormData({ ...formData, instruccion: v })}
            size="sm"
          />

          <Textarea
            label="Observaciones"
            placeholder="Observaciones adicionales..."
            value={formData.observaciones}
            onValueChange={(v) => setFormData({ ...formData, observaciones: v })}
            minRows={3}
            size="sm"
          />

          <Input
            type="number"
            label="Dias para Atencion"
            placeholder="5"
            value={formData.dias_para_atencion}
            onValueChange={(v) => setFormData({ ...formData, dias_para_atencion: v })}
            min={1}
            max={90}
            startContent={<Calendar size={18} className="text-gray-400" />}
            description="Numero de dias habiles para dar atencion"
            size="sm"
          />
        </CardBody>
      </Card>

      {/* Botones */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <Button
          variant="light"
          onPress={() => navigate(-1)}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          color="primary"
          startContent={<Send size={18} />}
          onPress={handleSubmit}
          isLoading={loading}
          style={{ backgroundColor: 'var(--theme-primary-700)' }}
          className="w-full sm:w-auto"
        >
          Turnar Documento
        </Button>
      </div>

      {/* Info de modo desarrollo */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Los datos se guardan en localStorage
        </p>
      )}
    </div>
  );
}
