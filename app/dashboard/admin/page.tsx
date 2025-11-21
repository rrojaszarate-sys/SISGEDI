/**
 * Página de Administración - Vista principal
 * Muestra acceso a todos los módulos de administración
 */

import { Header } from '@/components/layout/Header'
import { Database, Users, Building2, FileText, Settings } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Administración - SISGEDI 2.0',
  description: 'Panel de administración del sistema',
}

const adminModules = [
  {
    title: 'Catálogos del Sistema',
    description: 'Administrar catálogos de valores (Prioridades, Tipos de Documento, etc.)',
    icon: Database,
    href: '/dashboard/admin/catalogos/valores',
    color: 'blue',
  },
  {
    title: 'Roles y Permisos',
    description: 'Gestionar roles de usuario y sus permisos de acceso',
    icon: Users,
    href: '/dashboard/admin/catalogos/roles',
    color: 'green',
  },
  {
    title: 'Unidades Administrativas',
    description: 'Administrar la estructura organizacional y jerarquía',
    icon: Building2,
    href: '/dashboard/admin/catalogos/unidades',
    color: 'purple',
  },
  {
    title: 'Usuarios del Sistema',
    description: 'Gestionar usuarios, asignación de roles y UAs',
    icon: FileText,
    href: '/dashboard/admin/usuarios',
    color: 'yellow',
  },
  {
    title: 'Configuración General',
    description: 'Ajustes y parámetros del sistema',
    icon: Settings,
    href: '/dashboard/admin/configuracion',
    color: 'gray',
  },
]

export default function AdminPage() {
  return (
    <>
      <Header
        title="Administración"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administración' },
        ]}
      />

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h2>
          <p className="text-gray-600">
            Gestiona catálogos, usuarios y configuraciones del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => {
            const Icon = module.icon
            return (
              <Link
                key={module.href}
                href={module.href}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all group"
              >
                <div className={`w-14 h-14 bg-${module.color}-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-7 w-7 text-${module.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
