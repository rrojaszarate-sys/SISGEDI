'use client'

/**
 * Módulo de Inventario
 * Gestión completa de bienes muebles e inmuebles
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  QrCode,
  Download,
  Upload,
  Building,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react'
import type { Database } from '@/types/database'

type InventarioItem = Database['public']['Tables']['tbl_inventario']['Row'] & {
  cat_unidad_administrativa?: { nombre_ua: string; codigo_ua: string }
  tbl_usuarios_responsable?: { nombre_completo: string }
  tbl_usuarios_resguardo?: { nombre_completo: string | null }
  cat_valores_catalogo_tipo?: { valor: string }
  cat_valores_catalogo_estado?: { valor: string }
}

type FormData = Omit<Database['public']['Tables']['tbl_inventario']['Insert'], 'id_inventario' | 'fecha_registro' | 'id_usuario_registro'>

export default function InventarioPage() {
  const [items, setItems] = useState<InventarioItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('')
  const [filterEstado, setFilterEstado] = useState<string>('')
  const [filterUA, setFilterUA] = useState<string>('')

  // Catálogos
  const [tiposInventario, setTiposInventario] = useState<any[]>([])
  const [estadosInventario, setEstadosInventario] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])

  // Form data
  const [formData, setFormData] = useState<FormData>({
    numero_inventario: '',
    descripcion: '',
    marca: null,
    modelo: null,
    numero_serie: null,
    id_tipo_bien: 0,
    estado_conservacion: 0,
    id_ua_asignada: 0,
    id_usuario_responsable: null,
    id_usuario_resguardo: null,
    ubicacion_fisica: null,
    fecha_adquisicion: null,
    valor_adquisicion: null,
    numero_factura: null,
    proveedor: null,
    observaciones: null,
    foto_url: null,
    qr_code: null,
    activo: true
  })

  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null)

  useEffect(() => {
    loadData()
    loadCatalogos()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, filterTipo, filterEstado, filterUA, items])

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('tbl_inventario')
        .select(`
          *,
          cat_unidad_administrativa!tbl_inventario_id_ua_asignada_fkey(nombre_ua, codigo_ua),
          tbl_usuarios_responsable:tbl_usuarios!tbl_inventario_id_usuario_responsable_fkey(nombre_completo),
          tbl_usuarios_resguardo:tbl_usuarios!tbl_inventario_id_usuario_resguardo_fkey(nombre_completo),
          cat_valores_catalogo_tipo:cat_valores_catalogo!tbl_inventario_id_tipo_bien_fkey(valor),
          cat_valores_catalogo_estado:cat_valores_catalogo!tbl_inventario_estado_conservacion_fkey(valor)
        `)
        .order('numero_inventario', { ascending: true })

      if (fetchError) throw fetchError

      setItems(data || [])
      setFilteredItems(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalogos() {
    try {
      const supabase = createClient()

      // Cargar tipos de bien
      const { data: tiposData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Tipo Bien')
        .eq('activo', true)
        .order('valor', { ascending: true })

      setTiposInventario(tiposData || [])

      // Cargar estados de conservación
      const { data: estadosData } = await supabase
        .from('cat_valores_catalogo')
        .select('*')
        .eq('tipo_catalogo', 'Estado Conservación')
        .eq('activo', true)
        .order('orden', { ascending: true })

      setEstadosInventario(estadosData || [])

      // Cargar unidades administrativas
      const { data: uaData } = await supabase
        .from('cat_unidad_administrativa')
        .select('*')
        .eq('activa', true)
        .order('nombre_ua', { ascending: true })

      setUnidades(uaData || [])

      // Cargar usuarios
      const { data: usersData } = await supabase
        .from('tbl_usuarios')
        .select('id_usuario, nombre_completo, id_ua')
        .eq('estatus', 'Activo')
        .order('nombre_completo', { ascending: true })

      setUsuarios(usersData || [])

    } catch (err: any) {
      console.error('Error loading catalogs:', err)
    }
  }

  function applyFilters() {
    let filtered = [...items]

    // Búsqueda por texto
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.numero_inventario.toLowerCase().includes(search) ||
        item.descripcion.toLowerCase().includes(search) ||
        item.marca?.toLowerCase().includes(search) ||
        item.modelo?.toLowerCase().includes(search) ||
        item.numero_serie?.toLowerCase().includes(search)
      )
    }

    // Filtro por tipo
    if (filterTipo) {
      filtered = filtered.filter(item => item.id_tipo_bien === parseInt(filterTipo))
    }

    // Filtro por estado
    if (filterEstado) {
      filtered = filtered.filter(item => item.estado_conservacion === parseInt(filterEstado))
    }

    // Filtro por UA
    if (filterUA) {
      filtered = filtered.filter(item => item.id_ua_asignada === parseInt(filterUA))
    }

    setFilteredItems(filtered)
  }

  function getEstadoBadge(estado: string) {
    const styles: Record<string, string> = {
      'Excelente': 'bg-green-100 text-green-800 border-green-300',
      'Bueno': 'bg-blue-100 text-blue-800 border-blue-300',
      'Regular': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Malo': 'bg-orange-100 text-orange-800 border-orange-300',
      'Inservible': 'bg-red-100 text-red-800 border-red-300'
    }
    return styles[estado] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  function handleNew() {
    setSelectedItem(null)
    setFormData({
      numero_inventario: '',
      descripcion: '',
      marca: null,
      modelo: null,
      numero_serie: null,
      id_tipo_bien: tiposInventario[0]?.id_valor_catalogo || 0,
      estado_conservacion: estadosInventario.find(e => e.valor === 'Bueno')?.id_valor_catalogo || 0,
      id_ua_asignada: 0,
      id_usuario_responsable: null,
      id_usuario_resguardo: null,
      ubicacion_fisica: null,
      fecha_adquisicion: null,
      valor_adquisicion: null,
      numero_factura: null,
      proveedor: null,
      observaciones: null,
      foto_url: null,
      qr_code: null,
      activo: true
    })
    setUploadedPhoto(null)
    setShowModal(true)
  }

  function handleEdit(item: InventarioItem) {
    setSelectedItem(item)
    setFormData({
      numero_inventario: item.numero_inventario,
      descripcion: item.descripcion,
      marca: item.marca,
      modelo: item.modelo,
      numero_serie: item.numero_serie,
      id_tipo_bien: item.id_tipo_bien,
      estado_conservacion: item.estado_conservacion,
      id_ua_asignada: item.id_ua_asignada,
      id_usuario_responsable: item.id_usuario_responsable,
      id_usuario_resguardo: item.id_usuario_resguardo,
      ubicacion_fisica: item.ubicacion_fisica,
      fecha_adquisicion: item.fecha_adquisicion,
      valor_adquisicion: item.valor_adquisicion,
      numero_factura: item.numero_factura,
      proveedor: item.proveedor,
      observaciones: item.observaciones,
      foto_url: item.foto_url,
      qr_code: item.qr_code,
      activo: item.activo
    })
    setUploadedPhoto(null)
    setShowModal(true)
  }

  function handleDeleteClick(item: InventarioItem) {
    setSelectedItem(item)
    setShowDeleteModal(true)
  }

  async function handleDelete() {
    if (!selectedItem) return

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('tbl_inventario')
        .delete()
        .eq('id_inventario', selectedItem.id_inventario)

      if (deleteError) throw deleteError

      setSuccess('Item eliminado exitosamente')
      setShowDeleteModal(false)
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      let photoUrl = formData.foto_url
      let qrCode = formData.qr_code

      // Si hay foto nueva, subirla
      if (uploadedPhoto) {
        const uploadResult = await uploadPhoto(uploadedPhoto)
        photoUrl = uploadResult.url
      }

      // Generar código QR si no existe
      if (!qrCode) {
        qrCode = await generateQRCode(formData.numero_inventario)
      }

      const itemData = {
        ...formData,
        foto_url: photoUrl,
        qr_code: qrCode,
        id_usuario_registro: user.id
      }

      if (selectedItem) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('tbl_inventario')
          .update(itemData)
          .eq('id_inventario', selectedItem.id_inventario)

        if (updateError) throw updateError
        setSuccess('Item actualizado exitosamente')
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from('tbl_inventario')
          .insert([itemData])

        if (insertError) throw insertError
        setSuccess('Item registrado exitosamente')
      }

      setShowModal(false)
      loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function uploadPhoto(file: File): Promise<{ url: string }> {
    const supabase = createClient()

    // Generar nombre único
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('inventario')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('inventario')
      .getPublicUrl(fileName)

    return { url: urlData.publicUrl }
  }

  async function generateQRCode(numeroInventario: string): Promise<string> {
    // Generar código QR (en producción usar librería qrcode)
    // Por ahora, retornar URL de API que genera QR
    const qrData = `INV-${numeroInventario}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`
    return qrUrl
  }

  async function handleDownloadQR(item: InventarioItem) {
    if (!item.qr_code) return

    try {
      window.open(item.qr_code, '_blank')
    } catch (err: any) {
      setError('Error al descargar código QR')
    }
  }

  const columns = [
    {
      key: 'numero_inventario',
      label: 'Número',
      render: (item: InventarioItem) => (
        <div className="font-medium text-blue-600">{item.numero_inventario}</div>
      )
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (item: InventarioItem) => (
        <div>
          <div className="font-medium">{item.descripcion}</div>
          {item.marca && item.modelo && (
            <div className="text-xs text-gray-500">{item.marca} - {item.modelo}</div>
          )}
        </div>
      )
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (item: InventarioItem) => (
        <span className="text-sm text-gray-600">
          {item.cat_valores_catalogo_tipo?.valor}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (item: InventarioItem) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoBadge(item.cat_valores_catalogo_estado?.valor || '')}`}>
          {item.cat_valores_catalogo_estado?.valor}
        </span>
      )
    },
    {
      key: 'ua',
      label: 'UA Asignada',
      render: (item: InventarioItem) => (
        <div className="text-sm">
          <div>{item.cat_unidad_administrativa?.nombre_ua}</div>
          <div className="text-xs text-gray-500">{item.cat_unidad_administrativa?.codigo_ua}</div>
        </div>
      )
    },
    {
      key: 'responsable',
      label: 'Responsable',
      render: (item: InventarioItem) => (
        <div className="text-sm text-gray-600">
          {item.tbl_usuarios_responsable?.nombre_completo || 'Sin asignar'}
        </div>
      )
    },
    {
      key: 'qr',
      label: 'QR',
      render: (item: InventarioItem) => (
        item.qr_code ? (
          <button
            onClick={() => handleDownloadQR(item)}
            className="text-blue-600 hover:text-blue-800"
          >
            <QrCode className="w-5 h-5" />
          </button>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    }
  ]

  const actions = [
    {
      label: 'Ver QR',
      icon: <QrCode className="w-4 h-4" />,
      onClick: handleDownloadQR,
      variant: 'ghost' as const
    },
    {
      label: 'Editar',
      icon: <Edit2 className="w-4 h-4" />,
      onClick: handleEdit,
      variant: 'ghost' as const
    },
    {
      label: 'Eliminar',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDeleteClick,
      variant: 'ghost' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            Inventario
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de bienes muebles e inmuebles
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Bien
        </Button>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="w-5 h-5" />
          Filtros y Búsqueda
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <Input
              placeholder="Buscar por número, descripción, marca, modelo, serie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Tipo */}
          <div>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              {tiposInventario.map(t => (
                <option key={t.id_valor_catalogo} value={t.id_valor_catalogo}>
                  {t.valor}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {estadosInventario.map(e => (
                <option key={e.id_valor_catalogo} value={e.id_valor_catalogo}>
                  {e.valor}
                </option>
              ))}
            </select>
          </div>

          {/* UA */}
          <div>
            <select
              value={filterUA}
              onChange={(e) => setFilterUA(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las UAs</option>
              {unidades.map(ua => (
                <option key={ua.id_ua} value={ua.id_ua}>
                  {ua.nombre_ua}
                </option>
              ))}
            </select>
          </div>

          {/* Botón limpiar filtros */}
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setFilterTipo('')
                setFilterEstado('')
                setFilterUA('')
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        {/* Resultados count */}
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{filteredItems.length}</span> de{' '}
          <span className="font-medium">{items.length}</span> bienes
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <Table
          data={filteredItems}
          columns={columns}
          actions={actions}
          loading={loading}
        />
      </div>

      {/* Modal Formulario */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedItem ? 'Editar Bien' : 'Registrar Bien'}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Número de Inventario */}
              <Input
                label="Número de Inventario"
                value={formData.numero_inventario}
                onChange={(e) => setFormData({ ...formData, numero_inventario: e.target.value })}
                required
                placeholder="INV-2024-001"
              />

              {/* Tipo de Bien */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Bien <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_tipo_bien}
                  onChange={(e) => setFormData({ ...formData, id_tipo_bien: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {tiposInventario.map(t => (
                    <option key={t.id_valor_catalogo} value={t.id_valor_catalogo}>
                      {t.valor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  required
                  placeholder="Descripción detallada del bien"
                />
              </div>

              {/* Marca */}
              <Input
                label="Marca"
                value={formData.marca || ''}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value || null })}
                placeholder="Ej: HP, Dell, etc."
              />

              {/* Modelo */}
              <Input
                label="Modelo"
                value={formData.modelo || ''}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value || null })}
                placeholder="Ej: Latitude 5520"
              />

              {/* Número de Serie */}
              <Input
                label="Número de Serie"
                value={formData.numero_serie || ''}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value || null })}
                placeholder="Serie única del fabricante"
              />

              {/* Estado de Conservación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de Conservación <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.estado_conservacion}
                  onChange={(e) => setFormData({ ...formData, estado_conservacion: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {estadosInventario.map(e => (
                    <option key={e.id_valor_catalogo} value={e.id_valor_catalogo}>
                      {e.valor}
                    </option>
                  ))}
                </select>
              </div>

              {/* UA Asignada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad Administrativa <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_ua_asignada}
                  onChange={(e) => {
                    const uaId = parseInt(e.target.value)
                    setFormData({
                      ...formData,
                      id_ua_asignada: uaId,
                      id_usuario_responsable: null,
                      id_usuario_resguardo: null
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {unidades.map(ua => (
                    <option key={ua.id_ua} value={ua.id_ua}>
                      {ua.nombre_ua}
                    </option>
                  ))}
                </select>
              </div>

              {/* Usuario Responsable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario Responsable
                </label>
                <select
                  value={formData.id_usuario_responsable || ''}
                  onChange={(e) => setFormData({ ...formData, id_usuario_responsable: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.id_ua_asignada}
                >
                  <option value="">Sin asignar</option>
                  {usuarios.filter(u => u.id_ua === formData.id_ua_asignada).map(u => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {u.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ubicación Física */}
              <Input
                label="Ubicación Física"
                value={formData.ubicacion_fisica || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion_fisica: e.target.value || null })}
                placeholder="Ej: Edificio A, Piso 3, Oficina 301"
              />

              {/* Fecha de Adquisición */}
              <Input
                type="date"
                label="Fecha de Adquisición"
                value={formData.fecha_adquisicion || ''}
                onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.target.value || null })}
              />

              {/* Valor de Adquisición */}
              <Input
                type="number"
                label="Valor de Adquisición"
                value={formData.valor_adquisicion?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, valor_adquisicion: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="0.00"
                step="0.01"
              />

              {/* Número de Factura */}
              <Input
                label="Número de Factura"
                value={formData.numero_factura || ''}
                onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value || null })}
                placeholder="Número de factura"
              />

              {/* Proveedor */}
              <Input
                label="Proveedor"
                value={formData.proveedor || ''}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value || null })}
                placeholder="Nombre del proveedor"
              />

              {/* Observaciones */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Observaciones adicionales"
                />
              </div>

              {/* Upload foto */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fotografía del Bien
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadedPhoto(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploadedPhoto && (
                  <p className="text-xs text-green-600 mt-1">✓ {uploadedPhoto.name}</p>
                )}
                {formData.foto_url && !uploadedPhoto && (
                  <p className="text-xs text-blue-600 mt-1">Foto actual guardada</p>
                )}
              </div>

              {/* Activo */}
              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Activo</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {selectedItem ? 'Actualizar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && selectedItem && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Eliminar Bien"
          message={`¿Está seguro de eliminar el bien "${selectedItem.numero_inventario} - ${selectedItem.descripcion}"? Esta acción no se puede deshacer.`}
        />
      )}
    </div>
  )
}
