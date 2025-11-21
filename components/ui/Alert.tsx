/**
 * Componente Alert - Mensajes de alerta reutilizables
 * Soporta diferentes tipos de alertas
 */

import { clsx } from 'clsx'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

export function Alert({ type = 'info', title, message, onClose }: AlertProps) {
  const Icon = icons[type]

  return (
    <div
      className={clsx(
        'rounded-lg p-4 border',
        {
          'bg-green-50 border-green-200': type === 'success',
          'bg-red-50 border-red-200': type === 'error',
          'bg-yellow-50 border-yellow-200': type === 'warning',
          'bg-blue-50 border-blue-200': type === 'info',
        }
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon
            className={clsx('h-5 w-5', {
              'text-green-600': type === 'success',
              'text-red-600': type === 'error',
              'text-yellow-600': type === 'warning',
              'text-blue-600': type === 'info',
            })}
          />
        </div>

        <div className="ml-3 flex-1">
          {title && (
            <h3
              className={clsx('text-sm font-medium', {
                'text-green-800': type === 'success',
                'text-red-800': type === 'error',
                'text-yellow-800': type === 'warning',
                'text-blue-800': type === 'info',
              })}
            >
              {title}
            </h3>
          )}
          <p
            className={clsx('text-sm', {
              'text-green-700': type === 'success',
              'text-red-700': type === 'error',
              'text-yellow-700': type === 'warning',
              'text-blue-700': type === 'info',
              'mt-1': title,
            })}
          >
            {message}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={clsx('ml-3 flex-shrink-0 rounded-md hover:opacity-70', {
              'text-green-600': type === 'success',
              'text-red-600': type === 'error',
              'text-yellow-600': type === 'warning',
              'text-blue-600': type === 'info',
            })}
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
