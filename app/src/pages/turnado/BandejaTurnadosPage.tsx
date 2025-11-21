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
  Card,
} from '@nextui-org/react';
import { Send, Eye, CheckCircle, XCircle, TrendingUp, Inbox, SendHorizonal, RefreshCw } from 'lucide-react';
import { supabase, DEV_MODE } from '../../lib/supabase';
import { devTurnados, devDocumentosEntrantes, devUnidades } from '../../lib/devStorage';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function BandejaTurnadosPage() {
  const navigate = useNavigate();
  const { usuario, isDevMode } = useAuth();
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

    // En modo desarrollo, usar devStorage
    if (isDevMode || DEV_MODE) {
      const idUaUsuario = usuario?.unidad_administrativa?.id_ua || 'ua-001';
      const unidades = devUnidades.getAll();
      const documentos = devDocumentosEntrantes.getAll();

      let turnadosData: any[] = [];

      if (vista === 'recibidos') {
        turnadosData = devTurnados.getRecibidos(idUaUsuario);
      } else {
        turnadosData = devTurnados.getEnviados(idUaUsuario);
      }

      // Enriquecer turnados con datos de documentos y unidades
      const turnadosEnriquecidos = turnadosData.map(t => {
        const doc = documentos.find(d => d.id_doc_entrante === t.id_doc_entrante);
        const uaOrigen = unidades.find(u => u.id_ua === t.id_ua_origen);
        const uaDestino = unidades.find(u => u.id_ua === t.id_ua_destino);

        return {
          ...t,
          tbl_documento_entrante: doc ? {
            folio_interno: doc.folio_interno,
            asunto: doc.asunto,
          } : null,
          ua_origen: uaOrigen ? {
            nombre_ua: uaOrigen.nombre_ua,
            codigo_ua: uaOrigen.codigo_ua,
          } : null,
          ua_destino: uaDestino ? {
            nombre_ua: uaDestino.nombre_ua,
            codigo_ua: uaDestino.codigo_ua,
          } : null,
        };
      });

      setTurnados(turnadosEnriquecidos);
      setLoading(false);
      return;
    }

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
      query = query.eq('id_ua_destino', usuario?.unidad_administrativa?.id_ua);
    } else {
      query = query.eq('id_ua_origen', usuario?.unidad_administrativa?.id_ua);
    }

    const { data } = await query;
    setTurnados(data || []);
    setLoading(false);
  };

  const handleRecibir = async (turnado: any) => {
    if (isDevMode || DEV_MODE) {
      const resultado = devTurnados.recibir(turnado.id_turnado);
      if (resultado) {
        toast.success('Documento recibido correctamente');
        fetchTurnados();
      } else {
        toast.error('Error al recibir documento');
      }
      return;
    }

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

    if (isDevMode || DEV_MODE) {
      const resultado = devTurnados.actualizarAvance(
        selectedTurnado.id_turnado,
        nuevoAvance,
        comentarioAvance || undefined
      );

      if (resultado) {
        toast.success(`Avance registrado: ${nuevoAvance}%`);
        onAvanceClose();
        fetchTurnados();
      } else {
        toast.error('Error al registrar avance');
      }
      return;
    }

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

    if (isDevMode || DEV_MODE) {
      const resultado = devTurnados.rechazar(selectedTurnado.id_turnado, motivoRechazo);

      if (resultado) {
        toast.success('Documento rechazado correctamente');
        onRechazoClose();
        fetchTurnados();
      } else {
        toast.error('Error al rechazar documento');
      }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--theme-primary-800)' }}
          >
            <Send style={{ color: 'var(--theme-primary-600)' }} />
            Bandeja de Turnados
          </h1>
          <p className="text-sm text-gray-500">Gestion de documentos turnados</p>
        </div>
        <Button
          isIconOnly
          variant="flat"
          onPress={fetchTurnados}
          isLoading={loading}
        >
          <RefreshCw size={18} />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        selectedKey={vista}
        onSelectionChange={(k) => setVista(k as string)}
        color="primary"
        variant="bordered"
        classNames={{
          tabList: "gap-2",
          cursor: "bg-[var(--theme-primary-700)]",
        }}
      >
        <Tab
          key="recibidos"
          title={
            <div className="flex items-center gap-2">
              <Inbox size={16} />
              <span className="hidden sm:inline">Recibidos</span>
            </div>
          }
        />
        <Tab
          key="enviados"
          title={
            <div className="flex items-center gap-2">
              <SendHorizonal size={16} />
              <span className="hidden sm:inline">Enviados</span>
            </div>
          }
        />
      </Tabs>

      {/* Tabla */}
      <Card className="shadow-sm overflow-hidden">
        <Table aria-label="Turnados" removeWrapper>
          <TableHeader>
            <TableColumn className="text-xs">FOLIO</TableColumn>
            <TableColumn className="text-xs hidden md:table-cell">ASUNTO</TableColumn>
            <TableColumn className="text-xs">{vista === 'recibidos' ? 'DE' : 'PARA'}</TableColumn>
            <TableColumn className="text-xs hidden sm:table-cell">VENCE</TableColumn>
            <TableColumn className="text-xs">AVANCE</TableColumn>
            <TableColumn className="text-xs">ESTATUS</TableColumn>
            <TableColumn className="text-xs">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody items={turnados} isLoading={loading} emptyContent="Sin turnados">
            {(t) => (
              <TableRow key={t.id_turnado} className="hover:bg-gray-50">
                <TableCell>
                  <span
                    className="font-mono text-xs sm:text-sm font-medium"
                    style={{ color: 'var(--theme-primary-700)' }}
                  >
                    {t.tbl_documento_entrante?.folio_interno}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <p className="text-xs truncate max-w-[200px]">{t.tbl_documento_entrante?.asunto}</p>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-600">
                    {vista === 'recibidos' ? t.ua_origen?.codigo_ua : t.ua_destino?.codigo_ua}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Chip
                    size="sm"
                    color={getSemaforoColor(t.fecha_vencimiento, t.porcentaje_avance)}
                    variant="flat"
                  >
                    <span className="text-[10px]">{formatDate(t.fecha_vencimiento)}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="w-16 sm:w-24">
                    <Progress
                      value={t.porcentaje_avance}
                      size="sm"
                      color={t.porcentaje_avance === 100 ? 'success' : 'primary'}
                    />
                    <span className="text-[10px] text-gray-500">{t.porcentaje_avance}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" color={getEstatusColor(t.estatus_turnado)} variant="flat">
                    <span className="text-[10px]">{t.estatus_turnado.replace('_', ' ')}</span>
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip content="Ver">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => navigate(`/documentos/${t.id_doc_entrante}`)}
                      >
                        <Eye size={14} style={{ color: 'var(--theme-primary-600)' }} />
                      </Button>
                    </Tooltip>

                    {vista === 'recibidos' && t.estatus_turnado === 'Turnado' && (
                      <>
                        <Tooltip content="Recibir">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleRecibir(t)}
                          >
                            <CheckCircle size={14} className="text-green-600" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Rechazar">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openRechazoModal(t)}
                          >
                            <XCircle size={14} className="text-red-600" />
                          </Button>
                        </Tooltip>
                      </>
                    )}

                    {vista === 'recibidos' &&
                      ['Recibido', 'En_Proceso'].includes(t.estatus_turnado) &&
                      t.porcentaje_avance < 100 && (
                        <Tooltip content="Avance">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => openAvanceModal(t)}
                          >
                            <TrendingUp size={14} className="text-blue-600" />
                          </Button>
                        </Tooltip>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Info dev */}
      {(isDevMode || DEV_MODE) && (
        <p className="text-xs text-center text-gray-400">
          Modo desarrollo - Mostrando {turnados.length} turnados desde localStorage
        </p>
      )}

      {/* Modal Avance */}
      <Modal isOpen={isAvanceOpen} onClose={onAvanceClose} size="md">
        <ModalContent>
          <ModalHeader style={{ color: 'var(--theme-primary-800)' }}>
            Registrar Avance
          </ModalHeader>
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
                  classNames={{
                    filler: "bg-[var(--theme-primary-600)]",
                    thumb: "bg-[var(--theme-primary-700)]",
                  }}
                />
                <p
                  className="text-center text-2xl font-bold mt-2"
                  style={{ color: 'var(--theme-primary-700)' }}
                >
                  {nuevoAvance}%
                </p>
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
            <Button
              style={{ backgroundColor: 'var(--theme-primary-700)' }}
              className="text-white"
              onPress={handleAvance}
            >
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Rechazo */}
      <Modal isOpen={isRechazoOpen} onClose={onRechazoClose} size="md">
        <ModalContent>
          <ModalHeader className="text-red-700">Rechazar Turnado</ModalHeader>
          <ModalBody>
            <Textarea
              label="Motivo del Rechazo"
              placeholder="Explica por que rechazas este documento..."
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
