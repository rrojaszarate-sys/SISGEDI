/**
 * Página de Administración de Catálogos de Valores
 * Gestión CRUD de cat_valores_catalogo (Prioridades, Tipos de Documento, etc.)
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
import { Plus, Edit, Trash2, Database } from 'lucide-react'

interface CatalogoValor {
  id_valor_catalogo: string
  tipo_catalogo: string
  valor: string
  descripcion: string | null
  es_modificable: boolean
  estatus: boolean
  fecha_creacion: string
}

export default function CatalogosValoresPage() {
  const [valores, setValores] = useState<CatalogoValor[]>([])
  const [filteredValores, setFilteredValores] = useState<CatalogoValor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedValor, setSelectedValor] = useState<CatalogoValor | null>(null)
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [tiposCatalogo, setTiposCatalogo] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Formulario
  const [formData, setFormData] = useState({
    tipo_catalogo: '',
    valor: '',
    descripcion: '',
    es_modificable: true,
    estatus: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (tipoFilter === 'all') {
      setFilteredValores(valores)
    } else {
      setFilteredValores(valores.filter(v => v.tipo_catalogo === tipoFilter))
    }
  }, [tipoFilter, valores])

  async function loadData() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .order('tipo_catalogo', { ascending: true })
        .order('valor', { ascending: true })

      if (error) throw error

      setValores(data || [])
      setFilteredValores(data || [])

      // Extraer tipos únicos
      const tipos = Array.from(new Set(data?.map(v => v.tipo_catalogo) || []))
      setTiposCatalogo(tipos)
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

      if (selectedValor) {
        // Actualizar
        const { error } = await supabase
          .from('cat_valores_catalogo')
          .update(formData)
          .eq('id_valor_catalogo', selectedValor.id_valor_catalogo)

        if (error) throw error
        setSuccess('Catálogo actualizado correctamente')
      } else {
        // Crear
        const { error } = await supabase
          .from('cat_valores_catalogo')
          .insert([formData])

        if (error) throw error
        setSuccess('Catálogo creado correctamente')
      }

      setIsModalOpen(false)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!selectedValor) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('cat_valores_catalogo')
        .delete()
        .eq('id_valor_catalogo', selectedValor.id_valor_catalogo)

      if (error) throw error

      setSuccess('Catálogo eliminado correctamente')
      setIsDeleteModalOpen(false)
      setSelectedValor(null)
      loadData()
    } catch (err: any) {
      setError(err.message)
      setIsDeleteModalOpen(false)
    }
  }

  function openCreateModal() {
    resetForm()
    setSelectedValor(null)
    setIsModalOpen(true)
  }

  function openEditModal(valor: CatalogoValor) {
    setSelectedValor(valor)
    setFormData({
      tipo_catalogo: valor.tipo_catalogo,
      valor: valor.valor,
      descripcion: valor.descripcion || '',
      es_modificable: valor.es_modificable,
      estatus: valor.estatus,
    })
    setIsModalOpen(true)
  }

  function openDeleteModal(valor: CatalogoValor) {
    setSelectedValor(valor)
    setIsDeleteModalOpen(true)
  }

  function resetForm() {
    setFormData({
      tipo_catalogo: '',
      valor: '',
      descripcion: '',
      es_modificable: true,
      estatus: true,
    })
  }

  const columns = [
    {
      key: 'tipo_catalogo',
      label: 'Tipo de Catálogo',
      render: (item: CatalogoValor) => (
        <span className="font-medium text-gray-900">{item.tipo_catalogo}</span>
      ),
    },
    {
      key: 'valor',
      label: 'Valor',
      render: (item: CatalogoValor) => (
        <span className="text-gray-700">{item.valor}</span>
      ),
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (item: CatalogoValor) => (
        <span className="text-gray-600">{item.descripcion || '-'}</span>
      ),
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (item: CatalogoValor) => (
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
        title="Catálogos de Valores"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administración', href: '/dashboard/admin' },
          { label: 'Catálogos de Valores' },
        ]}
      />

      <div className="p-6">
        {/* Alertas */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              {tiposCatalogo.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600">
              {filteredValores.length} registro(s)
            </span>
          </div>

          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Catálogo
          </Button>
        </div>

        {/* Tabla */}
        <Table
          data={filteredValores}
          columns={columns}
          keyExtractor={(item) => item.id_valor_catalogo}
          isLoading={isLoading}
          emptyMessage="No hay catálogos registrados"
          actions={(item) => (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditModal(item)}
                disabled={!item.es_modificable}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openDeleteModal(item)}
                disabled={!item.es_modificable}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
        />

        {/* Modal de Crear/Editar */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedValor ? 'Editar Catálogo' : 'Nuevo Catálogo'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tipo de Catálogo"
              value={formData.tipo_catalogo}
              onChange={(e) => setFormData({ ...formData, tipo_catalogo: e.target.value })}
              required
              placeholder="Ej: Prioridad, Tipo Documento"
              helperText="Agrupa valores del mismo tipo"
            />

            <Input
              label="Valor"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
              placeholder="Ej: Urgente, Alta, Media"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción opcional del catálogo"
              />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.es_modificable}
                  onChange={(e) => setFormData({ ...formData, es_modificable: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Es modificable</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.estatus}
                  onChange={(e) => setFormData({ ...formData, estatus: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Activo</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {selectedValor ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de Confirmación de Eliminación */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Eliminar Catálogo"
          message={`¿Está seguro de eliminar el catálogo "${selectedValor?.valor}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          type="danger"
        />
      </div>
    </>
  )
}
