'use client'

/**
 * Módulo de Documentos Salientes
 * Gestión de documentos generados y enviados por la institución
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
  Edit2,
  Upload,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  Package as PackageIcon
} from 'lucide-react'
import type { Database } from '@/types/database'

type DocumentoSaliente = {
  id_documento: number
  folio_saliente: string
  folio_respuesta: string | null
  fecha_elaboracion: string
  fecha_envio: string | null
  destinatario_nombre: string
  destinatario_cargo: string | null
  destinatario_institucion: string | null
  asunto: string
  contenido: string | null
  numero_anexos: number
  medio_envio: string | null
  numero_guia: string | null
  archivo_url: string | null
  archivo_nombre: string | null
  acuse_url: string | null
  observaciones: string | null
  cat_unidad_administrativa?: { nombre_ua: string }
  tbl_usuarios_elabora?: { nombre_completo: string }
  cat_valores_catalogo_prioridad?: { valor: string }
  cat_valores_catalogo_tipo?: { valor: string }
  cat_valores_catalogo_estatus?: { valor: string }
}

type FormData = {
  folio_saliente: string
  folio_respuesta: string | null
  fecha_elaboracion: string
  fecha_envio: string | null
  id_prioridad: number
  id_tipo_documento: number
  destinatario_nombre: string
  destinatario_cargo: string | null
  destinatario_institucion: string | null
  asunto: string
  contenido: string | null
  id_ua_remitente: number
  numero_anexos: number
  medio_envio: string | null
  numero_guia: string | null
  estatus_envio: number
  archivo_url: string | null
  archivo_nombre: string | null
  acuse_url: string | null
  observaciones: string | null
}

export default function DocumentosSalientesPage() {
  const [documentos, setDocumentos] = useState<DocumentoSaliente[]>([])
  const [filteredDocumentos, setFilteredDocumentos] = useState<DocumentoSaliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<DocumentoSaliente | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstatus, setFilterEstatus] = useState<string>('')
  const [filterFechaInicio, setFilterFechaInicio] = useState('')
  const [filterFechaFin, setFilterFechaFin] = useState('')

  // Catálogos
  const [prioridades, setPrioridades] = useState<any[]>([])
  const [tiposDoc, setTiposDoc] = useState<any[]>([])
  const [estatusEnvio, setEstatusEnvio] = useState<any[]>([])
  const [mediosEnvio, setMediosEnvio] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Form data
  const [formData, setFormData] = useState<FormData>({
    folio_saliente: '',
    folio_respuesta: null,
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    fecha_envio: null,
    id_prioridad: 0,
    id_tipo_documento: 0,
    destinatario_nombre: '',
    destinatario_cargo: null,
    destinatario_institucion: null,
    asunto: '',
    contenido: null,
    id_ua_remitente: 0,
    numero_anexos: 0,
    medio_envio: null,
    numero_guia: null,
    estatus_envio: 0,
    archivo_url: null,
    archivo_nombre: null,
    acuse_url: null,
    observaciones: null
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedAcuse, setUploadedAcuse] = useState<File | null>(null)

  useEffect(() => {
    loadData()
    loadCatalogos()
    loadCurrentUser()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterEstatus, filterFechaInicio, filterFechaFin, documentos])

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

      // Nota: Esta query asume que la tabla ya existe
      // Si no existe, mostrará error y el usuario deberá ejecutar el script SQL primero
      const { data, error: fetchError } = await supabase
        .from('tbl_documento_saliente')
        .select(`
          *,
          cat_unidad_administrativa!tbl_documento_saliente_id_ua_remitente_fkey(nombre_ua),
          tbl_usuarios_elabora:tbl_usuarios!tbl_documento_saliente_id_usuario_elabora_fkey(nombre_completo),
          cat_valores_catalogo_prioridad:cat_valores_catalogo!tbl_documento_saliente_id_prioridad_fkey(valor),
          cat_valores_catalogo_tipo:cat_valores_catalogo!tbl_documento_saliente_id_tipo_documento_fkey(valor),
          cat_valores_catalogo_estatus:cat_valores_catalogo!tbl_documento_saliente_estatus_envio_fkey(valor)
        `)
        .order('fecha_elaboracion', { ascending: false })

      if (fetchError) {
        // Si la tabla no existe, mostrar mensaje de ayuda
        if (fetchError.message.includes('relation "tbl_documento_saliente" does not exist')) {
          setError('La tabla de documentos salientes no existe. Por favor ejecuta el script SQL: supabase_documento_saliente.sql en Supabase.')
        } else {
          throw fetchError
        }
        setDocumentos([])
        setFilteredDocumentos([])
      } else {
        setDocumentos(data as any || [])
        setFilteredDocumentos(data as any || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalogos() {
    try {
      const supabase = createClient()

      const { data: priData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Prioridad')
        .eq('activo', true)
        .order('orden', { ascending: true })
      setPrioridades(priData || [])

      const { data: tipoDocData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Tipo Documento')
        .eq('activo', true)
        .order('valor', { ascending: true })
      setTiposDoc(tipoDocData || [])

      const { data: estatusData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Estatus Envío')
        .eq('activo', true)
        .order('orden', { ascending: true })
      setEstatusEnvio(estatusData || [])

      const { data: mediosData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Medio Envío')
        .eq('activo', true)
        .order('orden', { ascending: true })
      setMediosEnvio(mediosData || [])

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

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.folio_saliente.toLowerCase().includes(search) ||
        doc.asunto.toLowerCase().includes(search) ||
        doc.destinatario_nombre.toLowerCase().includes(search)
      )
    }

    if (filterEstatus) {
      filtered = filtered.filter(doc =>
        doc.cat_valores_catalogo_estatus?.valor === filterEstatus
      )
    }

    if (filterFechaInicio) {
      filtered = filtered.filter(doc => doc.fecha_elaboracion >= filterFechaInicio)
    }

    if (filterFechaFin) {
      filtered = filtered.filter(doc => doc.fecha_elaboracion <= filterFechaFin)
    }

    setFilteredDocumentos(filtered)
  }

  function getEstatusBadge(estatus: string) {
    const styles: Record<string, string> = {
      'Elaborado': 'bg-gray-100 text-gray-800 border-gray-300',
      'Enviado': 'bg-blue-100 text-blue-800 border-blue-300',
      'En Tránsito': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Entregado': 'bg-green-100 text-green-800 border-green-300',
      'Acuse Recibido': 'bg-green-100 text-green-800 border-green-300',
      'Cancelado': 'bg-red-100 text-red-800 border-red-300'
    }
    return styles[estatus] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  function getEstatusIcon(estatus: string) {
    switch (estatus) {
      case 'Elaborado':
        return <Clock className="w-4 h-4" />
      case 'Enviado':
      case 'En Tránsito':
        return <Send className="w-4 h-4" />
      case 'Entregado':
      case 'Acuse Recibido':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <PackageIcon className="w-4 h-4" />
    }
  }

  function handleNew() {
    setSelectedDoc(null)
    setFormData({
      folio_saliente: '',
      folio_respuesta: null,
      fecha_elaboracion: new Date().toISOString().split('T')[0],
      fecha_envio: null,
      id_prioridad: prioridades.find(p => p.valor === 'Media')?.id_valor_catalogo || 0,
      id_tipo_documento: tiposDoc[0]?.id_valor_catalogo || 0,
      destinatario_nombre: '',
      destinatario_cargo: null,
      destinatario_institucion: null,
      asunto: '',
      contenido: null,
      id_ua_remitente: currentUser?.id_ua || 0,
      numero_anexos: 0,
      medio_envio: null,
      numero_guia: null,
      estatus_envio: estatusEnvio.find(e => e.valor === 'Elaborado')?.id_valor_catalogo || 0,
      archivo_url: null,
      archivo_nombre: null,
      acuse_url: null,
      observaciones: null
    })
    setUploadedFile(null)
    setUploadedAcuse(null)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      let fileUrl = formData.archivo_url
      let fileName = formData.archivo_nombre
      let acuseUrl = formData.acuse_url

      // Upload archivo principal
      if (uploadedFile) {
        const result = await uploadFile(uploadedFile, 'documentos-salientes')
        fileUrl = result.url
        fileName = uploadedFile.name
      }

      // Upload acuse
      if (uploadedAcuse) {
        const result = await uploadFile(uploadedAcuse, 'acuses')
        acuseUrl = result.url
      }

      const documentData = {
        ...formData,
        archivo_url: fileUrl,
        archivo_nombre: fileName,
        acuse_url: acuseUrl,
        id_usuario_elabora: user.id,
        id_usuario_registro: user.id
      }

      if (selectedDoc) {
        const { error: updateError } = await supabase
          .from('tbl_documento_saliente')
          .update(documentData)
          .eq('id_documento', selectedDoc.id_documento)

        if (updateError) throw updateError
        setSuccess('Documento actualizado exitosamente')
      } else {
        const { error: insertError } = await supabase
          .from('tbl_documento_saliente')
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

  async function uploadFile(file: File, bucket: string): Promise<{ url: string }> {
    const supabase = createClient()
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return { url: urlData.publicUrl }
  }

  const columns = [
    {
      key: 'folio',
      label: 'Folio',
      render: (doc: DocumentoSaliente) => (
        <div className="font-medium text-blue-600">{doc.folio_saliente}</div>
      )
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (doc: DocumentoSaliente) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {new Date(doc.fecha_elaboracion).toLocaleDateString('es-MX')}
        </div>
      )
    },
    {
      key: 'destinatario',
      label: 'Destinatario',
      render: (doc: DocumentoSaliente) => (
        <div>
          <div className="font-medium">{doc.destinatario_nombre}</div>
          {doc.destinatario_institucion && (
            <div className="text-xs text-gray-500">{doc.destinatario_institucion}</div>
          )}
        </div>
      )
    },
    {
      key: 'asunto',
      label: 'Asunto',
      render: (doc: DocumentoSaliente) => (
        <div className="max-w-xs truncate" title={doc.asunto}>{doc.asunto}</div>
      )
    },
    {
      key: 'medio',
      label: 'Medio',
      render: (doc: DocumentoSaliente) => (
        <span className="text-sm text-gray-600">{doc.medio_envio || '-'}</span>
      )
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (doc: DocumentoSaliente) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getEstatusBadge(doc.cat_valores_catalogo_estatus?.valor || '')}`}>
          {getEstatusIcon(doc.cat_valores_catalogo_estatus?.valor || '')}
          {doc.cat_valores_catalogo_estatus?.valor}
        </span>
      )
    }
  ]

  const actions = [
    {
      label: 'Ver',
      icon: <Eye className="w-4 h-4" />,
      onClick: (doc: DocumentoSaliente) => console.log('Ver:', doc.id_documento),
      variant: 'ghost' as const
    },
    {
      label: 'Editar',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: (doc: DocumentoSaliente) => {
        setSelectedDoc(doc)
        setFormData({
          folio_saliente: doc.folio_saliente,
          folio_respuesta: doc.folio_respuesta,
          fecha_elaboracion: doc.fecha_elaboracion,
          fecha_envio: doc.fecha_envio,
          id_prioridad: (doc.cat_valores_catalogo_prioridad as any)?.id_valor_catalogo || 0,
          id_tipo_documento: (doc.cat_valores_catalogo_tipo as any)?.id_valor_catalogo || 0,
          destinatario_nombre: doc.destinatario_nombre,
          destinatario_cargo: doc.destinatario_cargo,
          destinatario_institucion: doc.destinatario_institucion,
          asunto: doc.asunto,
          contenido: doc.contenido,
          id_ua_remitente: (doc.cat_unidad_administrativa as any)?.id_ua || 0,
          numero_anexos: doc.numero_anexos,
          medio_envio: doc.medio_envio,
          numero_guia: doc.numero_guia,
          estatus_envio: (doc.cat_valores_catalogo_estatus as any)?.id_valor_catalogo || 0,
          archivo_url: doc.archivo_url,
          archivo_nombre: doc.archivo_nombre,
          acuse_url: doc.acuse_url,
          observaciones: doc.observaciones
        })
        setShowModal(true)
      },
      variant: 'ghost' as const
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-8 h-8 text-blue-600" />
            Documentos Salientes
          </h1>
          <p className="text-gray-600 mt-1">Gestión de documentos enviados</p>
        </div>
        <Button onClick={handleNew} icon={<Plus />}>Registrar Documento</Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          Filtros y Búsqueda
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Buscar por folio, asunto, destinatario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <select
              value={filterEstatus}
              onChange={(e) => setFilterEstatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estatus</option>
              {estatusEnvio.map(e => (
                <option key={e.id_valor_catalogo} value={e.valor}>{e.valor}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{filteredDocumentos.length}</span> de{' '}
          <span className="font-medium">{documentos.length}</span> documentos
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          data={filteredDocumentos}
          columns={columns}
          actions={actions}
          loading={loading}
        />
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedDoc ? 'Editar Documento' : 'Registrar Documento'}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Folio (dejar vacío para auto-generar)"
                value={formData.folio_saliente}
                onChange={(e) => setFormData({ ...formData, folio_saliente: e.target.value })}
                placeholder="SAL-2024-0001"
              />

              <Input
                type="date"
                label="Fecha de Elaboración"
                value={formData.fecha_elaboracion}
                onChange={(e) => setFormData({ ...formData, fecha_elaboracion: e.target.value })}
                required
              />

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
                    <option key={p.id_valor_catalogo} value={p.id_valor_catalogo}>{p.valor}</option>
                  ))}
                </select>
              </div>

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
                    <option key={t.id_valor_catalogo} value={t.id_valor_catalogo}>{t.valor}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <Input
                  label="Destinatario"
                  value={formData.destinatario_nombre}
                  onChange={(e) => setFormData({ ...formData, destinatario_nombre: e.target.value })}
                  required
                  placeholder="Nombre del destinatario"
                />
              </div>

              <Input
                label="Cargo"
                value={formData.destinatario_cargo || ''}
                onChange={(e) => setFormData({ ...formData, destinatario_cargo: e.target.value || null })}
              />

              <Input
                label="Institución"
                value={formData.destinatario_institucion || ''}
                onChange={(e) => setFormData({ ...formData, destinatario_institucion: e.target.value || null })}
              />

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
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo del Documento
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {uploadedFile && <p className="text-xs text-green-600 mt-1">✓ {uploadedFile.name}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button type="submit">{selectedDoc ? 'Actualizar' : 'Registrar'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
