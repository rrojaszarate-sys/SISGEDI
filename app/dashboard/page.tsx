/**
 * Página Dashboard - Vista principal del sistema
 * Muestra estadísticas y accesos rápidos
 */

import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { FileText, Send, Folder, Package, TrendingUp, Clock } from 'lucide-react'

export const metadata = {
  title: 'Dashboard - SISGEDI 2.0',
  description: 'Panel de control del Sistema de Gestión de Documentación Integral',
}

async function getStats() {
  const supabase = await createClient()

  // Obtener estadísticas
  const [docsEntrantes, docsSalientes, turnados, inventario] = await Promise.all([
    supabase.from('tbl_documento_entrante').select('id_doc_entrante', { count: 'exact', head: true }),
    supabase.from('tbl_documento_saliente').select('id_doc_saliente', { count: 'exact', head: true }),
    supabase.from('tbl_turnado').select('id_turnado', { count: 'exact', head: true }),
    supabase.from('tbl_inventario').select('id_inventario', { count: 'exact', head: true }),
  ])

  return {
    docsEntrantes: docsEntrantes.count || 0,
    docsSalientes: docsSalientes.count || 0,
    turnados: turnados.count || 0,
    inventario: inventario.count || 0,
  }
}

async function getRecentDocs() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tbl_documento_entrante')
    .select(`
      id_doc_entrante,
      folio_interno,
      asunto,
      fecha_registro,
      estatus,
      cat_valores_catalogo!tbl_documento_entrante_id_prioridad_fkey (
        valor
      )
    `)
    .order('fecha_registro', { ascending: false })
    .limit(5)

  return data || []
}

export default async function DashboardPage() {
  const stats = await getStats()
  const recentDocs = await getRecentDocs()

  const cards = [
    {
      title: 'Docs. Entrantes',
      value: stats.docsEntrantes,
      icon: FileText,
      color: 'blue',
      href: '/dashboard/documentos/entrantes',
    },
    {
      title: 'Docs. Salientes',
      value: stats.docsSalientes,
      icon: Send,
      color: 'green',
      href: '/dashboard/documentos/salientes',
    },
    {
      title: 'Turnados',
      value: stats.turnados,
      icon: Folder,
      color: 'yellow',
      href: '/dashboard/turnados',
    },
    {
      title: 'Inventario',
      value: stats.inventario,
      icon: Package,
      color: 'purple',
      href: '/dashboard/inventario',
    },
  ]

  return (
    <>
      <Header title="Dashboard" />

      <div className="p-6">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <a
                key={card.title}
                href={card.href}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </a>
            )
          })}
        </div>

        {/* Documentos recientes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Documentos Recientes</h2>
            <a href="/dashboard/documentos/entrantes" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todos →
            </a>
          </div>

          <div className="space-y-4">
            {recentDocs.map((doc: any) => (
              <div
                key={doc.id_doc_entrante}
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{doc.folio_interno}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      doc.cat_valores_catalogo?.valor === 'Urgente'
                        ? 'bg-red-100 text-red-700'
                        : doc.cat_valores_catalogo?.valor === 'Alta'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {doc.cat_valores_catalogo?.valor || 'Normal'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{doc.asunto}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(doc.fecha_registro).toLocaleDateString('es-MX')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      doc.estatus === 'Registrado'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {doc.estatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {recentDocs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay documentos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
