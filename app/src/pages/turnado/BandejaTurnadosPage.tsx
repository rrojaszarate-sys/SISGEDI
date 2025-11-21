import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Progress,
  Tooltip,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Slider,
} from '@nextui-org/react';
import { Send, Eye, CheckCircle, XCircle, TrendingUp, Inbox, SendHorizonal } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function BandejaTurnadosPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [turnados, setTurnados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('recibidos');
  const [selectedTurnado, setSelectedTurnado] = useState<any>(null);

  const { isOpen: isAvanceOpen, onOpen: onAvanceOpen, onClose: onAvanceClose } = useDisclosure();
  const { isOpen: isRechazoOpen, onOpen: onRechazoOpen, onClose: onRechazoClose } = useDisclosure();

  const [nuevoAvance, setNuevoAvance] = useState(0);
  const [comentarioAvance, setComentarioAvance] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  useEffect(() => {
    fetchTurnados();
  }, [vista]);

  const fetchTurnados = async () => {
    setLoading(true);

    let query = supabase
      .from('tbl_turnado')
      .select(`
        *,
        tbl_documento_entrante(folio_interno, asunto),
        ua_origen:id_ua_origen(nombre_ua, codigo_ua),
        ua_destino:id_ua_destino(nombre_ua, codigo_ua)
      `)
      .order('fecha_turnado', { ascending: false });

    if (vista === 'recibidos') {
      query = query.eq('id_ua_destino', usuario?.id_ua);
    } else {
      query = query.eq('id_ua_origen', usuario?.id_ua);
    }

    const { data } = await query;
    setTurnados(data || []);
    setLoading(false);
  };

  const handleRecibir = async (turnado: any) => {
    const { error } = await supabase
      .from('tbl_turnado')
      .update({ estatus_turnado: 'Recibido' })
      .eq('id_turnado', turnado.id_turnado);

    if (error) {
      toast.error('Error al recibir documento');
    } else {
      toast.success('Documento recibido');
      fetchTurnados();
    }
  };

  const openAvanceModal = (turnado: any) => {
    setSelectedTurnado(turnado);
    setNuevoAvance(turnado.porcentaje_avance);
    setComentarioAvance('');
    onAvanceOpen();
  };

  const handleAvance = async () => {
    if (!selectedTurnado) return;

    const { error } = await supabase
      .from('tbl_turnado')
      .update({
        porcentaje_avance: nuevoAvance,
        estatus_turnado: nuevoAvance === 100 ? 'Concluido' : 'En_Proceso',
        fecha_ultimo_avance: new Date().toISOString(),
      })
      .eq('id_turnado', selectedTurnado.id_turnado);

    if (error) {
      toast.error('Error al registrar avance');
    } else {
      // Registrar en historial
      await supabase.from('tbl_avance').insert({
        id_turnado: selectedTurnado.id_turnado,
        porcentaje_anterior: selectedTurnado.porcentaje_avance,
        porcentaje_nuevo: nuevoAvance,
        comentario: comentarioAvance,
        registrado_por: usuario?.id_usuario,
      });

      toast.success('Avance registrado');
      onAvanceClose();
      fetchTurnados();
    }
  };

  const openRechazoModal = (turnado: any) => {
    setSelectedTurnado(turnado);
    setMotivoRechazo('');
    onRechazoOpen();
  };

  const handleRechazo = async () => {
    if (!selectedTurnado || !motivoRechazo) {
      toast.error('Ingresa el motivo del rechazo');
      return;
    }

    const { error } = await supabase
      .from('tbl_turnado')
      .update({
        estatus_turnado: 'Rechazado',
        motivo_rechazo: motivoRechazo,
        fecha_rechazo: new Date().toISOString(),
        rechazado_por: usuario?.id_usuario,
      })
      .eq('id_turnado', selectedTurnado.id_turnado);

    if (error) {
      toast.error('Error al rechazar');
    } else {
      toast.success('Documento rechazado');
      onRechazoClose();
      fetchTurnados();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getSemaforoColor = (fechaVencimiento: string, porcentaje: number) => {
    if (porcentaje === 100) return 'success';
    const now = new Date();
    const venc = new Date(fechaVencimiento);
    const diff = (venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (diff < 0) return 'danger';
    if (diff <= 3) return 'warning';
    return 'success';
  };

  const getEstatusColor = (estatus: string) => {
    const colors: Record<string, 'warning' | 'primary' | 'success' | 'danger' | 'default'> = {
      Turnado: 'warning',
      Recibido: 'primary',
      En_Proceso: 'primary',
      Concluido: 'success',
      Rechazado: 'danger',
    };
    return colors[estatus] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Send className="text-primary" />
          Bandeja de Turnados
        </h1>
        <p className="text-gray-500">Gestión de documentos turnados</p>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={vista} onSelectionChange={(k) => setVista(k as string)}>
        <Tab
          key="recibidos"
          title={
            <div className="flex items-center gap-2">
              <Inbox size={18} />
              Recibidos
            </div>
          }
        />
        <Tab
          key="enviados"
          title={
            <div className="flex items-center gap-2">
              <SendHorizonal size={18} />
              Enviados
            </div>
          }
        />
      </Tabs>

      {/* Tabla */}
      <Table aria-label="Turnados">
        <TableHeader>
          <TableColumn>FOLIO</TableColumn>
          <TableColumn>ASUNTO</TableColumn>
          <TableColumn>{vista === 'recibidos' ? 'DE' : 'PARA'}</TableColumn>
          <TableColumn>VENCIMIENTO</TableColumn>
          <TableColumn>AVANCE</TableColumn>
          <TableColumn>ESTATUS</TableColumn>
          <TableColumn>ACCIONES</TableColumn>
        </TableHeader>
        <TableBody items={turnados} isLoading={loading} emptyContent="Sin turnados">
          {(t) => (
            <TableRow key={t.id_turnado}>
              <TableCell className="font-mono text-sm">
                {t.tbl_documento_entrante?.folio_interno}
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate">{t.tbl_documento_entrante?.asunto}</p>
              </TableCell>
              <TableCell>
                {vista === 'recibidos'
                  ? t.ua_origen?.codigo_ua
                  : t.ua_destino?.codigo_ua}
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={getSemaforoColor(t.fecha_vencimiento, t.porcentaje_avance)}
                >
                  {formatDate(t.fecha_vencimiento)}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="w-24">
                  <Progress
                    value={t.porcentaje_avance}
                    size="sm"
                    color={t.porcentaje_avance === 100 ? 'success' : 'primary'}
                  />
                  <span className="text-xs text-gray-500">{t.porcentaje_avance}%</span>
                </div>
              </TableCell>
              <TableCell>
                <Chip size="sm" color={getEstatusColor(t.estatus_turnado)}>
                  {t.estatus_turnado}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Tooltip content="Ver documento">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() =>
                        navigate(`/documentos/${t.tbl_documento_entrante?.id_doc_entrante || t.id_doc_entrante}`)
                      }
                    >
                      <Eye size={16} />
                    </Button>
                  </Tooltip>

                  {vista === 'recibidos' && t.estatus_turnado === 'Turnado' && (
                    <>
                      <Tooltip content="Recibir">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="success"
                          onPress={() => handleRecibir(t)}
                        >
                          <CheckCircle size={16} />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Rechazar">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => openRechazoModal(t)}
                        >
                          <XCircle size={16} />
                        </Button>
                      </Tooltip>
                    </>
                  )}

                  {vista === 'recibidos' &&
                    ['Recibido', 'En_Proceso'].includes(t.estatus_turnado) &&
                    t.porcentaje_avance < 100 && (
                      <Tooltip content="Registrar avance">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          onPress={() => openAvanceModal(t)}
                        >
                          <TrendingUp size={16} />
                        </Button>
                      </Tooltip>
                    )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal Avance */}
      <Modal isOpen={isAvanceOpen} onClose={onAvanceClose}>
        <ModalContent>
          <ModalHeader>Registrar Avance</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Porcentaje de avance</p>
                <Slider
                  step={10}
                  minValue={selectedTurnado?.porcentaje_avance || 0}
                  maxValue={100}
                  value={nuevoAvance}
                  onChange={(v) => setNuevoAvance(v as number)}
                  showSteps
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' },
                  ]}
                />
                <p className="text-center text-2xl font-bold mt-2">{nuevoAvance}%</p>
              </div>
              <Textarea
                label="Comentario"
                placeholder="Describe el avance realizado..."
                value={comentarioAvance}
                onValueChange={setComentarioAvance}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAvanceClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleAvance}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Rechazo */}
      <Modal isOpen={isRechazoOpen} onClose={onRechazoClose}>
        <ModalContent>
          <ModalHeader>Rechazar Turnado</ModalHeader>
          <ModalBody>
            <Textarea
              label="Motivo del Rechazo"
              placeholder="Explica por qué rechazas este documento..."
              value={motivoRechazo}
              onValueChange={setMotivoRechazo}
              isRequired
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onRechazoClose}>
              Cancelar
            </Button>
            <Button color="danger" onPress={handleRechazo}>
              Rechazar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
