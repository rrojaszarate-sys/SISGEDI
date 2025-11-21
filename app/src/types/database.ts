// Tipos para la base de datos SISGEDI

export interface UnidadAdministrativa {
  id_ua: string;
  nombre_ua: string;
  codigo_ua: string | null;
  nivel_jerarquico: number;
  id_ua_superior: string | null;
  direccion: string | null;
  telefono: string | null;
  extension: string | null;
  estatus: boolean;
  fecha_creacion: string;
}

export interface Rol {
  id_rol: string;
  nombre_rol: string;
  descripcion: string | null;
  elementos_menu: Record<string, unknown> | null;
  estatus: boolean;
  fecha_creacion: string;
}

export interface Usuario {
  id_usuario: string;
  clave_servidor_publico: string;
  nombre_completo: string;
  correo_institucional: string;
  telefono: string | null;
  id_ua: string;
  id_rol: string;
  estatus: string;
  fecha_creacion: string;
}

export interface ValorCatalogo {
  id_valor_catalogo: string;
  tipo_catalogo: string;
  valor: string;
  descripcion: string | null;
  es_modificable: boolean;
  orden_presentacion: number;
  estatus: boolean;
  fecha_creacion: string;
}

export interface DocumentoEntrante {
  id_doc_entrante: string;
  folio_interno: string;
  numero_oficio_externo: string | null;
  fecha_documento: string | null;
  fecha_registro: string;
  asunto: string;
  id_prioridad: string | null;
  id_tipo_doc: string | null;
  id_area_remitente: string | null;
  remitente_nombre: string | null;
  remitente_cargo: string | null;
  remitente_institucion: string | null;
  marca_seguimiento: string;
  estatus_general: string;
  id_ua_registro: string;
  id_usuario_registro: string;
  eliminado: boolean;
  fecha_creacion: string;
}

export interface DocumentoSaliente {
  id_doc_saliente: string;
  numero_folio: string;
  tipo_doc: string;
  fecha_elaboracion: string;
  asunto: string;
  contenido_cuerpo: string | null;
  destinatario_nombre: string | null;
  destinatario_cargo: string | null;
  destinatario_institucion: string | null;
  estatus_saliente: string;
  id_ua_emisora: string;
  id_usuario_elabora: string;
  fecha_creacion: string;
}

export interface Turnado {
  id_turnado: string;
  id_doc_entrante: string;
  id_ua_origen: string;
  id_usuario_turno: string;
  id_ua_destino: string;
  fecha_turnado: string;
  instruccion: string | null;
  observaciones: string | null;
  dias_para_atencion: number;
  fecha_vencimiento: string;
  estatus_turnado: string;
  porcentaje_avance: number;
  fecha_creacion: string;
}

export interface Inventario {
  id_inventario: string;
  id_ua: string;
  categoria: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  estado: 'Bueno' | 'Regular' | 'Malo' | 'Baja';
  ubicacion: string;
  responsable: string;
  numero_inventario: string;
  fecha_adquisicion: string;
  valor_unitario: number;
  valor_total: number;
  proveedor: string | null;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  fecha_registro: string;
}

export interface Anexo {
  id_anexo: string;
  id_doc_entrante: string | null;
  id_doc_saliente: string | null;
  nombre_archivo: string;
  storage_path: string;
  tipo_mime: string;
  tamano_bytes: number;
  cargado_por: string;
  fecha_carga: string;
}
