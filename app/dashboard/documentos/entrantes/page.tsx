'use client'

/**
 * Módulo de Documentos Entrantes
 * Lista, búsqueda, filtrado y gestión de documentos recibidos
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Send,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import type { Database } from '@/types/database'

type DocumentoEntrante = Database['public']['Tables']['tbl_documento_entrante']['Row'] & {
  cat_unidad_administrativa?: { nombre_ua: string }
  tbl_usuarios_registro?: { nombre_completo: string }
  cat_valores_catalogo_prioridad?: { valor: string }
  cat_valores_catalogo_tipo_doc?: { valor: string }
  cat_valores_catalogo_tipo_atencion?: { valor: string }
  cat_valores_catalogo_estatus?: { valor: string }
}

type FormData = Omit<Database['public']['Tables']['tbl_documento_entrante']['Insert'], 'id_documento' | 'fecha_registro' | 'id_usuario_registro'>

export default function DocumentosEntrantesPage() {
  const [documentos, setDocumentos] = useState<DocumentoEntrante[]>([])
  const [filteredDocumentos, setFilteredDocumentos] = useState<DocumentoEntrante[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<DocumentoEntrante | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPrioridad, setFilterPrioridad] = useState<string>('')
  const [filterEstatus, setFilterEstatus] = useState<string>('')
  const [filterFechaInicio, setFilterFechaInicio] = useState('')
  const [filterFechaFin, setFilterFechaFin] = useState('')

  // Catálogos
  const [prioridades, setPrioridades] = useState<any[]>([])
  const [tiposDoc, setTiposDoc] = useState<any[]>([])
  const [tiposAtencion, setTiposAtencion] = useState<any[]>([])
  const [estatus, setEstatus] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])

  // Form data
  const [formData, setFormData] = useState<FormData>({
    folio_interno: '',
    folio_externo: null,
    fecha_recepcion: new Date().toISOString().split('T')[0],
    fecha_documento: null,
    id_prioridad: 0,
    id_tipo_documento: 0,
    id_tipo_atencion: 0,
    remitente_nombre: '',
    remitente_cargo: null,
    remitente_institucion: null,
    asunto: '',
    observaciones: null,
    id_ua_destinataria: 0,
    numero_anexos: 0,
    estatus_documento: 0,
    archivo_url: null,
    archivo_nombre: null,
    texto_ocr: null,
    hash_archivo: null
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  useEffect(() => {
    loadData()
    loadCatalogos()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterPrioridad, filterEstatus, filterFechaInicio, filterFechaFin, documentos])

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('tbl_documento_entrante')
        .select(`
          *,
          cat_unidad_administrativa!tbl_documento_entrante_id_ua_destinataria_fkey(nombre_ua),
          tbl_usuarios_registro:tbl_usuarios!tbl_documento_entrante_id_usuario_registro_fkey(nombre_completo),
          cat_valores_catalogo_prioridad:cat_valores_catalogo!tbl_documento_entrante_id_prioridad_fkey(valor),
          cat_valores_catalogo_tipo_doc:cat_valores_catalogo!tbl_documento_entrante_id_tipo_documento_fkey(valor),
          cat_valores_catalogo_tipo_atencion:cat_valores_catalogo!tbl_documento_entrante_id_tipo_atencion_fkey(valor),
          cat_valores_catalogo_estatus:cat_valores_catalogo!tbl_documento_entrante_estatus_documento_fkey(valor)
        `)
        .order('fecha_registro', { ascending: false })

      if (fetchError) throw fetchError

      setDocumentos(data || [])
      setFilteredDocumentos(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalogos() {
    try {
      const supabase = createClient()

      // Cargar prioridades
      const { data: priData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Prioridad')
        .eq('activo', true)
        .order('orden', { ascending: true })

      setPrioridades(priData || [])

      // Cargar tipos de documento
      const { data: tipoDocData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Tipo Documento')
        .eq('activo', true)
        .order('valor', { ascending: true })

      setTiposDoc(tipoDocData || [])

      // Cargar tipos de atención
      const { data: tipoAtenData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Tipo Atención')
        .eq('activo', true)
        .order('valor', { ascending: true })

      setTiposAtencion(tipoAtenData || [])

      // Cargar estatus
      const { data: estatusData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Estatus Documento')
        .eq('activo', true)
        .order('valor', { ascending: true })

      setEstatus(estatusData || [])

      // Cargar unidades administrativas
      const { data: uaData } = await supabase
        .from('cat_unidad_administrativa')
        .select('*')
        .eq('activa', true)
        .order('nombre_ua', { ascending: true })

      setUnidades(uaData || [])

    } catch (err: any) {
      console.error('Error loading catalogs:', err)
    }
  }

  function applyFilters() {
    let filtered = [...documentos]

    // Búsqueda por texto
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.folio_interno.toLowerCase().includes(search) ||
        doc.folio_externo?.toLowerCase().includes(search) ||
        doc.asunto.toLowerCase().includes(search) ||
        doc.remitente_nombre.toLowerCase().includes(search)
      )
    }

    // Filtro por prioridad
    if (filterPrioridad) {
      filtered = filtered.filter(doc => doc.id_prioridad === parseInt(filterPrioridad))
    }

    // Filtro por estatus
    if (filterEstatus) {
      filtered = filtered.filter(doc => doc.estatus_documento === parseInt(filterEstatus))
    }

    // Filtro por rango de fechas
    if (filterFechaInicio) {
      filtered = filtered.filter(doc => doc.fecha_recepcion >= filterFechaInicio)
    }

    if (filterFechaFin) {
      filtered = filtered.filter(doc => doc.fecha_recepcion <= filterFechaFin)
    }

    setFilteredDocumentos(filtered)
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

  function getEstatusBadge(estatus: string) {
    const styles: Record<string, string> = {
      'Recibido': 'bg-blue-100 text-blue-800 border-blue-300',
      'En Proceso': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Turnado': 'bg-purple-100 text-purple-800 border-purple-300',
      'Atendido': 'bg-green-100 text-green-800 border-green-300',
      'Archivado': 'bg-gray-100 text-gray-800 border-gray-300',
      'Cancelado': 'bg-red-100 text-red-800 border-red-300'
    }
    return styles[estatus] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  function getEstatusIcon(estatus: string) {
    switch (estatus) {
      case 'Recibido':
        return <Clock className="w-4 h-4" />
      case 'En Proceso':
        return <AlertCircle className="w-4 h-4" />
      case 'Atendido':
        return <CheckCircle className="w-4 h-4" />
      case 'Cancelado':
        return <XCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  function handleNew() {
    setSelectedDoc(null)
    setFormData({
      folio_interno: '',
      folio_externo: null,
      fecha_recepcion: new Date().toISOString().split('T')[0],
      fecha_documento: null,
      id_prioridad: prioridades.find(p => p.valor === 'Media')?.id_valor_catalogo || 0,
      id_tipo_documento: tiposDoc[0]?.id_valor_catalogo || 0,
      id_tipo_atencion: tiposAtencion[0]?.id_valor_catalogo || 0,
      remitente_nombre: '',
      remitente_cargo: null,
      remitente_institucion: null,
      asunto: '',
      observaciones: null,
      id_ua_destinataria: 0,
      numero_anexos: 0,
      estatus_documento: estatus.find(e => e.valor === 'Recibido')?.id_valor_catalogo || 0,
      archivo_url: null,
      archivo_nombre: null,
      texto_ocr: null,
      hash_archivo: null
    })
    setUploadedFile(null)
    setShowModal(true)
  }

  function handleEdit(doc: DocumentoEntrante) {
    setSelectedDoc(doc)
    setFormData({
      folio_interno: doc.folio_interno,
      folio_externo: doc.folio_externo,
      fecha_recepcion: doc.fecha_recepcion,
      fecha_documento: doc.fecha_documento,
      id_prioridad: doc.id_prioridad,
      id_tipo_documento: doc.id_tipo_documento,
      id_tipo_atencion: doc.id_tipo_atencion,
      remitente_nombre: doc.remitente_nombre,
      remitente_cargo: doc.remitente_cargo,
      remitente_institucion: doc.remitente_institucion,
      asunto: doc.asunto,
      observaciones: doc.observaciones,
      id_ua_destinataria: doc.id_ua_destinataria,
      numero_anexos: doc.numero_anexos,
      estatus_documento: doc.estatus_documento,
      archivo_url: doc.archivo_url,
      archivo_nombre: doc.archivo_nombre,
      texto_ocr: doc.texto_ocr,
      hash_archivo: doc.hash_archivo
    })
    setUploadedFile(null)
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

      let fileUrl = formData.archivo_url
      let fileName = formData.archivo_nombre
      let fileHash = formData.hash_archivo
      let ocrText = formData.texto_ocr

      // Si hay archivo nuevo, subirlo
      if (uploadedFile) {
        const uploadResult = await uploadFile(uploadedFile)
        fileUrl = uploadResult.url
        fileName = uploadedFile.name
        fileHash = uploadResult.hash
        ocrText = uploadResult.ocrText
      }

      const documentData = {
        ...formData,
        archivo_url: fileUrl,
        archivo_nombre: fileName,
        hash_archivo: fileHash,
        texto_ocr: ocrText,
        id_usuario_registro: user.id
      }

      if (selectedDoc) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('tbl_documento_entrante')
          .update(documentData)
          .eq('id_documento', selectedDoc.id_documento)

        if (updateError) throw updateError
        setSuccess('Documento actualizado exitosamente')
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from('tbl_documento_entrante')
          .insert([documentData])

        if (insertError) throw insertError
        setSuccess('Documento registrado exitosamente')
      }

      setShowModal(false)
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function uploadFile(file: File): Promise<{ url: string; hash: string; ocrText: string | null }> {
    const supabase = createClient()

    // Generar nombre único
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName)

    // Calcular hash del archivo (simplificado)
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // OCR si es PDF o imagen
    let ocrText: string | null = null
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      try {
        ocrText = await performOCR(file)
      } catch (err) {
        console.error('Error en OCR:', err)
        // No fallar si OCR falla
      }
    }

    return {
      url: urlData.publicUrl,
      hash,
      ocrText
    }
  }

  async function performOCR(file: File): Promise<string | null> {
    try {
      // Preparar archivo para enviar a API
      const formData = new FormData()
      formData.append('file', file)

      // Llamar a API route de OCR
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error en OCR')
      }

      const data = await response.json()
      return data.text || null
    } catch (err) {
      console.error('OCR error:', err)
      return null
    }
  }

  const columns = [
    {
      key: 'folio_interno',
      label: 'Folio Interno',
      render: (doc: DocumentoEntrante) => (
        <div className="font-medium text-blue-600">{doc.folio_interno}</div>
      )
    },
    {
      key: 'fecha_recepcion',
      label: 'Fecha Recepción',
      render: (doc: DocumentoEntrante) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {new Date(doc.fecha_recepcion).toLocaleDateString('es-MX')}
        </div>
      )
    },
    {
      key: 'prioridad',
      label: 'Prioridad',
      render: (doc: DocumentoEntrante) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPrioridadBadge(doc.cat_valores_catalogo_prioridad?.valor || '')}`}>
          {doc.cat_valores_catalogo_prioridad?.valor}
        </span>
      )
    },
    {
      key: 'remitente',
      label: 'Remitente',
      render: (doc: DocumentoEntrante) => (
        <div>
          <div className="font-medium">{doc.remitente_nombre}</div>
          {doc.remitente_cargo && (
            <div className="text-xs text-gray-500">{doc.remitente_cargo}</div>
          )}
        </div>
      )
    },
    {
      key: 'asunto',
      label: 'Asunto',
      render: (doc: DocumentoEntrante) => (
        <div className="max-w-xs truncate" title={doc.asunto}>
          {doc.asunto}
        </div>
      )
    },
    {
      key: 'tipo_doc',
      label: 'Tipo',
      render: (doc: DocumentoEntrante) => (
        <span className="text-sm text-gray-600">
          {doc.cat_valores_catalogo_tipo_doc?.valor}
        </span>
      )
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (doc: DocumentoEntrante) => (
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getEstatusBadge(doc.cat_valores_catalogo_estatus?.valor || '')}`}>
            {getEstatusIcon(doc.cat_valores_catalogo_estatus?.valor || '')}
            {doc.cat_valores_catalogo_estatus?.valor}
          </span>
        </div>
      )
    }
  ]

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="w-4 h-4" />,
      onClick: (doc: DocumentoEntrante) => {
        // TODO: Navegar a detalle
        console.log('Ver documento:', doc.id_documento)
      },
      variant: 'ghost' as const
    },
    {
      label: 'Editar',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: handleEdit,
      variant: 'ghost' as const
    },
    {
      label: 'Turnar',
      icon: <Send className="w-4 h-4" />,
      onClick: (doc: DocumentoEntrante) => {
        // TODO: Abrir modal de turnado
        console.log('Turnar documento:', doc.id_documento)
      },
      variant: 'ghost' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Documentos Entrantes
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de documentos recibidos
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Documento
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Buscar por folio, asunto, remitente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Prioridad */}
          <div>
            <select
              value={filterPrioridad}
              onChange={(e) => setFilterPrioridad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las prioridades</option>
              {prioridades.map(p => (
                <option key={p.id_valor_catalogo} value={p.id_valor_catalogo}>
                  {p.valor}
                </option>
              ))}
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

          {/* Fecha inicio */}
          <div>
            <Input
              type="date"
              label="Fecha desde"
              value={filterFechaInicio}
              onChange={(e) => setFilterFechaInicio(e.target.value)}
            />
          </div>

          {/* Fecha fin */}
          <div>
            <Input
              type="date"
              label="Fecha hasta"
              value={filterFechaFin}
              onChange={(e) => setFilterFechaFin(e.target.value)}
            />
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex items-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setFilterPrioridad('')
                setFilterEstatus('')
                setFilterFechaInicio('')
                setFilterFechaFin('')
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        {/* Resultados count */}
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{filteredDocumentos.length}</span> de{' '}
          <span className="font-medium">{documentos.length}</span> documentos
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={filteredDocumentos}
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
          title={selectedDoc ? 'Editar Documento' : 'Registrar Documento'}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Folio Interno */}
              <Input
                label="Folio Interno"
                value={formData.folio_interno}
                onChange={(e) => setFormData({ ...formData, folio_interno: e.target.value })}
                required
                placeholder="DOC-2024-001"
              />

              {/* Folio Externo */}
              <Input
                label="Folio Externo"
                value={formData.folio_externo || ''}
                onChange={(e) => setFormData({ ...formData, folio_externo: e.target.value || null })}
                placeholder="Folio del remitente"
              />

              {/* Fecha Recepción */}
              <Input
                type="date"
                label="Fecha de Recepción"
                value={formData.fecha_recepcion}
                onChange={(e) => setFormData({ ...formData, fecha_recepcion: e.target.value })}
                required
              />

              {/* Fecha Documento */}
              <Input
                type="date"
                label="Fecha del Documento"
                value={formData.fecha_documento || ''}
                onChange={(e) => setFormData({ ...formData, fecha_documento: e.target.value || null })}
              />

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_prioridad}
                  onChange={(e) => setFormData({ ...formData, id_prioridad: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {prioridades.map(p => (
                    <option key={p.id_valor_catalogo} value={p.id_valor_catalogo}>
                      {p.valor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_tipo_documento}
                  onChange={(e) => setFormData({ ...formData, id_tipo_documento: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {tiposDoc.map(t => (
                    <option key={t.id_valor_catalogo} value={t.id_valor_catalogo}>
                      {t.valor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Atención */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Atención <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_tipo_atencion}
                  onChange={(e) => setFormData({ ...formData, id_tipo_atencion: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {tiposAtencion.map(t => (
                    <option key={t.id_valor_catalogo} value={t.id_valor_catalogo}>
                      {t.valor}
                    </option>
                  ))}
                </select>
              </div>

              {/* UA Destinataria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad Administrativa Destinataria <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_ua_destinataria}
                  onChange={(e) => setFormData({ ...formData, id_ua_destinataria: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {unidades.map(ua => (
                    <option key={ua.id_ua} value={ua.id_ua}>
                      {ua.nombre_ua}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remitente Nombre */}
              <div className="col-span-2">
                <Input
                  label="Nombre del Remitente"
                  value={formData.remitente_nombre}
                  onChange={(e) => setFormData({ ...formData, remitente_nombre: e.target.value })}
                  required
                  placeholder="Nombre completo del remitente"
                />
              </div>

              {/* Remitente Cargo */}
              <Input
                label="Cargo del Remitente"
                value={formData.remitente_cargo || ''}
                onChange={(e) => setFormData({ ...formData, remitente_cargo: e.target.value || null })}
                placeholder="Ej: Director General"
              />

              {/* Remitente Institución */}
              <Input
                label="Institución del Remitente"
                value={formData.remitente_institucion || ''}
                onChange={(e) => setFormData({ ...formData, remitente_institucion: e.target.value || null })}
                placeholder="Ej: Secretaría de Salud"
              />

              {/* Número de Anexos */}
              <Input
                type="number"
                label="Número de Anexos"
                value={formData.numero_anexos}
                onChange={(e) => setFormData({ ...formData, numero_anexos: parseInt(e.target.value) || 0 })}
                min="0"
              />

              {/* Estatus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estatus <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.estatus_documento}
                  onChange={(e) => setFormData({ ...formData, estatus_documento: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {estatus.map(e => (
                    <option key={e.id_valor_catalogo} value={e.id_valor_catalogo}>
                      {e.valor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asunto */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  required
                  placeholder="Descripción breve del asunto"
                />
              </div>

              {/* Observaciones */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

              {/* Upload archivo */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo del Documento
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos permitidos: PDF, Imágenes, Word. Máximo 50 MB.
                  {uploadedFile && <span className="text-green-600 ml-2">✓ {uploadedFile.name}</span>}
                </p>
                {formData.archivo_nombre && !uploadedFile && (
                  <p className="text-xs text-blue-600 mt-1">
                    Archivo actual: {formData.archivo_nombre}
                  </p>
                )}
              </div>
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
                {selectedDoc ? 'Actualizar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
