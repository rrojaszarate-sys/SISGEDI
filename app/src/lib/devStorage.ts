/**
 * SISGEDI - Servicio de Almacenamiento Local para Modo Desarrollo
 *
 * Este servicio proporciona persistencia de datos usando localStorage
 * cuando el sistema opera en modo desarrollo (DEV_MODE = true).
 *
 * Simula las operaciones CRUD de Supabase para permitir desarrollo
 * sin conexión a la base de datos real.
 */

import type {
  UnidadAdministrativa,
  Rol,
  Usuario,
  ValorCatalogo,
  DocumentoEntrante,
  DocumentoSaliente,
  Turnado,
  Inventario,
  Anexo,
} from '../types/database';

// Prefijo para las claves de localStorage
const STORAGE_PREFIX = 'sisgedi_dev_';

// Claves de almacenamiento
const STORAGE_KEYS = {
  UNIDADES: `${STORAGE_PREFIX}unidades`,
  ROLES: `${STORAGE_PREFIX}roles`,
  USUARIOS: `${STORAGE_PREFIX}usuarios`,
  CATALOGOS: `${STORAGE_PREFIX}catalogos`,
  DOCUMENTOS_ENTRANTES: `${STORAGE_PREFIX}docs_entrantes`,
  DOCUMENTOS_SALIENTES: `${STORAGE_PREFIX}docs_salientes`,
  TURNADOS: `${STORAGE_PREFIX}turnados`,
  INVENTARIO: `${STORAGE_PREFIX}inventario`,
  ANEXOS: `${STORAGE_PREFIX}anexos`,
  AVANCES: `${STORAGE_PREFIX}avances`,
  INITIALIZED: `${STORAGE_PREFIX}initialized`,
};

// Generador de UUID simple para modo desarrollo
export const generateDevId = (): string => {
  return 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

// Generador de folio interno
export const generateFolioInterno = (): string => {
  const year = new Date().getFullYear();
  const count = parseInt(localStorage.getItem(`${STORAGE_PREFIX}folio_count_${year}`) || '0') + 1;
  localStorage.setItem(`${STORAGE_PREFIX}folio_count_${year}`, count.toString());
  return `ENT-${year}-${count.toString().padStart(6, '0')}`;
};

// Generador de folio saliente
export const generateFolioSaliente = (tipoDoc: string): string => {
  const year = new Date().getFullYear();
  const count = parseInt(localStorage.getItem(`${STORAGE_PREFIX}folio_saliente_${year}`) || '0') + 1;
  localStorage.setItem(`${STORAGE_PREFIX}folio_saliente_${year}`, count.toString());
  const prefijo = {
    'Oficio': 'OF',
    'Nota_Informativa': 'NI',
    'Circular': 'CIR',
    'Memorandum': 'MEM',
  }[tipoDoc] || 'DOC';
  return `${prefijo}-${year}-${count.toString().padStart(6, '0')}`;
};

// Generador de numero de inventario
export const generateNumeroInventario = (): string => {
  const count = parseInt(localStorage.getItem(`${STORAGE_PREFIX}inv_count`) || '0') + 1;
  localStorage.setItem(`${STORAGE_PREFIX}inv_count`, count.toString());
  return `INV-${count.toString().padStart(6, '0')}`;
};

// ============================================================================
// DATOS INICIALES
// ============================================================================

const INITIAL_UNIDADES: UnidadAdministrativa[] = [
  {
    id_ua: 'ua-001',
    nombre_ua: 'Subsecretaria de Gestion Documental',
    codigo_ua: 'SS-001',
    nivel_jerarquico: 1,
    id_ua_superior: null,
    direccion: 'Av. Insurgentes Sur 1234, CDMX',
    telefono: '55-1234-5678',
    extension: '100',
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_ua: 'ua-002',
    nombre_ua: 'Coordinacion General de Administracion',
    codigo_ua: 'SS-002',
    nivel_jerarquico: 1,
    id_ua_superior: null,
    direccion: 'Paseo de la Reforma 567, CDMX',
    telefono: '55-2345-6789',
    extension: '200',
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_ua: 'ua-003',
    nombre_ua: 'Direccion General de Tecnologias',
    codigo_ua: 'DG-001',
    nivel_jerarquico: 2,
    id_ua_superior: 'ua-001',
    direccion: 'Eje Central 100, CDMX',
    telefono: '55-3456-7890',
    extension: '301',
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_ua: 'ua-004',
    nombre_ua: 'Direccion General de Recursos Humanos',
    codigo_ua: 'DG-002',
    nivel_jerarquico: 2,
    id_ua_superior: 'ua-002',
    direccion: 'Reforma 890, CDMX',
    telefono: '55-4567-8901',
    extension: '401',
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_ua: 'ua-005',
    nombre_ua: 'Direccion de Sistemas',
    codigo_ua: 'DIR-001',
    nivel_jerarquico: 3,
    id_ua_superior: 'ua-003',
    direccion: 'Eje Central 100, Piso 3',
    telefono: '55-5678-9012',
    extension: '501',
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
];

const INITIAL_ROLES: Rol[] = [
  {
    id_rol: 'rol-001',
    nombre_rol: 'Administrador General',
    descripcion: 'Acceso completo al sistema',
    elementos_menu: {
      modulos: ['admin', 'doc_entrante', 'seguimiento', 'doc_saliente', 'dashboard', 'consultas', 'auditoria', 'inventario'],
      acciones: ['crear', 'editar', 'eliminar', 'turnar', 'firmar', 'rechazar', 'concluir', 'exportar'],
    },
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_rol: 'rol-002',
    nombre_rol: 'Administrador UA',
    descripcion: 'Administrador de Unidad Administrativa',
    elementos_menu: {
      modulos: ['admin_usuarios', 'doc_entrante', 'seguimiento', 'doc_saliente', 'dashboard', 'consultas', 'inventario'],
      acciones: ['crear', 'editar', 'turnar', 'firmar', 'rechazar', 'concluir'],
    },
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_rol: 'rol-003',
    nombre_rol: 'Operador',
    descripcion: 'Operador de documentos',
    elementos_menu: {
      modulos: ['doc_entrante', 'seguimiento', 'doc_saliente', 'consultas'],
      acciones: ['crear', 'editar', 'turnar', 'avance'],
    },
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_rol: 'rol-004',
    nombre_rol: 'Consulta',
    descripcion: 'Solo consulta de documentos',
    elementos_menu: {
      modulos: ['consultas', 'dashboard'],
      acciones: ['ver', 'exportar'],
    },
    estatus: true,
    fecha_creacion: new Date().toISOString(),
  },
];

const INITIAL_CATALOGOS: ValorCatalogo[] = [
  // Prioridades
  { id_valor_catalogo: 'cat-pri-1', tipo_catalogo: 'Prioridad', valor: 'Normal', descripcion: 'Prioridad normal de atencion', es_modificable: false, orden_presentacion: 1, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-pri-2', tipo_catalogo: 'Prioridad', valor: 'Urgente', descripcion: 'Requiere atencion inmediata', es_modificable: false, orden_presentacion: 2, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-pri-3', tipo_catalogo: 'Prioridad', valor: 'Baja', descripcion: 'Prioridad baja', es_modificable: true, orden_presentacion: 3, estatus: true, fecha_creacion: new Date().toISOString() },
  // Tipos de Documento
  { id_valor_catalogo: 'cat-tipo-1', tipo_catalogo: 'Tipo_Documento', valor: 'Oficio', descripcion: 'Documento oficial entre dependencias', es_modificable: false, orden_presentacion: 1, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-tipo-2', tipo_catalogo: 'Tipo_Documento', valor: 'Circular', descripcion: 'Comunicado de aplicacion general', es_modificable: false, orden_presentacion: 2, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-tipo-3', tipo_catalogo: 'Tipo_Documento', valor: 'Memorandum', descripcion: 'Comunicacion interna breve', es_modificable: false, orden_presentacion: 3, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-tipo-4', tipo_catalogo: 'Tipo_Documento', valor: 'Nota Informativa', descripcion: 'Documento informativo', es_modificable: false, orden_presentacion: 4, estatus: true, fecha_creacion: new Date().toISOString() },
  // Areas Remitentes
  { id_valor_catalogo: 'cat-area-1', tipo_catalogo: 'Area_Remitente', valor: 'Secretaria de Hacienda', descripcion: 'SHCP', es_modificable: true, orden_presentacion: 1, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-area-2', tipo_catalogo: 'Area_Remitente', valor: 'Secretaria de Economia', descripcion: 'SE', es_modificable: true, orden_presentacion: 2, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-area-3', tipo_catalogo: 'Area_Remitente', valor: 'Secretaria de Gobernacion', descripcion: 'SEGOB', es_modificable: true, orden_presentacion: 3, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-area-4', tipo_catalogo: 'Area_Remitente', valor: 'Sector Privado', descripcion: 'Empresas y particulares', es_modificable: true, orden_presentacion: 4, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-area-5', tipo_catalogo: 'Area_Remitente', valor: 'Ciudadano', descripcion: 'Personas fisicas', es_modificable: true, orden_presentacion: 5, estatus: true, fecha_creacion: new Date().toISOString() },
  // Categorias de Inventario
  { id_valor_catalogo: 'cat-inv-1', tipo_catalogo: 'Categoria_Inventario', valor: 'Equipo de Computo', descripcion: 'Computadoras, laptops, servidores', es_modificable: true, orden_presentacion: 1, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-inv-2', tipo_catalogo: 'Categoria_Inventario', valor: 'Mobiliario', descripcion: 'Escritorios, sillas, archiveros', es_modificable: true, orden_presentacion: 2, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-inv-3', tipo_catalogo: 'Categoria_Inventario', valor: 'Vehiculos', descripcion: 'Automoviles, camionetas', es_modificable: true, orden_presentacion: 3, estatus: true, fecha_creacion: new Date().toISOString() },
  { id_valor_catalogo: 'cat-inv-4', tipo_catalogo: 'Categoria_Inventario', valor: 'Equipo de Oficina', descripcion: 'Impresoras, telefonos, proyectores', es_modificable: true, orden_presentacion: 4, estatus: true, fecha_creacion: new Date().toISOString() },
];

const INITIAL_USUARIOS: Usuario[] = [
  {
    id_usuario: 'usr-001',
    clave_servidor_publico: 'ADM001',
    nombre_completo: 'Juan Carlos Martinez Lopez',
    correo_institucional: 'admin@gobierno.gob.mx',
    telefono: '55-1234-5678',
    id_ua: 'ua-001',
    id_rol: 'rol-001',
    estatus: 'Activo',
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_usuario: 'usr-002',
    clave_servidor_publico: 'ADM002',
    nombre_completo: 'Maria Elena Garcia Hernandez',
    correo_institucional: 'adminua@gobierno.gob.mx',
    telefono: '55-2345-6789',
    id_ua: 'ua-003',
    id_rol: 'rol-002',
    estatus: 'Activo',
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_usuario: 'usr-003',
    clave_servidor_publico: 'OPE001',
    nombre_completo: 'Roberto Sanchez Perez',
    correo_institucional: 'operador@gobierno.gob.mx',
    telefono: '55-3456-7890',
    id_ua: 'ua-005',
    id_rol: 'rol-003',
    estatus: 'Activo',
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_usuario: 'usr-004',
    clave_servidor_publico: 'CON001',
    nombre_completo: 'Ana Patricia Ruiz Torres',
    correo_institucional: 'consulta@gobierno.gob.mx',
    telefono: '55-4567-8901',
    id_ua: 'ua-004',
    id_rol: 'rol-004',
    estatus: 'Activo',
    fecha_creacion: new Date().toISOString(),
  },
];

const INITIAL_DOCUMENTOS_ENTRANTES: DocumentoEntrante[] = [
  {
    id_doc_entrante: 'doc-001',
    folio_interno: 'ENT-2025-000001',
    numero_oficio_externo: 'OF-SHCP-2025-001',
    fecha_documento: '2025-01-10',
    fecha_registro: new Date().toISOString(),
    asunto: 'Solicitud de informacion presupuestal para el ejercicio fiscal 2025',
    id_prioridad: 'cat-pri-2',
    id_tipo_doc: 'cat-tipo-1',
    id_area_remitente: 'cat-area-1',
    remitente_nombre: 'Lic. Fernando Gomez Ramirez',
    remitente_cargo: 'Director General de Presupuesto',
    remitente_institucion: 'Secretaria de Hacienda',
    marca_seguimiento: 'Turnarse',
    estatus_general: 'En_Proceso',
    id_ua_registro: 'ua-001',
    id_usuario_registro: 'usr-001',
    eliminado: false,
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_doc_entrante: 'doc-002',
    folio_interno: 'ENT-2025-000002',
    numero_oficio_externo: 'CIR-SEGOB-2025-015',
    fecha_documento: '2025-01-12',
    fecha_registro: new Date(Date.now() - 86400000).toISOString(),
    asunto: 'Lineamientos para la proteccion de datos personales en sistemas gubernamentales',
    id_prioridad: 'cat-pri-1',
    id_tipo_doc: 'cat-tipo-2',
    id_area_remitente: 'cat-area-3',
    remitente_nombre: 'Mtro. Carlos Eduardo Vazquez',
    remitente_cargo: 'Subsecretario de Normatividad',
    remitente_institucion: 'Secretaria de Gobernacion',
    marca_seguimiento: 'Conocimiento',
    estatus_general: 'Pendiente',
    id_ua_registro: 'ua-001',
    id_usuario_registro: 'usr-001',
    eliminado: false,
    fecha_creacion: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id_doc_entrante: 'doc-003',
    folio_interno: 'ENT-2025-000003',
    numero_oficio_externo: 'OF-SE-2025-089',
    fecha_documento: '2025-01-15',
    fecha_registro: new Date(Date.now() - 172800000).toISOString(),
    asunto: 'Invitacion a mesa de trabajo sobre transformacion digital',
    id_prioridad: 'cat-pri-1',
    id_tipo_doc: 'cat-tipo-1',
    id_area_remitente: 'cat-area-2',
    remitente_nombre: 'Ing. Patricia Morales',
    remitente_cargo: 'Coordinadora de Innovacion',
    remitente_institucion: 'Secretaria de Economia',
    marca_seguimiento: 'Turnarse',
    estatus_general: 'Concluido',
    id_ua_registro: 'ua-003',
    id_usuario_registro: 'usr-002',
    eliminado: false,
    fecha_creacion: new Date(Date.now() - 172800000).toISOString(),
  },
];

const INITIAL_TURNADOS: Turnado[] = [
  {
    id_turnado: 'turn-001',
    id_doc_entrante: 'doc-001',
    id_ua_origen: 'ua-001',
    id_usuario_turno: 'usr-001',
    id_ua_destino: 'ua-003',
    fecha_turnado: new Date(Date.now() - 86400000).toISOString(),
    instruccion: 'Para su atencion y seguimiento correspondiente',
    observaciones: 'Documento de alta prioridad',
    dias_para_atencion: 5,
    fecha_vencimiento: new Date(Date.now() + 86400000 * 4).toISOString(),
    estatus_turnado: 'Recibido',
    porcentaje_avance: 45,
    fecha_creacion: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id_turnado: 'turn-002',
    id_doc_entrante: 'doc-003',
    id_ua_origen: 'ua-003',
    id_usuario_turno: 'usr-002',
    id_ua_destino: 'ua-005',
    fecha_turnado: new Date(Date.now() - 172800000).toISOString(),
    instruccion: 'Coordinar asistencia a la mesa de trabajo',
    observaciones: null,
    dias_para_atencion: 3,
    fecha_vencimiento: new Date(Date.now() - 86400000).toISOString(),
    estatus_turnado: 'Concluido',
    porcentaje_avance: 100,
    fecha_creacion: new Date(Date.now() - 172800000).toISOString(),
  },
];

const INITIAL_DOCUMENTOS_SALIENTES: DocumentoSaliente[] = [
  {
    id_doc_saliente: 'sal-001',
    numero_folio: 'OF-2025-000001',
    tipo_doc: 'Oficio',
    fecha_elaboracion: new Date().toISOString(),
    asunto: 'Respuesta a solicitud de informacion presupuestal',
    contenido_cuerpo: 'En atencion a su oficio de referencia, me permito informar que...',
    destinatario_nombre: 'Lic. Fernando Gomez Ramirez',
    destinatario_cargo: 'Director General de Presupuesto',
    destinatario_institucion: 'Secretaria de Hacienda',
    estatus_saliente: 'Borrador',
    id_ua_emisora: 'ua-001',
    id_usuario_elabora: 'usr-001',
    fecha_creacion: new Date().toISOString(),
  },
  {
    id_doc_saliente: 'sal-002',
    numero_folio: 'CIR-2025-000001',
    tipo_doc: 'Circular',
    fecha_elaboracion: new Date(Date.now() - 86400000).toISOString(),
    asunto: 'Actualizacion de procedimientos internos',
    contenido_cuerpo: 'Se comunica a todas las areas que a partir de la presente fecha...',
    destinatario_nombre: 'Titulares de Unidades Administrativas',
    destinatario_cargo: null,
    destinatario_institucion: null,
    estatus_saliente: 'Firmado',
    id_ua_emisora: 'ua-001',
    id_usuario_elabora: 'usr-001',
    fecha_creacion: new Date(Date.now() - 86400000).toISOString(),
  },
];

const INITIAL_INVENTARIO: Inventario[] = [
  {
    id_inventario: 'inv-001',
    id_ua: 'ua-003',
    categoria: 'Equipo de Computo',
    descripcion: 'Laptop Dell Latitude 5520',
    cantidad: 10,
    unidad: 'Pieza',
    estado: 'Bueno',
    ubicacion: 'Edificio A, Piso 3',
    responsable: 'Ing. Roberto Sanchez',
    numero_inventario: 'INV-000001',
    fecha_adquisicion: '2024-06-15',
    valor_unitario: 25000,
    valor_total: 250000,
    proveedor: 'Dell Technologies',
    marca: 'Dell',
    modelo: 'Latitude 5520',
    serie: 'DL5520-2024',
    fecha_registro: new Date().toISOString(),
  },
  {
    id_inventario: 'inv-002',
    id_ua: 'ua-003',
    categoria: 'Mobiliario',
    descripcion: 'Escritorio ejecutivo con cajonera',
    cantidad: 15,
    unidad: 'Pieza',
    estado: 'Bueno',
    ubicacion: 'Edificio A, Varios pisos',
    responsable: 'Lic. Maria Garcia',
    numero_inventario: 'INV-000002',
    fecha_adquisicion: '2023-03-20',
    valor_unitario: 8500,
    valor_total: 127500,
    proveedor: 'Muebles Ejecutivos SA',
    marca: 'Ejecutivo Plus',
    modelo: 'EJ-2023',
    serie: null,
    fecha_registro: new Date().toISOString(),
  },
  {
    id_inventario: 'inv-003',
    id_ua: 'ua-001',
    categoria: 'Vehiculos',
    descripcion: 'Camioneta Chevrolet Suburban',
    cantidad: 2,
    unidad: 'Unidad',
    estado: 'Bueno',
    ubicacion: 'Estacionamiento principal',
    responsable: 'Lic. Juan Martinez',
    numero_inventario: 'INV-000003',
    fecha_adquisicion: '2024-01-10',
    valor_unitario: 850000,
    valor_total: 1700000,
    proveedor: 'Chevrolet México',
    marca: 'Chevrolet',
    modelo: 'Suburban 2024',
    serie: 'CHSB-2024-001',
    fecha_registro: new Date().toISOString(),
  },
];

// ============================================================================
// FUNCIONES DE INICIALIZACION
// ============================================================================

/**
 * Inicializa el almacenamiento local con datos de ejemplo
 */
export const initializeDevStorage = (): void => {
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

  if (!isInitialized) {
    localStorage.setItem(STORAGE_KEYS.UNIDADES, JSON.stringify(INITIAL_UNIDADES));
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(INITIAL_ROLES));
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(INITIAL_USUARIOS));
    localStorage.setItem(STORAGE_KEYS.CATALOGOS, JSON.stringify(INITIAL_CATALOGOS));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTOS_ENTRANTES, JSON.stringify(INITIAL_DOCUMENTOS_ENTRANTES));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTOS_SALIENTES, JSON.stringify(INITIAL_DOCUMENTOS_SALIENTES));
    localStorage.setItem(STORAGE_KEYS.TURNADOS, JSON.stringify(INITIAL_TURNADOS));
    localStorage.setItem(STORAGE_KEYS.INVENTARIO, JSON.stringify(INITIAL_INVENTARIO));
    localStorage.setItem(STORAGE_KEYS.ANEXOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AVANCES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    // Inicializar contadores de folio
    localStorage.setItem(`${STORAGE_PREFIX}folio_count_2025`, '3');
    localStorage.setItem(`${STORAGE_PREFIX}folio_saliente_2025`, '2');
    localStorage.setItem(`${STORAGE_PREFIX}inv_count`, '3');

    console.log('[DevStorage] Almacenamiento local inicializado con datos de ejemplo');
  }
};

/**
 * Reinicia el almacenamiento local
 */
export const resetDevStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  // Limpiar contadores
  const year = new Date().getFullYear();
  localStorage.removeItem(`${STORAGE_PREFIX}folio_count_${year}`);
  localStorage.removeItem(`${STORAGE_PREFIX}folio_saliente_${year}`);
  localStorage.removeItem(`${STORAGE_PREFIX}inv_count`);
  initializeDevStorage();
};

// ============================================================================
// OPERACIONES CRUD GENERICAS
// ============================================================================

type StorableEntity =
  | UnidadAdministrativa
  | Rol
  | Usuario
  | ValorCatalogo
  | DocumentoEntrante
  | DocumentoSaliente
  | Turnado
  | Inventario
  | Anexo;

const getItems = <T extends StorableEntity>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setItems = <T extends StorableEntity>(key: string, items: T[]): void => {
  localStorage.setItem(key, JSON.stringify(items));
};

// ============================================================================
// UNIDADES ADMINISTRATIVAS
// ============================================================================

export const devUnidades = {
  getAll: (): UnidadAdministrativa[] => getItems<UnidadAdministrativa>(STORAGE_KEYS.UNIDADES),

  getById: (id: string): UnidadAdministrativa | undefined => {
    const items = getItems<UnidadAdministrativa>(STORAGE_KEYS.UNIDADES);
    return items.find(item => item.id_ua === id);
  },

  getActive: (): UnidadAdministrativa[] => {
    return getItems<UnidadAdministrativa>(STORAGE_KEYS.UNIDADES).filter(ua => ua.estatus);
  },

  create: (data: Omit<UnidadAdministrativa, 'id_ua' | 'fecha_creacion'>): UnidadAdministrativa => {
    const items = getItems<UnidadAdministrativa>(STORAGE_KEYS.UNIDADES);
    const newItem: UnidadAdministrativa = {
      ...data,
      id_ua: generateDevId(),
      fecha_creacion: new Date().toISOString(),
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.UNIDADES, items);
    return newItem;
  },

  update: (id: string, data: Partial<UnidadAdministrativa>): UnidadAdministrativa | null => {
    const items = getItems<UnidadAdministrativa>(STORAGE_KEYS.UNIDADES);
    const index = items.findIndex(item => item.id_ua === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data };
    setItems(STORAGE_KEYS.UNIDADES, items);
    return items[index];
  },

  delete: (id: string): boolean => {
    const items = getItems<UnidadAdministrativa>(STORAGE_KEYS.UNIDADES);
    const index = items.findIndex(item => item.id_ua === id);
    if (index === -1) return false;
    items[index].estatus = false;
    setItems(STORAGE_KEYS.UNIDADES, items);
    return true;
  },
};

// ============================================================================
// ROLES
// ============================================================================

export const devRoles = {
  getAll: (): Rol[] => getItems<Rol>(STORAGE_KEYS.ROLES),

  getById: (id: string): Rol | undefined => {
    const items = getItems<Rol>(STORAGE_KEYS.ROLES);
    return items.find(item => item.id_rol === id);
  },

  getActive: (): Rol[] => {
    return getItems<Rol>(STORAGE_KEYS.ROLES).filter(rol => rol.estatus);
  },

  create: (data: Omit<Rol, 'id_rol' | 'fecha_creacion'>): Rol => {
    const items = getItems<Rol>(STORAGE_KEYS.ROLES);
    const newItem: Rol = {
      ...data,
      id_rol: generateDevId(),
      fecha_creacion: new Date().toISOString(),
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.ROLES, items);
    return newItem;
  },

  update: (id: string, data: Partial<Rol>): Rol | null => {
    const items = getItems<Rol>(STORAGE_KEYS.ROLES);
    const index = items.findIndex(item => item.id_rol === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data };
    setItems(STORAGE_KEYS.ROLES, items);
    return items[index];
  },

  delete: (id: string): boolean => {
    const items = getItems<Rol>(STORAGE_KEYS.ROLES);
    const index = items.findIndex(item => item.id_rol === id);
    if (index === -1) return false;
    items[index].estatus = false;
    setItems(STORAGE_KEYS.ROLES, items);
    return true;
  },
};

// ============================================================================
// USUARIOS
// ============================================================================

export const devUsuarios = {
  getAll: (): Usuario[] => getItems<Usuario>(STORAGE_KEYS.USUARIOS),

  getById: (id: string): Usuario | undefined => {
    const items = getItems<Usuario>(STORAGE_KEYS.USUARIOS);
    return items.find(item => item.id_usuario === id);
  },

  getActive: (): Usuario[] => {
    return getItems<Usuario>(STORAGE_KEYS.USUARIOS).filter(usr => usr.estatus === 'Activo');
  },

  create: (data: Omit<Usuario, 'id_usuario' | 'fecha_creacion'>): Usuario => {
    const items = getItems<Usuario>(STORAGE_KEYS.USUARIOS);
    const newItem: Usuario = {
      ...data,
      id_usuario: generateDevId(),
      fecha_creacion: new Date().toISOString(),
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.USUARIOS, items);
    return newItem;
  },

  update: (id: string, data: Partial<Usuario>): Usuario | null => {
    const items = getItems<Usuario>(STORAGE_KEYS.USUARIOS);
    const index = items.findIndex(item => item.id_usuario === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data };
    setItems(STORAGE_KEYS.USUARIOS, items);
    return items[index];
  },

  toggleStatus: (id: string): Usuario | null => {
    const items = getItems<Usuario>(STORAGE_KEYS.USUARIOS);
    const index = items.findIndex(item => item.id_usuario === id);
    if (index === -1) return null;
    items[index].estatus = items[index].estatus === 'Activo' ? 'Inhabilitado' : 'Activo';
    setItems(STORAGE_KEYS.USUARIOS, items);
    return items[index];
  },
};

// ============================================================================
// CATALOGOS
// ============================================================================

export const devCatalogos = {
  getAll: (): ValorCatalogo[] => getItems<ValorCatalogo>(STORAGE_KEYS.CATALOGOS),

  getById: (id: string): ValorCatalogo | undefined => {
    const items = getItems<ValorCatalogo>(STORAGE_KEYS.CATALOGOS);
    return items.find(item => item.id_valor_catalogo === id);
  },

  getByTipo: (tipo: string): ValorCatalogo[] => {
    return getItems<ValorCatalogo>(STORAGE_KEYS.CATALOGOS)
      .filter(cat => cat.tipo_catalogo === tipo && cat.estatus)
      .sort((a, b) => a.orden_presentacion - b.orden_presentacion);
  },

  getTipos: (): string[] => {
    const items = getItems<ValorCatalogo>(STORAGE_KEYS.CATALOGOS);
    return [...new Set(items.map(cat => cat.tipo_catalogo))];
  },

  create: (data: Omit<ValorCatalogo, 'id_valor_catalogo' | 'fecha_creacion'>): ValorCatalogo => {
    const items = getItems<ValorCatalogo>(STORAGE_KEYS.CATALOGOS);
    const newItem: ValorCatalogo = {
      ...data,
      id_valor_catalogo: generateDevId(),
      fecha_creacion: new Date().toISOString(),
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.CATALOGOS, items);
    return newItem;
  },

  update: (id: string, data: Partial<ValorCatalogo>): ValorCatalogo | null => {
    const items = getItems<ValorCatalogo>(STORAGE_KEYS.CATALOGOS);
    const index = items.findIndex(item => item.id_valor_catalogo === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data };
    setItems(STORAGE_KEYS.CATALOGOS, items);
    return items[index];
  },

  delete: (id: string): boolean => {
    const items = getItems<ValorCatalogo>(STORAGE_KEYS.CATALOGOS);
    const index = items.findIndex(item => item.id_valor_catalogo === id);
    if (index === -1) return false;
    items[index].estatus = false;
    setItems(STORAGE_KEYS.CATALOGOS, items);
    return true;
  },
};

// ============================================================================
// DOCUMENTOS ENTRANTES
// ============================================================================

export const devDocumentosEntrantes = {
  getAll: (): DocumentoEntrante[] => {
    return getItems<DocumentoEntrante>(STORAGE_KEYS.DOCUMENTOS_ENTRANTES)
      .filter(doc => !doc.eliminado)
      .sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
  },

  getById: (id: string): DocumentoEntrante | undefined => {
    const items = getItems<DocumentoEntrante>(STORAGE_KEYS.DOCUMENTOS_ENTRANTES);
    return items.find(item => item.id_doc_entrante === id && !item.eliminado);
  },

  getByUA: (idUa: string): DocumentoEntrante[] => {
    return getItems<DocumentoEntrante>(STORAGE_KEYS.DOCUMENTOS_ENTRANTES)
      .filter(doc => doc.id_ua_registro === idUa && !doc.eliminado)
      .sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
  },

  search: (query: string): DocumentoEntrante[] => {
    const lowerQuery = query.toLowerCase();
    return getItems<DocumentoEntrante>(STORAGE_KEYS.DOCUMENTOS_ENTRANTES)
      .filter(doc => !doc.eliminado && (
        doc.folio_interno?.toLowerCase().includes(lowerQuery) ||
        doc.asunto?.toLowerCase().includes(lowerQuery) ||
        doc.remitente_nombre?.toLowerCase().includes(lowerQuery) ||
        doc.numero_oficio_externo?.toLowerCase().includes(lowerQuery)
      ))
      .sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
  },

  create: (data: Omit<DocumentoEntrante, 'id_doc_entrante' | 'folio_interno' | 'fecha_creacion' | 'fecha_registro' | 'eliminado'>): DocumentoEntrante => {
    const items = getItems<DocumentoEntrante>(STORAGE_KEYS.DOCUMENTOS_ENTRANTES);
    const newItem: DocumentoEntrante = {
      ...data,
      id_doc_entrante: generateDevId(),
      folio_interno: generateFolioInterno(),
      fecha_registro: new Date().toISOString(),
      fecha_creacion: new Date().toISOString(),
      eliminado: false,
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.DOCUMENTOS_ENTRANTES, items);
    return newItem;
  },

  update: (id: string, data: Partial<DocumentoEntrante>): DocumentoEntrante | null => {
    const items = getItems<DocumentoEntrante>(STORAGE_KEYS.DOCUMENTOS_ENTRANTES);
    const index = items.findIndex(item => item.id_doc_entrante === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data };
    setItems(STORAGE_KEYS.DOCUMENTOS_ENTRANTES, items);
    return items[index];
  },

  delete: (id: string): boolean => {
    const items = getItems<DocumentoEntrante>(STORAGE_KEYS.DOCUMENTOS_ENTRANTES);
    const index = items.findIndex(item => item.id_doc_entrante === id);
    if (index === -1) return false;
    items[index].eliminado = true;
    setItems(STORAGE_KEYS.DOCUMENTOS_ENTRANTES, items);
    return true;
  },
};

// ============================================================================
// DOCUMENTOS SALIENTES
// ============================================================================

export const devDocumentosSalientes = {
  getAll: (): DocumentoSaliente[] => {
    return getItems<DocumentoSaliente>(STORAGE_KEYS.DOCUMENTOS_SALIENTES)
      .sort((a, b) => new Date(b.fecha_elaboracion).getTime() - new Date(a.fecha_elaboracion).getTime());
  },

  getById: (id: string): DocumentoSaliente | undefined => {
    const items = getItems<DocumentoSaliente>(STORAGE_KEYS.DOCUMENTOS_SALIENTES);
    return items.find(item => item.id_doc_saliente === id);
  },

  getByUA: (idUa: string): DocumentoSaliente[] => {
    return getItems<DocumentoSaliente>(STORAGE_KEYS.DOCUMENTOS_SALIENTES)
      .filter(doc => doc.id_ua_emisora === idUa)
      .sort((a, b) => new Date(b.fecha_elaboracion).getTime() - new Date(a.fecha_elaboracion).getTime());
  },

  create: (data: Omit<DocumentoSaliente, 'id_doc_saliente' | 'numero_folio' | 'fecha_creacion'>): DocumentoSaliente => {
    const items = getItems<DocumentoSaliente>(STORAGE_KEYS.DOCUMENTOS_SALIENTES);
    const newItem: DocumentoSaliente = {
      ...data,
      id_doc_saliente: generateDevId(),
      numero_folio: generateFolioSaliente(data.tipo_doc),
      fecha_creacion: new Date().toISOString(),
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.DOCUMENTOS_SALIENTES, items);
    return newItem;
  },

  update: (id: string, data: Partial<DocumentoSaliente>): DocumentoSaliente | null => {
    const items = getItems<DocumentoSaliente>(STORAGE_KEYS.DOCUMENTOS_SALIENTES);
    const index = items.findIndex(item => item.id_doc_saliente === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data };
    setItems(STORAGE_KEYS.DOCUMENTOS_SALIENTES, items);
    return items[index];
  },

  delete: (id: string): boolean => {
    const items = getItems<DocumentoSaliente>(STORAGE_KEYS.DOCUMENTOS_SALIENTES);
    const filteredItems = items.filter(item => item.id_doc_saliente !== id);
    if (filteredItems.length === items.length) return false;
    setItems(STORAGE_KEYS.DOCUMENTOS_SALIENTES, filteredItems);
    return true;
  },
};

// ============================================================================
// TURNADOS
// ============================================================================

export const devTurnados = {
  getAll: (): Turnado[] => {
    return getItems<Turnado>(STORAGE_KEYS.TURNADOS)
      .sort((a, b) => new Date(b.fecha_turnado).getTime() - new Date(a.fecha_turnado).getTime());
  },

  getById: (id: string): Turnado | undefined => {
    const items = getItems<Turnado>(STORAGE_KEYS.TURNADOS);
    return items.find(item => item.id_turnado === id);
  },

  getByDocumento: (idDoc: string): Turnado[] => {
    return getItems<Turnado>(STORAGE_KEYS.TURNADOS)
      .filter(turn => turn.id_doc_entrante === idDoc)
      .sort((a, b) => new Date(b.fecha_turnado).getTime() - new Date(a.fecha_turnado).getTime());
  },

  getRecibidos: (idUa: string): Turnado[] => {
    return getItems<Turnado>(STORAGE_KEYS.TURNADOS)
      .filter(turn => turn.id_ua_destino === idUa)
      .sort((a, b) => new Date(b.fecha_turnado).getTime() - new Date(a.fecha_turnado).getTime());
  },

  getEnviados: (idUa: string): Turnado[] => {
    return getItems<Turnado>(STORAGE_KEYS.TURNADOS)
      .filter(turn => turn.id_ua_origen === idUa)
      .sort((a, b) => new Date(b.fecha_turnado).getTime() - new Date(a.fecha_turnado).getTime());
  },

  create: (data: Omit<Turnado, 'id_turnado' | 'fecha_creacion' | 'fecha_turnado' | 'estatus_turnado' | 'porcentaje_avance'>): Turnado => {
    const items = getItems<Turnado>(STORAGE_KEYS.TURNADOS);
    const newItem: Turnado = {
      ...data,
      id_turnado: generateDevId(),
      fecha_turnado: new Date().toISOString(),
      fecha_creacion: new Date().toISOString(),
      estatus_turnado: 'Turnado',
      porcentaje_avance: 0,
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.TURNADOS, items);

    // Actualizar estatus del documento
    devDocumentosEntrantes.update(data.id_doc_entrante, { estatus_general: 'En_Proceso' });

    return newItem;
  },

  update: (id: string, data: Partial<Turnado>): Turnado | null => {
    const items = getItems<Turnado>(STORAGE_KEYS.TURNADOS);
    const index = items.findIndex(item => item.id_turnado === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data };
    setItems(STORAGE_KEYS.TURNADOS, items);
    return items[index];
  },

  recibir: (id: string): Turnado | null => {
    return devTurnados.update(id, { estatus_turnado: 'Recibido' });
  },

  rechazar: (id: string, motivo: string): Turnado | null => {
    return devTurnados.update(id, {
      estatus_turnado: 'Rechazado',
      motivo_rechazo: motivo,
      fecha_rechazo: new Date().toISOString(),
    });
  },

  actualizarAvance: (id: string, porcentaje: number, comentario?: string): Turnado | null => {
    const turnado = devTurnados.getById(id);
    if (!turnado) return null;

    // Guardar historial de avance
    const avances = JSON.parse(localStorage.getItem(STORAGE_KEYS.AVANCES) || '[]');
    avances.push({
      id_avance: generateDevId(),
      id_turnado: id,
      porcentaje_anterior: turnado.porcentaje_avance,
      porcentaje_nuevo: porcentaje,
      comentario: comentario || null,
      fecha_avance: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.AVANCES, JSON.stringify(avances));

    const estatus = porcentaje === 100 ? 'Concluido' : 'En_Proceso';
    return devTurnados.update(id, {
      porcentaje_avance: porcentaje,
      estatus_turnado: estatus,
      fecha_ultimo_avance: new Date().toISOString(),
    });
  },
};

// ============================================================================
// INVENTARIO
// ============================================================================

export const devInventario = {
  getAll: (): Inventario[] => {
    return getItems<Inventario>(STORAGE_KEYS.INVENTARIO)
      .sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
  },

  getById: (id: string): Inventario | undefined => {
    const items = getItems<Inventario>(STORAGE_KEYS.INVENTARIO);
    return items.find(item => item.id_inventario === id);
  },

  getByUA: (idUa: string): Inventario[] => {
    return getItems<Inventario>(STORAGE_KEYS.INVENTARIO)
      .filter(inv => inv.id_ua === idUa)
      .sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
  },

  getByCategoria: (categoria: string): Inventario[] => {
    return getItems<Inventario>(STORAGE_KEYS.INVENTARIO)
      .filter(inv => inv.categoria === categoria)
      .sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
  },

  create: (data: Omit<Inventario, 'id_inventario' | 'numero_inventario' | 'fecha_registro' | 'valor_total'>): Inventario => {
    const items = getItems<Inventario>(STORAGE_KEYS.INVENTARIO);
    const newItem: Inventario = {
      ...data,
      id_inventario: generateDevId(),
      numero_inventario: generateNumeroInventario(),
      fecha_registro: new Date().toISOString(),
      valor_total: data.cantidad * data.valor_unitario,
    };
    items.push(newItem);
    setItems(STORAGE_KEYS.INVENTARIO, items);
    return newItem;
  },

  update: (id: string, data: Partial<Inventario>): Inventario | null => {
    const items = getItems<Inventario>(STORAGE_KEYS.INVENTARIO);
    const index = items.findIndex(item => item.id_inventario === id);
    if (index === -1) return null;

    const updatedItem = { ...items[index], ...data };
    // Recalcular valor total si cambiaron cantidad o valor unitario
    if (data.cantidad !== undefined || data.valor_unitario !== undefined) {
      updatedItem.valor_total = updatedItem.cantidad * updatedItem.valor_unitario;
    }

    items[index] = updatedItem;
    setItems(STORAGE_KEYS.INVENTARIO, items);
    return items[index];
  },

  delete: (id: string): boolean => {
    const items = getItems<Inventario>(STORAGE_KEYS.INVENTARIO);
    const filteredItems = items.filter(item => item.id_inventario !== id);
    if (filteredItems.length === items.length) return false;
    setItems(STORAGE_KEYS.INVENTARIO, filteredItems);
    return true;
  },
};

// ============================================================================
// INDICADORES DASHBOARD
// ============================================================================

export const devIndicadores = {
  getDashboard: (idUa?: string) => {
    const turnados = getItems<Turnado>(STORAGE_KEYS.TURNADOS);
    const documentos = getItems<DocumentoEntrante>(STORAGE_KEYS.DOCUMENTOS_ENTRANTES);

    const now = new Date();
    const turnadosActivos = turnados.filter(t => {
      if (idUa && t.id_ua_destino !== idUa) return false;
      return ['Turnado', 'Recibido', 'En_Proceso'].includes(t.estatus_turnado) && t.porcentaje_avance < 100;
    });

    const verdes = turnadosActivos.filter(t => new Date(t.fecha_vencimiento) > new Date(now.getTime() + 86400000 * 3)).length;
    const amarillos = turnadosActivos.filter(t => {
      const venc = new Date(t.fecha_vencimiento);
      return venc >= now && venc <= new Date(now.getTime() + 86400000 * 3);
    }).length;
    const rojos = turnadosActivos.filter(t => new Date(t.fecha_vencimiento) < now).length;

    const promedioAvance = turnadosActivos.length > 0
      ? turnadosActivos.reduce((sum, t) => sum + t.porcentaje_avance, 0) / turnadosActivos.length
      : 0;

    const docsRecientes = documentos
      .filter(d => !d.eliminado && (!idUa || d.id_ua_registro === idUa))
      .slice(0, 5);

    return {
      totalDocumentos: turnadosActivos.length,
      verdes,
      amarillos,
      rojos,
      promedioAvance: Math.round(promedioAvance),
      documentosRecientes: docsRecientes,
    };
  },
};

// Inicializar al importar
initializeDevStorage();
