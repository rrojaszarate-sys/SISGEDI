'use client'

/**
 * Componente de Historial de Movimientos
 * Muestra la trazabilidad completa de un documento a través de turnados
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Clock,
  CheckCircle,
  Send,
  User,
  Building,
  FileText,
  ArrowRight,
  AlertCircle,
  XCircle
} from 'lucide-react'

type Movimiento = {
  id_turnado: number
  fecha_turnado: string
  fecha_recepcion: string | null
  fecha_atencion: string | null
  ua_origen: string
  ua_destino: string
  usuario_turna: string
  usuario_recibe: string | null
  instrucciones: string | null
  respuesta: string | null
  estatus: string
  plazo_atencion: string | null
}

interface HistorialMovimientosProps {
  idDocumento: number
}

export default function HistorialMovimientos({ idDocumento }: HistorialMovimientosProps) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMovimientos()
  }, [idDocumento])

  async function loadMovimientos() {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('tbl_turnado')
        .select(`
          id_turnado,
          fecha_turnado,
          fecha_recepcion,
          fecha_atencion,
          instrucciones,
          respuesta,
          plazo_atencion,
          cat_unidad_administrativa_origen:cat_unidad_administrativa!tbl_turnado_id_ua_origen_fkey(nombre_ua),
          cat_unidad_administrativa_destino:cat_unidad_administrativa!tbl_turnado_id_ua_destino_fkey(nombre_ua),
          tbl_usuarios_turna:tbl_usuarios!tbl_turnado_id_usuario_turna_fkey(nombre_completo),
          tbl_usuarios_recibe:tbl_usuarios!tbl_turnado_id_usuario_destino_fkey(nombre_completo),
          cat_valores_catalogo_estatus:cat_valores_catalogo!tbl_turnado_estatus_turnado_fkey(valor)
        `)
        .eq('id_documento', idDocumento)
        .order('fecha_turnado', { ascending: false })

      if (fetchError) throw fetchError

      const formattedData: Movimiento[] = (data || []).map(item => ({
        id_turnado: item.id_turnado,
        fecha_turnado: item.fecha_turnado,
        fecha_recepcion: item.fecha_recepcion,
        fecha_atencion: item.fecha_atencion,
        ua_origen: (item.cat_unidad_administrativa_origen as any)?.nombre_ua || 'Desconocido',
        ua_destino: (item.cat_unidad_administrativa_destino as any)?.nombre_ua || 'Desconocido',
        usuario_turna: (item.tbl_usuarios_turna as any)?.nombre_completo || 'Desconocido',
        usuario_recibe: (item.tbl_usuarios_recibe as any)?.nombre_completo || null,
        instrucciones: item.instrucciones,
        respuesta: item.respuesta,
        estatus: (item.cat_valores_catalogo_estatus as any)?.valor || 'Desconocido',
        plazo_atencion: item.plazo_atencion
      }))

      setMovimientos(formattedData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getEstatusIcon(estatus: string) {
    switch (estatus) {
      case 'Pendiente':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'En Proceso':
        return <AlertCircle className="w-5 h-5 text-blue-600" />
      case 'Atendido':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'Rechazado':
      case 'Vencido':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Send className="w-5 h-5 text-gray-600" />
    }
  }

  function getEstatusColor(estatus: string) {
    switch (estatus) {
      case 'Pendiente':
        return 'border-yellow-300 bg-yellow-50'
      case 'En Proceso':
        return 'border-blue-300 bg-blue-50'
      case 'Atendido':
        return 'border-green-300 bg-green-50'
      case 'Rechazado':
      case 'Vencido':
        return 'border-red-300 bg-red-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Error al cargar el historial: {error}
      </div>
    )
  }

  if (movimientos.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Este documento aún no ha sido turnado</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
        <Send className="w-5 h-5 text-blue-600" />
        Historial de Turnados ({movimientos.length})
      </div>

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Línea vertical */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {movimientos.map((mov, index) => (
          <div key={mov.id_turnado} className="relative pl-16">
            {/* Icono de estado */}
            <div className="absolute left-0 top-0 w-12 h-12 rounded-full border-4 border-white bg-white flex items-center justify-center shadow-md z-10">
              {getEstatusIcon(mov.estatus)}
            </div>

            {/* Tarjeta de movimiento */}
            <div className={`rounded-lg border-2 p-4 ${getEstatusColor(mov.estatus)}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    Turnado: {new Date(mov.fecha_turnado).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Building className="w-5 h-5 text-gray-600" />
                    {mov.ua_origen}
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    {mov.ua_destino}
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  mov.estatus === 'Atendido' ? 'bg-green-100 text-green-800' :
                  mov.estatus === 'En Proceso' ? 'bg-blue-100 text-blue-800' :
                  mov.estatus === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {mov.estatus}
                </span>
              </div>

              {/* Usuarios */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-gray-500">Turnado por:</div>
                    <div className="font-medium text-gray-900">{mov.usuario_turna}</div>
                  </div>
                </div>

                {mov.usuario_recibe && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="text-gray-500">Recibido por:</div>
                      <div className="font-medium text-gray-900">{mov.usuario_recibe}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instrucciones */}
              {mov.instrucciones && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Instrucciones:</div>
                  <div className="text-sm text-gray-800 bg-white/50 rounded p-2">
                    {mov.instrucciones}
                  </div>
                </div>
              )}

              {/* Plazo */}
              {mov.plazo_atencion && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Plazo de atención:</div>
                  <div className="text-sm text-gray-800">
                    {new Date(mov.plazo_atencion).toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {new Date(mov.plazo_atencion) < new Date() && mov.estatus !== 'Atendido' && (
                      <span className="ml-2 text-red-600 font-medium">⚠️ Vencido</span>
                    )}
                  </div>
                </div>
              )}

              {/* Respuesta */}
              {mov.respuesta && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Respuesta:</div>
                  <div className="text-sm text-gray-800 bg-white/50 rounded p-2">
                    {mov.respuesta}
                  </div>
                </div>
              )}

              {/* Fechas de recepción y atención */}
              <div className="flex gap-4 text-xs text-gray-600">
                {mov.fecha_recepcion && (
                  <div>
                    <span className="font-medium">Recibido:</span>{' '}
                    {new Date(mov.fecha_recepcion).toLocaleString('es-MX', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                {mov.fecha_atencion && (
                  <div>
                    <span className="font-medium">Atendido:</span>{' '}
                    {new Date(mov.fecha_atencion).toLocaleString('es-MX', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
