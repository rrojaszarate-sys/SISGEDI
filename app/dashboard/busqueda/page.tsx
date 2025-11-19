'use client'

/**
 * Módulo de Búsqueda Global
 * Búsqueda avanzada en documentos, turnados, inventario y texto OCR
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import {
  Search,
  Filter,
  Download,
  FileText,
  Package,
  Send,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2
} from 'lucide-react'

type SearchResult = {
  tipo: 'documento' | 'turnado' | 'inventario'
  id: string
  titulo: string
  descripcion: string
  fecha: string
  relevancia: number
  metadata: Record<string, any>
}

export default function BusquedaGlobalPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filtros
  const [filterTipo, setFilterTipo] = useState<'todos' | 'documento' | 'turnado' | 'inventario'>('todos')
  const [filterFechaInicio, setFilterFechaInicio] = useState('')
  const [filterFechaFin, setFilterFechaFin] = useState('')
  const [searchInOCR, setSearchInOCR] = useState(true)

  // Paginación
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const resultsPerPage = 20

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!searchTerm.trim()) return

    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      let allResults: SearchResult[] = []

      // Buscar en documentos entrantes
      if (filterTipo === 'todos' || filterTipo === 'documento') {
        const { data: docs } = await supabase
          .from('tbl_documento_entrante')
          .select(`
            id_documento,
            folio_interno,
            asunto,
            remitente_nombre,
            fecha_recepcion,
            texto_ocr,
            cat_valores_catalogo_prioridad:cat_valores_catalogo!tbl_documento_entrante_id_prioridad_fkey(valor)
          `)
          .or(searchInOCR
            ? `folio_interno.ilike.%${searchTerm}%,asunto.ilike.%${searchTerm}%,remitente_nombre.ilike.%${searchTerm}%,texto_ocr.ilike.%${searchTerm}%`
            : `folio_interno.ilike.%${searchTerm}%,asunto.ilike.%${searchTerm}%,remitente_nombre.ilike.%${searchTerm}%`
          )
          .limit(100)

        if (docs) {
          allResults.push(...docs.map(doc => ({
            tipo: 'documento' as const,
            id: doc.id_documento.toString(),
            titulo: doc.folio_interno,
            descripcion: doc.asunto,
            fecha: doc.fecha_recepcion,
            relevancia: calculateRelevance(searchTerm, doc.folio_interno, doc.asunto),
            metadata: {
              remitente: doc.remitente_nombre,
              prioridad: (doc.cat_valores_catalogo_prioridad as any)?.valor,
              tieneOCR: !!doc.texto_ocr
            }
          })))
        }
      }

      // Buscar en turnados
      if (filterTipo === 'todos' || filterTipo === 'turnado') {
        const { data: turnados } = await supabase
          .from('tbl_turnado')
          .select(`
            id_turnado,
            fecha_turnado,
            instrucciones,
            respuesta,
            tbl_documento_entrante!tbl_turnado_id_documento_fkey(folio_interno, asunto),
            cat_unidad_administrativa_origen:cat_unidad_administrativa!tbl_turnado_id_ua_origen_fkey(nombre_ua),
            cat_unidad_administrativa_destino:cat_unidad_administrativa!tbl_turnado_id_ua_destino_fkey(nombre_ua)
          `)
          .or(`instrucciones.ilike.%${searchTerm}%,respuesta.ilike.%${searchTerm}%`)
          .limit(100)

        if (turnados) {
          allResults.push(...turnados.map(t => ({
            tipo: 'turnado' as const,
            id: t.id_turnado.toString(),
            titulo: `Turnado - ${(t.tbl_documento_entrante as any)?.folio_interno || 'Sin folio'}`,
            descripcion: t.instrucciones || 'Sin instrucciones',
            fecha: t.fecha_turnado,
            relevancia: calculateRelevance(searchTerm, t.instrucciones || '', t.respuesta || ''),
            metadata: {
              origen: (t.cat_unidad_administrativa_origen as any)?.nombre_ua,
              destino: (t.cat_unidad_administrativa_destino as any)?.nombre_ua,
              respuesta: t.respuesta
            }
          })))
        }
      }

      // Buscar en inventario
      if (filterTipo === 'todos' || filterTipo === 'inventario') {
        const { data: items } = await supabase
          .from('tbl_inventario')
          .select(`
            id_inventario,
            numero_inventario,
            descripcion,
            marca,
            modelo,
            numero_serie,
            fecha_registro,
            cat_valores_catalogo_tipo:cat_valores_catalogo!tbl_inventario_id_tipo_bien_fkey(valor)
          `)
          .or(`numero_inventario.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,marca.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%,numero_serie.ilike.%${searchTerm}%`)
          .limit(100)

        if (items) {
          allResults.push(...items.map(item => ({
            tipo: 'inventario' as const,
            id: item.id_inventario.toString(),
            titulo: item.numero_inventario,
            descripcion: item.descripcion,
            fecha: item.fecha_registro,
            relevancia: calculateRelevance(searchTerm, item.numero_inventario, item.descripcion),
            metadata: {
              marca: item.marca,
              modelo: item.modelo,
              serie: item.numero_serie,
              tipo: (item.cat_valores_catalogo_tipo as any)?.valor
            }
          })))
        }
      }

      // Aplicar filtros de fecha
      if (filterFechaInicio) {
        allResults = allResults.filter(r => r.fecha >= filterFechaInicio)
      }
      if (filterFechaFin) {
        allResults = allResults.filter(r => r.fecha <= filterFechaFin)
      }

      // Ordenar por relevancia
      allResults.sort((a, b) => b.relevancia - a.relevancia)

      setTotalResults(allResults.length)
      setResults(allResults.slice((page - 1) * resultsPerPage, page * resultsPerPage))

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function calculateRelevance(searchTerm: string, ...fields: string[]): number {
    let score = 0
    const term = searchTerm.toLowerCase()

    fields.forEach(field => {
      const text = field?.toLowerCase() || ''

      // Coincidencia exacta: +10 puntos
      if (text === term) score += 10

      // Coincidencia al inicio: +5 puntos
      else if (text.startsWith(term)) score += 5

      // Contiene la palabra completa: +3 puntos
      else if (text.includes(` ${term} `) || text.includes(` ${term}`)) score += 3

      // Contiene parte de la palabra: +1 punto
      else if (text.includes(term)) score += 1
    })

    return score
  }

  function getTipoIcon(tipo: string) {
    switch (tipo) {
      case 'documento':
        return <FileText className="w-5 h-5 text-blue-600" />
      case 'turnado':
        return <Send className="w-5 h-5 text-purple-600" />
      case 'inventario':
        return <Package className="w-5 h-5 text-green-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  function getTipoBadge(tipo: string) {
    const styles = {
      'documento': 'bg-blue-100 text-blue-800 border-blue-300',
      'turnado': 'bg-purple-100 text-purple-800 border-purple-300',
      'inventario': 'bg-green-100 text-green-800 border-green-300'
    }
    return styles[tipo as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  function handleViewResult(result: SearchResult) {
    const routes = {
      'documento': `/dashboard/documentos/entrantes/${result.id}`,
      'turnado': `/dashboard/turnados`,
      'inventario': `/dashboard/inventario`
    }
    window.location.href = routes[result.tipo]
  }

  async function handleExportResults() {
    if (results.length === 0) return

    // Preparar datos para CSV
    const csvData = results.map(r => ({
      'Tipo': r.tipo,
      'Título': r.titulo,
      'Descripción': r.descripcion,
      'Fecha': new Date(r.fecha).toLocaleDateString('es-MX'),
      'Relevancia': r.relevancia
    }))

    // Convertir a CSV
    const headers = Object.keys(csvData[0]).join(',')
    const rows = csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    const csv = [headers, ...rows].join('\n')

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `busqueda_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const totalPages = Math.ceil(totalResults / resultsPerPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="w-8 h-8 text-blue-600" />
            Búsqueda Global
          </h1>
          <p className="text-gray-600 mt-1">
            Busca en documentos, turnados e inventario
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Main Search */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por folio, asunto, descripción, nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Buscar'
              )}
            </Button>
            {results.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleExportResults}
                icon={<Download />}
              >
                Exportar
              </Button>
            )}
          </div>

          {/* Toggle Filters */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <Filter className="w-4 h-4" />
            Filtros avanzados
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de resultado
                </label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="documento">Documentos</option>
                  <option value="turnado">Turnados</option>
                  <option value="inventario">Inventario</option>
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

              {/* Buscar en OCR */}
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchInOCR}
                    onChange={(e) => setSearchInOCR(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Buscar en texto OCR
                  </span>
                </label>
              </div>
            </div>
          )}
        </form>

        {/* Results Count */}
        {totalResults > 0 && (
          <div className="text-sm text-gray-600 pt-4 border-t">
            Se encontraron <span className="font-medium">{totalResults}</span> resultados
            {searchInOCR && ' (incluyendo búsqueda en texto OCR)'}
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <div
                key={`${result.tipo}-${result.id}-${index}`}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewResult(result)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getTipoIcon(result.tipo)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {result.titulo}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 mb-2 line-clamp-2">
                          {result.descripcion}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(result.fecha).toLocaleDateString('es-MX')}
                          </span>

                          {result.metadata.remitente && (
                            <span>Remitente: {result.metadata.remitente}</span>
                          )}
                          {result.metadata.origen && (
                            <span>De: {result.metadata.origen}</span>
                          )}
                          {result.metadata.destino && (
                            <span>Para: {result.metadata.destino}</span>
                          )}
                          {result.metadata.marca && (
                            <span>{result.metadata.marca} {result.metadata.modelo}</span>
                          )}
                          {result.metadata.tieneOCR && (
                            <span className="text-blue-600 font-medium">📄 Texto OCR disponible</span>
                          )}
                        </div>
                      </div>

                      {/* Badge & Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTipoBadge(result.tipo)}`}>
                          {result.tipo.charAt(0).toUpperCase() + result.tipo.slice(1)}
                        </span>
                        {result.relevancia > 5 && (
                          <span className="text-xs text-green-600 font-medium">
                            ⭐ Alta relevancia
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewResult(result)
                    }}
                    className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPage(page - 1)
                    handleSearch()
                  }}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPage(page + 1)
                    handleSearch()
                  }}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && searchTerm && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-gray-600">
            Intenta con otros términos de búsqueda o ajusta los filtros
          </p>
        </div>
      )}

      {/* Initial State */}
      {!searchTerm && results.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Comienza tu búsqueda
          </h3>
          <p className="text-gray-600 mb-6">
            Ingresa un término para buscar en documentos, turnados e inventario
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              Folios
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              Asuntos
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              Remitentes
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              Números de inventario
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              Marcas y modelos
            </span>
            {searchInOCR && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                ✓ Texto OCR
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
