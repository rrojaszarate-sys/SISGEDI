'use client'

/**
 * Módulo de Reportes y Estadísticas
 * Visualización de datos con gráficas y exportación
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  FileText,
  Send,
  Package,
  Users,
  Building,
  PieChart,
  Loader2
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import * as XLSX from 'xlsx'

type ReportData = {
  totalDocumentos: number
  totalTurnados: number
  totalInventario: number
  totalUsuarios: number
  documentosPorMes: { mes: string; cantidad: number }[]
  turnadosPorEstatus: { estatus: string; cantidad: number }[]
  inventarioPorTipo: { tipo: string; cantidad: number }[]
  documentosPorPrioridad: { prioridad: string; cantidad: number }[]
  turnadosVencidos: number
  documentosAtendidos: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function ReportesPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => {
    // Establecer rango por defecto: últimos 6 meses
    const hoy = new Date()
    const seisMesesAntes = new Date()
    seisMesesAntes.setMonth(hoy.getMonth() - 6)

    setFechaFin(hoy.toISOString().split('T')[0])
    setFechaInicio(seisMesesAntes.toISOString().split('T')[0])

    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // Totales
      const [
        { count: totalDocs },
        { count: totalTurn },
        { count: totalInv },
        { count: totalUsers }
      ] = await Promise.all([
        supabase.from('tbl_documento_entrante').select('*', { count: 'exact', head: true }),
        supabase.from('tbl_turnado').select('*', { count: 'exact', head: true }),
        supabase.from('tbl_inventario').select('*', { count: 'exact', head: true }),
        supabase.from('tbl_usuarios').select('*', { count: 'exact', head: true })
      ])

      // Documentos por mes
      const { data: docs } = await supabase
        .from('tbl_documento_entrante')
        .select('fecha_recepcion')
        .gte('fecha_recepcion', fechaInicio || '2024-01-01')
        .lte('fecha_recepcion', fechaFin || new Date().toISOString())

      const docsPorMes = processMonthlyData(docs || [])

      // Turnados por estatus
      const { data: turnados } = await supabase
        .from('tbl_turnado')
        .select(`
          estatus_turnado,
          cat_valores_catalogo!tbl_turnado_estatus_turnado_fkey(valor)
        `)
        .gte('fecha_turnado', fechaInicio || '2024-01-01')
        .lte('fecha_turnado', fechaFin || new Date().toISOString())

      const turnadosPorEstatus = processTurnadosEstatus(turnados || [])

      // Inventario por tipo
      const { data: inventario } = await supabase
        .from('tbl_inventario')
        .select(`
          id_tipo_bien,
          cat_valores_catalogo!tbl_inventario_id_tipo_bien_fkey(valor)
        `)

      const invPorTipo = processInventarioTipo(inventario || [])

      // Documentos por prioridad
      const { data: docsPrioridad } = await supabase
        .from('tbl_documento_entrante')
        .select(`
          id_prioridad,
          cat_valores_catalogo!tbl_documento_entrante_id_prioridad_fkey(valor)
        `)
        .gte('fecha_recepcion', fechaInicio || '2024-01-01')
        .lte('fecha_recepcion', fechaFin || new Date().toISOString())

      const docsPorPrioridad = processDocsPrioridad(docsPrioridad || [])

      // Turnados vencidos
      const { data: vencidos } = await supabase
        .from('tbl_turnado')
        .select('plazo_atencion, estatus_turnado, cat_valores_catalogo!tbl_turnado_estatus_turnado_fkey(valor)')
        .not('plazo_atencion', 'is', null)
        .lt('plazo_atencion', new Date().toISOString())

      const turnadosVencidos = vencidos?.filter(t =>
        (t.cat_valores_catalogo as any)?.valor !== 'Atendido'
      ).length || 0

      // Documentos atendidos
      const { data: atendidos } = await supabase
        .from('tbl_documento_entrante')
        .select(`
          estatus_documento,
          cat_valores_catalogo!tbl_documento_entrante_estatus_documento_fkey(valor)
        `)
        .gte('fecha_recepcion', fechaInicio || '2024-01-01')
        .lte('fecha_recepcion', fechaFin || new Date().toISOString())

      const docsAtendidos = atendidos?.filter(d =>
        (d.cat_valores_catalogo as any)?.valor === 'Atendido'
      ).length || 0

      setData({
        totalDocumentos: totalDocs || 0,
        totalTurnados: totalTurn || 0,
        totalInventario: totalInv || 0,
        totalUsuarios: totalUsers || 0,
        documentosPorMes: docsPorMes,
        turnadosPorEstatus,
        inventarioPorTipo: invPorTipo,
        documentosPorPrioridad: docsPorPrioridad,
        turnadosVencidos,
        documentosAtendidos: docsAtendidos
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function processMonthlyData(docs: any[]): { mes: string; cantidad: number }[] {
    const mesesMap = new Map<string, number>()

    docs.forEach(doc => {
      const fecha = new Date(doc.fecha_recepcion)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      mesesMap.set(mesKey, (mesesMap.get(mesKey) || 0) + 1)
    })

    const meses = Array.from(mesesMap.entries())
      .map(([mes, cantidad]) => ({
        mes: formatMonth(mes),
        cantidad
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes))

    return meses
  }

  function processTurnadosEstatus(turnados: any[]): { estatus: string; cantidad: number }[] {
    const estatusMap = new Map<string, number>()

    turnados.forEach(t => {
      const estatus = (t.cat_valores_catalogo as any)?.valor || 'Sin estatus'
      estatusMap.set(estatus, (estatusMap.get(estatus) || 0) + 1)
    })

    return Array.from(estatusMap.entries()).map(([estatus, cantidad]) => ({
      estatus,
      cantidad
    }))
  }

  function processInventarioTipo(items: any[]): { tipo: string; cantidad: number }[] {
    const tipoMap = new Map<string, number>()

    items.forEach(item => {
      const tipo = (item.cat_valores_catalogo as any)?.valor || 'Sin tipo'
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1)
    })

    return Array.from(tipoMap.entries()).map(([tipo, cantidad]) => ({
      tipo,
      cantidad
    }))
  }

  function processDocsPrioridad(docs: any[]): { prioridad: string; cantidad: number }[] {
    const prioridadMap = new Map<string, number>()

    docs.forEach(doc => {
      const prioridad = (doc.cat_valores_catalogo as any)?.valor || 'Sin prioridad'
      prioridadMap.set(prioridad, (prioridadMap.get(prioridad) || 0) + 1)
    })

    return Array.from(prioridadMap.entries()).map(([prioridad, cantidad]) => ({
      prioridad,
      cantidad
    }))
  }

  function formatMonth(mesKey: string): string {
    const [year, month] = mesKey.split('-')
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${meses[parseInt(month) - 1]} ${year}`
  }

  async function exportToExcel() {
    if (!data) return

    const wb = XLSX.utils.book_new()

    // Hoja 1: Resumen
    const resumen = [
      ['SISGEDI 2.0 - Reporte Estadístico'],
      ['Generado:', new Date().toLocaleString('es-MX')],
      ['Período:', `${fechaInicio} al ${fechaFin}`],
      [],
      ['TOTALES'],
      ['Total Documentos', data.totalDocumentos],
      ['Total Turnados', data.totalTurnados],
      ['Total Inventario', data.totalInventario],
      ['Total Usuarios', data.totalUsuarios],
      ['Turnados Vencidos', data.turnadosVencidos],
      ['Documentos Atendidos', data.documentosAtendidos],
    ]
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen)
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    // Hoja 2: Documentos por Mes
    const wsDocsMes = XLSX.utils.json_to_sheet(data.documentosPorMes)
    XLSX.utils.book_append_sheet(wb, wsDocsMes, 'Docs por Mes')

    // Hoja 3: Turnados por Estatus
    const wsTurnados = XLSX.utils.json_to_sheet(data.turnadosPorEstatus)
    XLSX.utils.book_append_sheet(wb, wsTurnados, 'Turnados')

    // Hoja 4: Inventario por Tipo
    const wsInventario = XLSX.utils.json_to_sheet(data.inventarioPorTipo)
    XLSX.utils.book_append_sheet(wb, wsInventario, 'Inventario')

    // Hoja 5: Documentos por Prioridad
    const wsDocsPrioridad = XLSX.utils.json_to_sheet(data.documentosPorPrioridad)
    XLSX.utils.book_append_sheet(wb, wsDocsPrioridad, 'Prioridades')

    // Descargar
    XLSX.writeFile(wb, `reporte_sisgedi_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Alert type="error" message={error || 'Error cargando datos'} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Reportes y Estadísticas
          </h1>
          <p className="text-gray-600 mt-1">
            Visualización de datos y métricas del sistema
          </p>
        </div>
        <Button onClick={exportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Calendar className="w-5 h-5" />
            Período:
          </div>
          <Input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <span className="text-gray-500">al</span>
          <Input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <Button onClick={loadData} size="sm">
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Documentos */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{data.totalDocumentos}</div>
          <div className="text-blue-100">Documentos Entrantes</div>
          <div className="mt-2 text-sm text-blue-200">
            {data.documentosAtendidos} atendidos
          </div>
        </div>

        {/* Total Turnados */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Send className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{data.totalTurnados}</div>
          <div className="text-purple-100">Turnados</div>
          <div className="mt-2 text-sm text-purple-200">
            {data.turnadosVencidos} vencidos
          </div>
        </div>

        {/* Total Inventario */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{data.totalInventario}</div>
          <div className="text-green-100">Bienes en Inventario</div>
        </div>

        {/* Total Usuarios */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <Building className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-3xl font-bold mb-1">{data.totalUsuarios}</div>
          <div className="text-orange-100">Usuarios Activos</div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentos por Mes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documentos por Mes
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.documentosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#3B82F6" name="Documentos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Turnados por Estatus */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Turnados por Estatus
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={data.turnadosPorEstatus}
                dataKey="cantidad"
                nameKey="estatus"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.turnadosPorEstatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Inventario por Tipo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventario por Tipo de Bien
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.inventarioPorTipo} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="tipo" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#10B981" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Documentos por Prioridad */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documentos por Prioridad
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={data.documentosPorPrioridad}
                dataKey="cantidad"
                nameKey="prioridad"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.documentosPorPrioridad.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
