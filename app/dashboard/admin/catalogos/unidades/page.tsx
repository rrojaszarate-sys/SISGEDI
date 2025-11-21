/**
 * Página de Administración de Unidades Administrativas
 * Gestión CRUD de cat_unidad_administrativa con jerarquía visual
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
import { Plus, Edit, Trash2, Building2, ChevronRight } from 'lucide-react'

interface UnidadAdministrativa {
  id_ua: string
  nombre_ua: string
  codigo_ua: string | null
  nivel_jerarquico: number
  id_ua_superior: string | null
  estatus: boolean
  direccion: string | null
  telefono: string | null
  extension: string | null
  ua_superior?: { nombre_ua: string }
}

export default function UnidadesAdministrativasPage() {
  const [unidades, setUnidades] = useState<UnidadAdministrativa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUA, setSelectedUA] = useState<UnidadAdministrativa | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre_ua: '',
    codigo_ua: '',
    nivel_jerarquico: 1,
    id_ua_superior: '',
    direccion: '',
    telefono: '',
    extension: '',
    estatus: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cat_unidad_administrativa')
        .select(`
          *,
          ua_superior:cat_unidad_administrativa!cat_unidad_administrativa_id_ua_superior_fkey(nombre_ua)
        `)
        .order('nivel_jerarquico', { ascending: true })
        .order('nombre_ua', { ascending: true })

      if (error) throw error

      // Convertir ua_superior de array a objeto
      const processedData = data?.map(ua => ({
        ...ua,
        ua_superior: Array.isArray(ua.ua_superior) && ua.ua_superior.length > 0
          ? ua.ua_superior[0]
          : null
      }))

      setUnidades(processedData || [])
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
        id_ua_superior: formData.id_ua_superior || null,
      }

      if (selectedUA) {
        const { error } = await supabase
          .from('cat_unidad_administrativa')
          .update(dataToSave)
          .eq('id_ua', selectedUA.id_ua)

        if (error) throw error
        setSuccess('Unidad Administrativa actualizada correctamente')
      } else {
        const { error } = await supabase
          .from('cat_unidad_administrativa')
          .insert([dataToSave])

        if (error) throw error
        setSuccess('Unidad Administrativa creada correctamente')
      }

      setIsModalOpen(false)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!selectedUA) return

    try {
      const supabase = createClient()

      // Verificar si tiene UAs dependientes
      const { data: dependientes } = await supabase
        .from('cat_unidad_administrativa')
        .select('id_ua')
        .eq('id_ua_superior', selectedUA.id_ua)
        .limit(1)

      if (dependientes && dependientes.length > 0) {
        setError('No se puede eliminar la UA porque tiene unidades subordinadas')
        setIsDeleteModalOpen(false)
        return
      }

      const { error } = await supabase
        .from('cat_unidad_administrativa')
        .delete()
        .eq('id_ua', selectedUA.id_ua)

      if (error) throw error

      setSuccess('Unidad Administrativa eliminada correctamente')
      setIsDeleteModalOpen(false)
      setSelectedUA(null)
      loadData()
    } catch (err: any) {
      setError(err.message)
      setIsDeleteModalOpen(false)
    }
  }

  function openCreateModal() {
    resetForm()
    setSelectedUA(null)
    setIsModalOpen(true)
  }

  function openEditModal(ua: UnidadAdministrativa) {
    setSelectedUA(ua)
    setFormData({
      nombre_ua: ua.nombre_ua,
      codigo_ua: ua.codigo_ua || '',
      nivel_jerarquico: ua.nivel_jerarquico,
      id_ua_superior: ua.id_ua_superior || '',
      direccion: ua.direccion || '',
      telefono: ua.telefono || '',
      extension: ua.extension || '',
      estatus: ua.estatus,
    })
    setIsModalOpen(true)
  }

  function openDeleteModal(ua: UnidadAdministrativa) {
    setSelectedUA(ua)
    setIsDeleteModalOpen(true)
  }

  function resetForm() {
    setFormData({
      nombre_ua: '',
      codigo_ua: '',
      nivel_jerarquico: 1,
      id_ua_superior: '',
      direccion: '',
      telefono: '',
      extension: '',
      estatus: true,
    })
  }

  const columns = [
    {
      key: 'nombre_ua',
      label: 'Unidad Administrativa',
      render: (item: UnidadAdministrativa) => (
        <div className="flex items-center space-x-2">
          <div style={{ marginLeft: `${(item.nivel_jerarquico - 1) * 20}px` }} className="flex items-center space-x-2">
            {item.nivel_jerarquico > 1 && <ChevronRight className="h-4 w-4 text-gray-400" />}
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{item.nombre_ua}</p>
              {item.codigo_ua && (
                <p className="text-xs text-gray-500">{item.codigo_ua}</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'nivel_jerarquico',
      label: 'Nivel',
      render: (item: UnidadAdministrativa) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          Nivel {item.nivel_jerarquico}
        </span>
      ),
    },
    {
      key: 'ua_superior',
      label: 'UA Superior',
      render: (item: UnidadAdministrativa) => (
        <span className="text-sm text-gray-600">
          {item.ua_superior?.nombre_ua || 'Raíz'}
        </span>
      ),
    },
    {
      key: 'telefono',
      label: 'Contacto',
      render: (item: UnidadAdministrativa) => (
        <div className="text-sm text-gray-600">
          {item.telefono && <div>{item.telefono}</div>}
          {item.extension && <div className="text-xs">Ext. {item.extension}</div>}
        </div>
      ),
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (item: UnidadAdministrativa) => (
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
        title="Unidades Administrativas"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administración', href: '/dashboard/admin' },
          { label: 'Unidades Administrativas' },
        ]}
      />

      <div className="p-6">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-600">{unidades.length} unidad(es)</span>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Unidad Administrativa
          </Button>
        </div>

        <Table
          data={unidades}
          columns={columns}
          keyExtractor={(item) => item.id_ua}
          loading={isLoading}
          emptyMessage="No hay unidades administrativas registradas"
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
          title={selectedUA ? 'Editar Unidad Administrativa' : 'Nueva Unidad Administrativa'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre de la UA"
                value={formData.nombre_ua}
                onChange={(e) => setFormData({ ...formData, nombre_ua: e.target.value })}
                required
                placeholder="Ej: Dirección General de..."
              />

              <Input
                label="Código de UA"
                value={formData.codigo_ua}
                onChange={(e) => setFormData({ ...formData, codigo_ua: e.target.value })}
                placeholder="Ej: SS-DG-001"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel Jerárquico <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.nivel_jerarquico}
                  onChange={(e) => setFormData({ ...formData, nivel_jerarquico: parseInt(e.target.value) })}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Nivel 1 (Raíz)</option>
                  <option value={2}>Nivel 2 (Subsecretaría)</option>
                  <option value={3}>Nivel 3 (Dirección General)</option>
                  <option value={4}>Nivel 4 (Dirección de Área)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UA Superior
                </label>
                <select
                  value={formData.id_ua_superior}
                  onChange={(e) => setFormData({ ...formData, id_ua_superior: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formData.nivel_jerarquico === 1}
                >
                  <option value="">Sin UA superior (Raíz)</option>
                  {unidades
                    .filter(ua => ua.nivel_jerarquico < formData.nivel_jerarquico && ua.id_ua !== selectedUA?.id_ua)
                    .map(ua => (
                      <option key={ua.id_ua} value={ua.id_ua}>
                        {ua.nombre_ua}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <Input
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Dirección física"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="5555-1234"
              />

              <Input
                label="Extensión"
                value={formData.extension}
                onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                placeholder="1234"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.estatus}
                onChange={(e) => setFormData({ ...formData, estatus: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Activa</span>
            </label>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedUA ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Eliminar Unidad Administrativa"
          message={`¿Está seguro de eliminar "${selectedUA?.nombre_ua}"?`}
          confirmText="Eliminar"
          type="danger"
        />
      </div>
    </>
  )
}
