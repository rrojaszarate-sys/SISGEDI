import { Card, CardHeader, CardBody } from '@nextui-org/react'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const { userProfile } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Bienvenido, {userProfile?.nombre_completo}
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documentos"
          value="0"
          icon={<FileText size={24} />}
          color="blue"
        />
        <StatCard
          title="Pendientes"
          value="0"
          icon={<Clock size={24} />}
          color="yellow"
        />
        <StatCard
          title="Completados"
          value="0"
          icon={<CheckCircle size={24} />}
          color="green"
        />
        <StatCard
          title="Por Vencer"
          value="0"
          icon={<AlertCircle size={24} />}
          color="red"
        />
      </div>

      {/* Contenido principal */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Documentos Recientes</h2>
        </CardHeader>
        <CardBody>
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No hay documentos para mostrar</p>
            <p className="text-sm mt-2">
              Los documentos aparecerán aquí una vez que comience a utilizarlos
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'yellow' | 'green' | 'red'
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
              {value}
            </p>
          </div>
          <div className={`${colorClasses[color]} p-3 rounded-lg text-white`}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
