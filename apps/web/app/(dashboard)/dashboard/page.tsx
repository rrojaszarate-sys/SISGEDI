import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Métricas de ejemplo (hardcoded por ahora)
  const stats = [
    {
      name: 'Total Documentos',
      value: '0',
      icon: '📄',
      change: '+0%',
    },
    {
      name: 'Trámites Pendientes',
      value: '0',
      icon: '📮',
      change: '0',
    },
    {
      name: 'Completados Hoy',
      value: '0',
      icon: '✅',
      change: '+0',
    },
    {
      name: 'Promedio Respuesta',
      value: '0h',
      icon: '⏱️',
      change: '-0%',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user?.email}
        </h2>
        <p className="text-muted-foreground">
          Sistema de Gestión Documental y Expedientes Digitales Inteligente
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.change} vs. mes anterior</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-md border p-3">
              <span className="text-2xl">📄</span>
              <div className="flex-1">
                <p className="font-medium">Sistema configurado</p>
                <p className="text-sm text-gray-500">Hace unos momentos</p>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 py-4">
              No hay más actividad reciente
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Trámites Urgentes</h3>
          <div className="text-center text-sm text-gray-500 py-8">
            No hay trámites urgentes
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-blue-50 p-6">
          <h4 className="text-lg font-semibold">🤖 IA Avanzada</h4>
          <p className="mt-2 text-sm text-gray-700">
            OCR con 98%+ precisión, NLP avanzado y ML predictivo
          </p>
        </div>
        <div className="rounded-lg border bg-green-50 p-6">
          <h4 className="text-lg font-semibold">🔒 Compliance Total</h4>
          <p className="mt-2 text-sm text-gray-700">
            ISO 15489, NIST, WCAG 2.2 AA, GDPR/CCPA
          </p>
        </div>
        <div className="rounded-lg border bg-purple-50 p-6">
          <h4 className="text-lg font-semibold">🚀 Blockchain</h4>
          <p className="mt-2 text-sm text-gray-700">
            Notarización inmutable y verificable públicamente
          </p>
        </div>
      </div>
    </div>
  )
}
