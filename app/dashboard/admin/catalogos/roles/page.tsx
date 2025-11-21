/**
 * Página de Administración de Roles
 * Gestión CRUD de cat_roles con permisos de menú editables
 */

'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Shield } from 'lucide-react'

interface Rol {
  id_rol: string
  nombre_rol: string
  descripcion: string | null
  elementos_menu: string[]
  estatus: boolean
  fecha_creacion: string
}

const opcionesMenu = [
  'dashboard',
  'documentos',
  'turnados',
  'inventario',
  'busqueda',
  'notificaciones',
  'usuarios',
  'reportes',
  'configuracion',
  'auditoria',
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre_rol: '',
    descripcion: '',
    elementos_menu: [] as string[],
    estatus: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cat_roles')
        .select('*')
        .order('nombre_rol', { ascending: true })

      if (error) throw error
      setRoles(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const dataToSave = {
        ...formData,
        elementos_menu: formData.elementos_menu,
      }

      if (selectedRol) {
        const { error } = await supabase
          .from('cat_roles')
          .update(dataToSave)
          .eq('id_rol', selectedRol.id_rol)

        if (error) throw error
        setSuccess('Rol actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('cat_roles')
          .insert([dataToSave])

        if (error) throw error
        setSuccess('Rol creado correctamente')
      }

      setIsModalOpen(false)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!selectedRol) return

    try {
      const supabase = createClient()

      // Verificar si hay usuarios con este rol
      const { data: usuarios } = await supabase
        .from('tbl_usuarios')
        .select('id_usuario')
        .eq('id_rol', selectedRol.id_rol)
        .limit(1)

      if (usuarios && usuarios.length > 0) {
        setError('No se puede eliminar el rol porque tiene usuarios asignados')
        setIsDeleteModalOpen(false)
        return
      }

      const { error } = await supabase
        .from('cat_roles')
        .delete()
        .eq('id_rol', selectedRol.id_rol)

      if (error) throw error

      setSuccess('Rol eliminado correctamente')
      setIsDeleteModalOpen(false)
      setSelectedRol(null)
      loadData()
    } catch (err: any) {
      setError(err.message)
      setIsDeleteModalOpen(false)
    }
  }

  function openCreateModal() {
    resetForm()
    setSelectedRol(null)
    setIsModalOpen(true)
  }

  function openEditModal(rol: Rol) {
    setSelectedRol(rol)
    setFormData({
      nombre_rol: rol.nombre_rol,
      descripcion: rol.descripcion || '',
      elementos_menu: Array.isArray(rol.elementos_menu) ? rol.elementos_menu : [],
      estatus: rol.estatus,
    })
    setIsModalOpen(true)
  }

  function openDeleteModal(rol: Rol) {
    setSelectedRol(rol)
    setIsDeleteModalOpen(true)
  }

  function resetForm() {
    setFormData({
      nombre_rol: '',
      descripcion: '',
      elementos_menu: [],
      estatus: true,
    })
  }

  function toggleMenuOption(option: string) {
    setFormData(prev => ({
      ...prev,
      elementos_menu: prev.elementos_menu.includes(option)
        ? prev.elementos_menu.filter(m => m !== option)
        : [...prev.elementos_menu, option]
    }))
  }

  const columns = [
    {
      key: 'nombre_rol',
      label: 'Nombre del Rol',
      render: (item: Rol) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">{item.nombre_rol}</span>
        </div>
      ),
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (item: Rol) => (
        <span className="text-gray-600">{item.descripcion || '-'}</span>
      ),
    },
    {
      key: 'elementos_menu',
      label: 'Permisos de Menú',
      render: (item: Rol) => {
        const menus = Array.isArray(item.elementos_menu) ? item.elementos_menu : []
        return (
          <div className="flex flex-wrap gap-1">
            {menus.slice(0, 3).map(menu => (
              <span key={menu} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {menu}
              </span>
            ))}
            {menus.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                +{menus.length - 3} más
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (item: Rol) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          item.estatus
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {item.estatus ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  return (
    <>
      <Header
        title="Roles y Permisos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administración', href: '/dashboard/admin' },
          { label: 'Roles y Permisos' },
        ]}
      />

      <div className="p-6">
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        )}

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-600">{roles.length} rol(es)</span>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Rol
          </Button>
        </div>

        <Table
          data={roles}
          columns={columns}
          keyExtractor={(item) => item.id_rol}
          loading={isLoading}
          emptyMessage="No hay roles registrados"
          actions={[
            {
              label: 'Editar',
              icon: <Edit className="h-4 w-4" />,
              onClick: openEditModal,
              variant: 'ghost' as const
            },
            {
              label: 'Eliminar',
              icon: <Trash2 className="h-4 w-4 text-red-600" />,
              onClick: openDeleteModal,
              variant: 'ghost' as const
            }
          ]}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedRol ? 'Editar Rol' : 'Nuevo Rol'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre del Rol"
              value={formData.nombre_rol}
              onChange={(e) => setFormData({ ...formData, nombre_rol: e.target.value })}
              required
              placeholder="Ej: Administrador General"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={2}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del rol"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permisos de Menú
              </label>
              <div className="grid grid-cols-2 gap-3">
                {opcionesMenu.map(opcion => (
                  <label
                    key={opcion}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.elementos_menu.includes(opcion)}
                      onChange={() => toggleMenuOption(opcion)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{opcion}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.estatus}
                onChange={(e) => setFormData({ ...formData, estatus: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Activo</span>
            </label>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedRol ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Eliminar Rol"
          message={`¿Está seguro de eliminar el rol "${selectedRol?.nombre_rol}"?`}
          confirmText="Eliminar"
          type="danger"
        />
      </div>
    </>
  )
}
