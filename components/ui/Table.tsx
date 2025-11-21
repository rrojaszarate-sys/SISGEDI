/**
 * Componente Table - Tabla reutilizable con acciones
 * Soporta ordenamiento, paginación y acciones por fila
 */

'use client'

import { clsx } from 'clsx'
import React from 'react'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface Action<T> {
  label: string
  icon?: React.ReactNode
  onClick: (item: T) => void
  variant?: 'default' | 'ghost' | 'danger'
  disabled?: (item: T) => boolean
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor?: (item: T) => string | number
  onRowClick?: (item: T) => void
  actions?: Action<T>[]
  emptyMessage?: string
  loading?: boolean
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor = (item: T) => (item.id_doc_entrante || item.id || item.id_item || item.id_valor || item.id_rol || item.id_ua || String(Math.random())),
  onRowClick,
  actions,
  emptyMessage = 'No hay datos para mostrar',
  loading = false,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="bg-gray-50 border-b border-gray-200 h-12"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-gray-200 h-16"></div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={clsx(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50'
                )}
              >
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={clsx(
                      'px-6 py-4 whitespace-nowrap text-sm',
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as any)[column.key] ?? '')}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {actions.map((action, actionIndex) => {
                        const isDisabled = action.disabled?.(item) || false
                        return (
                          <button
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!isDisabled) {
                                action.onClick(item)
                              }
                            }}
                            disabled={isDisabled}
                            className={clsx(
                              'inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                              {
                                'text-gray-700 hover:bg-gray-100': action.variant === 'ghost' && !isDisabled,
                                'text-red-700 hover:bg-red-50': action.variant === 'danger' && !isDisabled,
                                'text-blue-700 hover:bg-blue-50': action.variant === 'default' && !isDisabled,
                                'text-gray-400 cursor-not-allowed': isDisabled,
                              }
                            )}
                            title={action.label}
                          >
                            {action.icon}
                            <span className="sr-only">{action.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
