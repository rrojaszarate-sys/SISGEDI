'use client'

/**
 * Módulo de Turnados
 * Gestión de turnado de documentos entre unidades administrativas
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import Modal from '@/components/ui/Modal'
import Alert from '@/components/ui/Alert'
import {
  Send,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  FileText,
  Calendar,
  User
} from 'lucide-react'
import type { Database } from '@/types/database'

type Turnado = Database['public']['Tables']['tbl_turnado']['Row'] & {
  tbl_documento_entrante?: {
    folio_interno: string
    asunto: string
    cat_valores_catalogo_prioridad?: { valor: string }
  }
  cat_unidad_administrativa_origen?: { nombre_ua: string }
  cat_unidad_administrativa_destino?: { nombre_ua: string }
  tbl_usuarios_turna?: { nombre_completo: string }
  tbl_usuarios_recibe?: { nombre_completo: string | null }
  cat_valores_catalogo_estatus?: { valor: string }
}

type FormData = Omit<Database['public']['Tables']['tbl_turnado']['Insert'], 'id_turnado' | 'fecha_turnado' | 'id_usuario_turna'>

export default function TurnadosPage() {
  const [turnados, setTurnados] = useState<Turnado[]>([])
  const [filteredTurnados, setFilteredTurnados] = useState<Turnado[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedTurnado, setSelectedTurnado] = useState<Turnado | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstatus, setFilterEstatus] = useState<string>('')
  const [filterTipo, setFilterTipo] = useState<'enviados' | 'recibidos' | 'todos'>('todos')

  // Catálogos
  const [documentos, setDocumentos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [estatus, setEstatus] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Form data
  const [formData, setFormData] = useState<FormData>({
    id_documento: 0,
    id_ua_origen: 0,
    id_ua_destino: 0,
    id_usuario_destino: null,
    instrucciones: null,
    plazo_atencion: null,
    estatus_turnado: 0,
    fecha_recepcion: null,
    fecha_atencion: null,
    respuesta: null,
    observaciones: null
  })

  useEffect(() => {
    loadData()
    loadCatalogos()
    loadCurrentUser()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterEstatus, filterTipo, turnados])

  async function loadCurrentUser() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('tbl_usuarios')
        .select('*, cat_unidad_administrativa(id_ua, nombre_ua)')
        .eq('id_usuario', user.id)
        .single()

      setCurrentUser(userData)
    } catch (err) {
      console.error('Error loading user:', err)
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('tbl_turnado')
        .select(`
          *,
          tbl_documento_entrante!tbl_turnado_id_documento_fkey(
            folio_interno,
            asunto,
            cat_valores_catalogo_prioridad:cat_valores_catalogo!tbl_documento_entrante_id_prioridad_fkey(valor)
          ),
          cat_unidad_administrativa_origen:cat_unidad_administrativa!tbl_turnado_id_ua_origen_fkey(nombre_ua),
          cat_unidad_administrativa_destino:cat_unidad_administrativa!tbl_turnado_id_ua_destino_fkey(nombre_ua),
          tbl_usuarios_turna:tbl_usuarios!tbl_turnado_id_usuario_turna_fkey(nombre_completo),
          tbl_usuarios_recibe:tbl_usuarios!tbl_turnado_id_usuario_destino_fkey(nombre_completo),
          cat_valores_catalogo_estatus:cat_valores_catalogo!tbl_turnado_estatus_turnado_fkey(valor)
        `)
        .order('fecha_turnado', { ascending: false })

      if (fetchError) throw fetchError

      setTurnados(data || [])
      setFilteredTurnados(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalogos() {
    try {
      const supabase = createClient()

      // Cargar documentos disponibles para turnar
      const { data: docsData } = await supabase
        .from('tbl_documento_entrante')
        .select('id_documento, folio_interno, asunto, id_ua_destinataria')
        .in('estatus_documento', [
          // Solo documentos que pueden turnarse
          (await supabase.from('cat_valores_catalogo').select('id_valor_catalogo').eq('valor', 'Recibido').single()).data?.id_valor_catalogo,
          (await supabase.from('cat_valores_catalogo').select('id_valor_catalogo').eq('valor', 'En Proceso').single()).data?.id_valor_catalogo
        ].filter(Boolean))
        .order('fecha_registro', { ascending: false })

      setDocumentos(docsData || [])

      // Cargar unidades administrativas
      const { data: uaData } = await supabase
        .from('cat_unidad_administrativa')
        .select('*')
        .eq('activa', true)
        .order('nombre_ua', { ascending: true })

      setUnidades(uaData || [])

      // Cargar usuarios
      const { data: usersData } = await supabase
        .from('tbl_usuarios')
        .select('id_usuario, nombre_completo, id_ua')
        .eq('estatus', 'Activo')
        .order('nombre_completo', { ascending: true })

      setUsuarios(usersData || [])

      // Cargar estatus de turnado
      const { data: estatusData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Estatus Turnado')
        .eq('activo', true)
        .order('valor', { ascending: true })

      setEstatus(estatusData || [])

    } catch (err: any) {
      console.error('Error loading catalogs:', err)
    }
  }

  function applyFilters() {
    let filtered = [...turnados]

    // Filtro por tipo (enviados/recibidos)
    if (filterTipo !== 'todos' && currentUser) {
      if (filterTipo === 'enviados') {
        filtered = filtered.filter(t => t.id_ua_origen === currentUser.id_ua)
      } else if (filterTipo === 'recibidos') {
        filtered = filtered.filter(t => t.id_ua_destino === currentUser.id_ua)
      }
    }

    // Búsqueda por texto
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(t =>
        t.tbl_documento_entrante?.folio_interno.toLowerCase().includes(search) ||
        t.tbl_documento_entrante?.asunto.toLowerCase().includes(search) ||
        t.instrucciones?.toLowerCase().includes(search)
      )
    }

    // Filtro por estatus
    if (filterEstatus) {
      filtered = filtered.filter(t => t.estatus_turnado === parseInt(filterEstatus))
    }

    setFilteredTurnados(filtered)
  }

  function getEstatusBadge(estatus: string) {
    const styles: Record<string, string> = {
      'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'En Proceso': 'bg-blue-100 text-blue-800 border-blue-300',
      'Atendido': 'bg-green-100 text-green-800 border-green-300',
      'Rechazado': 'bg-red-100 text-red-800 border-red-300',
      'Vencido': 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return styles[estatus] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  function getEstatusIcon(estatus: string) {
    switch (estatus) {
      case 'Pendiente':
        return <Clock className="w-4 h-4" />
      case 'En Proceso':
        return <AlertCircle className="w-4 h-4" />
      case 'Atendido':
        return <CheckCircle className="w-4 h-4" />
      case 'Rechazado':
      case 'Vencido':
        return <XCircle className="w-4 h-4" />
      default:
        return <Send className="w-4 h-4" />
    }
  }

  function getPrioridadBadge(prioridad: string) {
    const styles: Record<string, string> = {
      'Urgente': 'bg-red-100 text-red-800 border-red-300',
      'Alta': 'bg-orange-100 text-orange-800 border-orange-300',
      'Media': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Baja': 'bg-green-100 text-green-800 border-green-300'
    }
    return styles[prioridad] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  function handleNew() {
    setSelectedTurnado(null)
    setFormData({
      id_documento: 0,
      id_ua_origen: currentUser?.id_ua || 0,
      id_ua_destino: 0,
      id_usuario_destino: null,
      instrucciones: null,
      plazo_atencion: null,
      estatus_turnado: estatus.find(e => e.valor === 'Pendiente')?.id_valor_catalogo || 0,
      fecha_recepcion: null,
      fecha_atencion: null,
      respuesta: null,
      observaciones: null
    })
    setShowModal(true)
  }

  function handleView(turnado: Turnado) {
    setSelectedTurnado(turnado)
    setFormData({
      id_documento: turnado.id_documento,
      id_ua_origen: turnado.id_ua_origen,
      id_ua_destino: turnado.id_ua_destino,
      id_usuario_destino: turnado.id_usuario_destino,
      instrucciones: turnado.instrucciones,
      plazo_atencion: turnado.plazo_atencion,
      estatus_turnado: turnado.estatus_turnado,
      fecha_recepcion: turnado.fecha_recepcion,
      fecha_atencion: turnado.fecha_atencion,
      respuesta: turnado.respuesta,
      observaciones: turnado.observaciones
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      if (selectedTurnado) {
        // Actualizar turnado existente (solo si es destinatario)
        const { error: updateError } = await supabase
          .from('tbl_turnado')
          .update({
            estatus_turnado: formData.estatus_turnado,
            fecha_recepcion: formData.fecha_recepcion,
            fecha_atencion: formData.fecha_atencion,
            respuesta: formData.respuesta,
            observaciones: formData.observaciones
          })
          .eq('id_turnado', selectedTurnado.id_turnado)

        if (updateError) throw updateError
        setSuccess('Turnado actualizado exitosamente')
      } else {
        // Crear nuevo turnado
        const turnadoData = {
          ...formData,
          id_usuario_turna: user.id
        }

        const { error: insertError } = await supabase
          .from('tbl_turnado')
          .insert([turnadoData])

        if (insertError) throw insertError
        setSuccess('Documento turnado exitosamente')
      }

      setShowModal(false)
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const columns = [
    {
      key: 'folio',
      label: 'Folio',
      render: (t: Turnado) => (
        <div>
          <div className="font-medium text-blue-600">
            {t.tbl_documento_entrante?.folio_interno}
          </div>
          {t.tbl_documento_entrante?.cat_valores_catalogo_prioridad && (
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getPrioridadBadge(t.tbl_documento_entrante.cat_valores_catalogo_prioridad.valor)}`}>
              {t.tbl_documento_entrante.cat_valores_catalogo_prioridad.valor}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'asunto',
      label: 'Asunto',
      render: (t: Turnado) => (
        <div className="max-w-xs truncate" title={t.tbl_documento_entrante?.asunto}>
          {t.tbl_documento_entrante?.asunto}
        </div>
      )
    },
    {
      key: 'origen_destino',
      label: 'Origen → Destino',
      render: (t: Turnado) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">{t.cat_unidad_administrativa_origen?.nombre_ua}</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">{t.cat_unidad_administrativa_destino?.nombre_ua}</span>
        </div>
      )
    },
    {
      key: 'fecha_turnado',
      label: 'Fecha Turnado',
      render: (t: Turnado) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {new Date(t.fecha_turnado).toLocaleDateString('es-MX')}
        </div>
      )
    },
    {
      key: 'plazo',
      label: 'Plazo',
      render: (t: Turnado) => {
        if (!t.plazo_atencion) return <span className="text-gray-400">Sin plazo</span>

        const plazo = new Date(t.plazo_atencion)
        const hoy = new Date()
        const vencido = plazo < hoy && t.cat_valores_catalogo_estatus?.valor !== 'Atendido'

        return (
          <div className={`text-sm ${vencido ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            {plazo.toLocaleDateString('es-MX')}
            {vencido && <div className="text-xs">⚠️ Vencido</div>}
          </div>
        )
      }
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (t: Turnado) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getEstatusBadge(t.cat_valores_catalogo_estatus?.valor || '')}`}>
          {getEstatusIcon(t.cat_valores_catalogo_estatus?.valor || '')}
          {t.cat_valores_catalogo_estatus?.valor}
        </span>
      )
    }
  ]

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="w-4 h-4" />,
      onClick: handleView,
      variant: 'ghost' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-8 h-8 text-blue-600" />
            Turnados
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de documentos turnados
          </p>
        </div>
        <Button onClick={handleNew} icon={<Plus />}>
          Turnar Documento
        </Button>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          Filtros y Búsqueda
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <Input
              placeholder="Buscar por folio, asunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Tipo */}
          <div>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="enviados">Enviados por mí</option>
              <option value="recibidos">Recibidos por mí</option>
            </select>
          </div>

          {/* Estatus */}
          <div>
            <select
              value={filterEstatus}
              onChange={(e) => setFilterEstatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estatus</option>
              {estatus.map(e => (
                <option key={e.id_valor_catalogo} value={e.id_valor_catalogo}>
                  {e.valor}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {turnados.filter(t => t.cat_valores_catalogo_estatus?.valor === 'Pendiente').length}
            </div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {turnados.filter(t => t.cat_valores_catalogo_estatus?.valor === 'En Proceso').length}
            </div>
            <div className="text-sm text-gray-600">En Proceso</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {turnados.filter(t => t.cat_valores_catalogo_estatus?.valor === 'Atendido').length}
            </div>
            <div className="text-sm text-gray-600">Atendidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {turnados.filter(t => {
                if (!t.plazo_atencion || t.cat_valores_catalogo_estatus?.valor === 'Atendido') return false
                return new Date(t.plazo_atencion) < new Date()
              }).length}
            </div>
            <div className="text-sm text-gray-600">Vencidos</div>
          </div>
        </div>

        {/* Resultados count */}
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{filteredTurnados.length}</span> de{' '}
          <span className="font-medium">{turnados.length}</span> turnados
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={filteredTurnados}
          columns={columns}
          actions={actions}
          loading={loading}
        />
      </div>

      {/* Modal Formulario */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedTurnado ? 'Detalle de Turnado' : 'Turnar Documento'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {!selectedTurnado && (
                <>
                  {/* Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Documento <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.id_documento}
                      onChange={(e) => setFormData({ ...formData, id_documento: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar documento...</option>
                      {documentos.map(doc => (
                        <option key={doc.id_documento} value={doc.id_documento}>
                          {doc.folio_interno} - {doc.asunto.substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* UA Destino */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad Administrativa Destino <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.id_ua_destino}
                      onChange={(e) => {
                        const uaId = parseInt(e.target.value)
                        setFormData({ ...formData, id_ua_destino: uaId, id_usuario_destino: null })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar UA...</option>
                      {unidades.filter(ua => ua.id_ua !== currentUser?.id_ua).map(ua => (
                        <option key={ua.id_ua} value={ua.id_ua}>
                          {ua.nombre_ua}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Usuario Destino (opcional) */}
                  {formData.id_ua_destino > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuario Específico (Opcional)
                      </label>
                      <select
                        value={formData.id_usuario_destino || ''}
                        onChange={(e) => setFormData({ ...formData, id_usuario_destino: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Cualquier usuario de la UA</option>
                        {usuarios.filter(u => u.id_ua === formData.id_ua_destino).map(u => (
                          <option key={u.id_usuario} value={u.id_usuario}>
                            {u.nombre_completo}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Instrucciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instrucciones <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.instrucciones || ''}
                      onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                      placeholder="Instrucciones para la atención del documento"
                    />
                  </div>

                  {/* Plazo de Atención */}
                  <div>
                    <Input
                      type="date"
                      label="Plazo de Atención"
                      value={formData.plazo_atencion || ''}
                      onChange={(e) => setFormData({ ...formData, plazo_atencion: e.target.value || null })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </>
              )}

              {selectedTurnado && (
                <>
                  {/* Vista de detalle */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Documento</label>
                      <p className="text-gray-900">{selectedTurnado.tbl_documento_entrante?.folio_interno}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">De</label>
                      <p className="text-gray-900">{selectedTurnado.cat_unidad_administrativa_origen?.nombre_ua}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Para</label>
                      <p className="text-gray-900">{selectedTurnado.cat_unidad_administrativa_destino?.nombre_ua}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Instrucciones</label>
                      <p className="text-gray-900">{selectedTurnado.instrucciones}</p>
                    </div>
                    {selectedTurnado.plazo_atencion && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Plazo</label>
                        <p className="text-gray-900">
                          {new Date(selectedTurnado.plazo_atencion).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Estatus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estatus <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.estatus_turnado}
                      onChange={(e) => setFormData({ ...formData, estatus_turnado: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {estatus.map(e => (
                        <option key={e.id_valor_catalogo} value={e.id_valor_catalogo}>
                          {e.valor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha Recepción */}
                  <div>
                    <Input
                      type="datetime-local"
                      label="Fecha de Recepción"
                      value={formData.fecha_recepcion || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_recepcion: e.target.value || null })}
                    />
                  </div>

                  {/* Fecha Atención */}
                  <div>
                    <Input
                      type="datetime-local"
                      label="Fecha de Atención"
                      value={formData.fecha_atencion || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_atencion: e.target.value || null })}
                    />
                  </div>

                  {/* Respuesta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Respuesta
                    </label>
                    <textarea
                      value={formData.respuesta || ''}
                      onChange={(e) => setFormData({ ...formData, respuesta: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Respuesta o resultado de la atención"
                    />
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observaciones || ''}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Observaciones adicionales"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {selectedTurnado ? 'Actualizar' : 'Turnar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
