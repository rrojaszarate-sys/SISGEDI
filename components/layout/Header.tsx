/**
 * Componente Header - Encabezado de la aplicación
 * Muestra breadcrumbs y acciones rápidas
 */

'use client'

import { Bell, Search, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  title: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function Header({ title, breadcrumbs }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Título y breadcrumbs */}
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-700">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="sm">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
