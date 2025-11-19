'use client'

/**
 * Página de Detalle de Documento Entrante
 * Muestra toda la información del documento, archivo adjunto, texto OCR, y acciones
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Modal from '@/components/ui/Modal'
import {
  FileText,
  Calendar,
  User,
  Building,
  AlertCircle,
  Edit2,
  Send,
  Download,
  Eye,
  ArrowLeft,
  FileDown,
  Clock,
  CheckCircle,
  XCircle,
  Paperclip
} from 'lucide-react'
import type { Database } from '@/types/database'

type DocumentoEntrante = Database['public']['Tables']['tbl_documento_entrante']['Row'] & {
  cat_unidad_administrativa?: { nombre_ua: string; codigo_ua: string }
  tbl_usuarios_registro?: { nombre_completo: string; correo_institucional: string }
  cat_valores_catalogo_prioridad?: { valor: string }
  cat_valores_catalogo_tipo_doc?: { valor: string }
  cat_valores_catalogo_tipo_atencion?: { valor: string }
  cat_valores_catalogo_estatus?: { valor: string }
}

export default function DocumentoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const [documento, setDocumento] = useState<DocumentoEntrante | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOCR, setShowOCR] = useState(false)
  const [showTurnadoModal, setShowTurnadoModal] = useState(false)

  useEffect(() => {
    loadDocumento()
  }, [params.id])

  async function loadDocumento() {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('tbl_documento_entrante')
        .select(`
          *,
          cat_unidad_administrativa!tbl_documento_entrante_id_ua_destinataria_fkey(nombre_ua, codigo_ua),
          tbl_usuarios_registro:tbl_usuarios!tbl_documento_entrante_id_usuario_registro_fkey(nombre_completo, correo_institucional),
          cat_valores_catalogo_prioridad:cat_valores_catalogo!tbl_documento_entrante_id_prioridad_fkey(valor),
          cat_valores_catalogo_tipo_doc:cat_valores_catalogo!tbl_documento_entrante_id_tipo_documento_fkey(valor),
          cat_valores_catalogo_tipo_atencion:cat_valores_catalogo!tbl_documento_entrante_id_tipo_atencion_fkey(valor),
          cat_valores_catalogo_estatus:cat_valores_catalogo!tbl_documento_entrante_estatus_documento_fkey(valor)
        `)
        .eq('id_documento', params.id)
        .single()

      if (fetchError) throw fetchError

      setDocumento(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getPrioridadStyle(prioridad: string) {
    const styles: Record<string, string> = {
      'Urgente': 'bg-red-100 text-red-800 border-red-300',
      'Alta': 'bg-orange-100 text-orange-800 border-orange-300',
      'Media': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Baja': 'bg-green-100 text-green-800 border-green-300'
    }
    return styles[prioridad] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  function getEstatusStyle(estatus: string) {
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
        return <Clock className="w-5 h-5" />
      case 'En Proceso':
        return <AlertCircle className="w-5 h-5" />
      case 'Atendido':
        return <CheckCircle className="w-5 h-5" />
      case 'Cancelado':
        return <XCircle className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  async function handleDownload() {
    if (!documento?.archivo_url) return

    try {
      // Abrir archivo en nueva pestaña
      window.open(documento.archivo_url, '_blank')
    } catch (err: any) {
      setError('Error al descargar archivo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !documento) {
    return (
      <div className="p-6">
        <Alert type="error" message={error || 'Documento no encontrado'} />
        <Button
          variant="secondary"
          onClick={() => router.push('/dashboard/documentos/entrantes')}
          icon={<ArrowLeft />}
          className="mt-4"
        >
          Volver a la lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/documentos/entrantes')}
            icon={<ArrowLeft />}
            size="sm"
          >
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              {documento.folio_interno}
            </h1>
            <p className="text-gray-600 mt-1">Detalle del documento</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push(`/dashboard/documentos/entrantes?edit=${documento.id_documento}`)}
            icon={<Edit2 />}
          >
            Editar
          </Button>
          <Button
            onClick={() => setShowTurnadoModal(true)}
            icon={<Send />}
          >
            Turnar
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${getEstatusStyle(documento.cat_valores_catalogo_estatus?.valor || '')}`}>
            {getEstatusIcon(documento.cat_valores_catalogo_estatus?.valor || '')}
            {documento.cat_valores_catalogo_estatus?.valor}
          </span>

          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getPrioridadStyle(documento.cat_valores_catalogo_prioridad?.valor || '')}`}>
            {documento.cat_valores_catalogo_prioridad?.valor}
          </span>

          <span className="px-4 py-2 rounded-full text-sm font-medium border bg-blue-50 text-blue-800 border-blue-300">
            {documento.cat_valores_catalogo_tipo_doc?.valor}
          </span>
        </div>

        <div className="text-sm text-gray-600">
          Registrado: {new Date(documento.fecha_registro).toLocaleString('es-MX')}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del Documento */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Información del Documento
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Asunto */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Asunto
                </label>
                <p className="text-gray-900 text-lg">{documento.asunto}</p>
              </div>

              {/* Folios */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Folio Interno
                  </label>
                  <p className="text-gray-900 font-medium">{documento.folio_interno}</p>
                </div>
                {documento.folio_externo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Folio Externo
                    </label>
                    <p className="text-gray-900">{documento.folio_externo}</p>
                  </div>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Fecha de Recepción
                  </label>
                  <p className="text-gray-900">
                    {new Date(documento.fecha_recepcion).toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {documento.fecha_documento && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Fecha del Documento
                    </label>
                    <p className="text-gray-900">
                      {new Date(documento.fecha_documento).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Tipo de Atención */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Tipo de Atención
                </label>
                <p className="text-gray-900">{documento.cat_valores_catalogo_tipo_atencion?.valor}</p>
              </div>

              {/* Número de Anexos */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Paperclip className="w-4 h-4" />
                  Número de Anexos
                </label>
                <p className="text-gray-900">{documento.numero_anexos}</p>
              </div>

              {/* Observaciones */}
              {documento.observaciones && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Observaciones
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">{documento.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          {/* Datos del Remitente */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Información del Remitente
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Nombre
                </label>
                <p className="text-gray-900 text-lg font-medium">{documento.remitente_nombre}</p>
              </div>

              {documento.remitente_cargo && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Cargo
                  </label>
                  <p className="text-gray-900">{documento.remitente_cargo}</p>
                </div>
              )}

              {documento.remitente_institucion && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Institución
                  </label>
                  <p className="text-gray-900">{documento.remitente_institucion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Texto OCR */}
          {documento.texto_ocr && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Texto Extraído (OCR)
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOCR(!showOCR)}
                >
                  {showOCR ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
              {showOCR && (
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {documento.texto_ocr}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Texto extraído automáticamente del documento usando OCR
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Archivo Adjunto */}
          {documento.archivo_url && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileDown className="w-5 h-5 text-blue-600" />
                  Archivo Adjunto
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {documento.archivo_nombre || 'Documento'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {documento.hash_archivo ? `Hash: ${documento.hash_archivo.substring(0, 16)}...` : ''}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleDownload}
                  icon={<Download />}
                >
                  Descargar / Ver
                </Button>

                {documento.archivo_url.match(/\.(jpg|jpeg|png|gif)$/i) && (
                  <div className="mt-4">
                    <img
                      src={documento.archivo_url}
                      alt="Vista previa"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unidad Destinataria */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Unidad Destinataria
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-900 font-medium">
                {documento.cat_unidad_administrativa?.nombre_ua}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Código: {documento.cat_unidad_administrativa?.codigo_ua}
              </p>
            </div>
          </div>

          {/* Información de Registro */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Registrado Por
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-900 font-medium">
                {documento.tbl_usuarios_registro?.nombre_completo}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {documento.tbl_usuarios_registro?.correo_institucional}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(documento.fecha_registro).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Turnado (placeholder) */}
      {showTurnadoModal && (
        <Modal
          isOpen={showTurnadoModal}
          onClose={() => setShowTurnadoModal(false)}
          title="Turnar Documento"
        >
          <div className="p-6">
            <Alert type="info" message="Funcionalidad de turnado en desarrollo" />
            <p className="text-gray-600 mt-4">
              Esta funcionalidad permitirá turnar el documento a otra unidad administrativa
              con instrucciones y plazos de atención.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
