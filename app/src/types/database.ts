export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      cat_unidad_administrativa: {
        Row: {
          id_ua: string;
          nombre_ua: string;
          codigo_ua: string | null;
          nivel_jerarquico: number;
          id_ua_superior: string | null;
          estatus: boolean;
          fecha_creacion: string;
          direccion: string | null;
          telefono: string | null;
          extension: string | null;
        };
        Insert: {
          id_ua?: string;
          nombre_ua: string;
          codigo_ua?: string | null;
          nivel_jerarquico: number;
          id_ua_superior?: string | null;
          estatus?: boolean;
          fecha_creacion?: string;
          direccion?: string | null;
          telefono?: string | null;
          extension?: string | null;
        };
        Update: {
          id_ua?: string;
          nombre_ua?: string;
          codigo_ua?: string | null;
          nivel_jerarquico?: number;
          id_ua_superior?: string | null;
          estatus?: boolean;
          direccion?: string | null;
          telefono?: string | null;
          extension?: string | null;
        };
      };
      cat_roles: {
        Row: {
          id_rol: string;
          nombre_rol: string;
          descripcion: string | null;
          elementos_menu: Json;
          estatus: boolean;
          fecha_creacion: string;
        };
        Insert: {
          id_rol?: string;
          nombre_rol: string;
          descripcion?: string | null;
          elementos_menu?: Json;
          estatus?: boolean;
          fecha_creacion?: string;
        };
        Update: {
          nombre_rol?: string;
          descripcion?: string | null;
          elementos_menu?: Json;
          estatus?: boolean;
        };
      };
      cat_valores_catalogo: {
        Row: {
          id_valor_catalogo: string;
          tipo_catalogo: string;
          valor: string;
          descripcion: string | null;
          orden_presentacion: number;
          es_modificable: boolean;
          estatus: boolean;
          fecha_creacion: string;
        };
        Insert: {
          id_valor_catalogo?: string;
          tipo_catalogo: string;
          valor: string;
          descripcion?: string | null;
          orden_presentacion?: number;
          es_modificable?: boolean;
          estatus?: boolean;
        };
        Update: {
          tipo_catalogo?: string;
          valor?: string;
          descripcion?: string | null;
          orden_presentacion?: number;
          es_modificable?: boolean;
          estatus?: boolean;
        };
      };
      tbl_usuarios: {
        Row: {
          id_usuario: string;
          clave_servidor_publico: string;
          id_ua: string;
          id_rol: string;
          nombre_completo: string;
          correo_institucional: string;
          telefono: string | null;
          intentos_fallidos: number;
          fecha_bloqueo: string | null;
          estatus: 'Activo' | 'Inhabilitado' | 'Suspendido' | 'Eliminado';
          fecha_creacion: string;
          fecha_actualizacion: string;
          ultima_sesion: string | null;
          metadata: Json;
        };
        Insert: {
          id_usuario: string;
          clave_servidor_publico: string;
          id_ua: string;
          id_rol: string;
          nombre_completo: string;
          correo_institucional: string;
          telefono?: string | null;
          intentos_fallidos?: number;
          estatus?: 'Activo' | 'Inhabilitado' | 'Suspendido' | 'Eliminado';
        };
        Update: {
          clave_servidor_publico?: string;
          id_ua?: string;
          id_rol?: string;
          nombre_completo?: string;
          correo_institucional?: string;
          telefono?: string | null;
          estatus?: 'Activo' | 'Inhabilitado' | 'Suspendido' | 'Eliminado';
        };
      };
      tbl_documento_entrante: {
        Row: {
          id_doc_entrante: string;
          numero_oficio_externo: string | null;
          folio_interno: string | null;
          fecha_registro: string;
          fecha_documento: string | null;
          id_ua_registro: string;
          id_usuario_registro: string | null;
          asunto: string;
          id_prioridad: string | null;
          id_tipo_doc: string | null;
          id_area_remitente: string | null;
          remitente_nombre: string | null;
          remitente_cargo: string | null;
          remitente_institucion: string | null;
          marca_seguimiento: 'Turnarse' | 'Archivo' | 'Conocimiento';
          estatus_general: 'Pendiente' | 'En_Proceso' | 'Concluido' | 'Archivado';
          fecha_conclusion: string | null;
          contenido_ocr: string | null;
          metadatos_ocr: Json | null;
          confianza_ocr: number | null;
          eliminado: boolean;
          fecha_eliminacion: string | null;
          eliminado_por: string | null;
          fecha_actualizacion: string;
          actualizado_por: string | null;
        };
        Insert: {
          id_doc_entrante?: string;
          numero_oficio_externo?: string | null;
          folio_interno?: string | null;
          fecha_registro?: string;
          fecha_documento?: string | null;
          id_ua_registro: string;
          id_usuario_registro?: string | null;
          asunto: string;
          id_prioridad?: string | null;
          id_tipo_doc?: string | null;
          id_area_remitente?: string | null;
          remitente_nombre?: string | null;
          remitente_cargo?: string | null;
          remitente_institucion?: string | null;
          marca_seguimiento?: 'Turnarse' | 'Archivo' | 'Conocimiento';
          estatus_general?: 'Pendiente' | 'En_Proceso' | 'Concluido' | 'Archivado';
          contenido_ocr?: string | null;
          metadatos_ocr?: Json | null;
          confianza_ocr?: number | null;
        };
        Update: {
          numero_oficio_externo?: string | null;
          fecha_documento?: string | null;
          asunto?: string;
          id_prioridad?: string | null;
          id_tipo_doc?: string | null;
          id_area_remitente?: string | null;
          remitente_nombre?: string | null;
          remitente_cargo?: string | null;
          remitente_institucion?: string | null;
          marca_seguimiento?: 'Turnarse' | 'Archivo' | 'Conocimiento';
          estatus_general?: 'Pendiente' | 'En_Proceso' | 'Concluido' | 'Archivado';
          contenido_ocr?: string | null;
          metadatos_ocr?: Json | null;
          confianza_ocr?: number | null;
          eliminado?: boolean;
          fecha_eliminacion?: string | null;
          eliminado_por?: string | null;
        };
      };
      tbl_anexos: {
        Row: {
          id_anexo: string;
          id_doc_entrante: string | null;
          nombre_archivo: string;
          storage_path: string;
          bucket_name: string;
          tipo_mime: string | null;
          tamano_bytes: number | null;
          es_alcance: boolean;
          fecha_alcance: string | null;
          descripcion: string | null;
          fecha_carga: string;
          cargado_por: string | null;
        };
        Insert: {
          id_anexo?: string;
          id_doc_entrante?: string | null;
          nombre_archivo: string;
          storage_path: string;
          bucket_name?: string;
          tipo_mime?: string | null;
          tamano_bytes?: number | null;
          es_alcance?: boolean;
          descripcion?: string | null;
        };
        Update: {
          nombre_archivo?: string;
          storage_path?: string;
          tipo_mime?: string | null;
          tamano_bytes?: number | null;
          es_alcance?: boolean;
          descripcion?: string | null;
        };
      };
      tbl_turnado: {
        Row: {
          id_turnado: string;
          id_doc_entrante: string | null;
          id_ua_origen: string;
          id_usuario_turno: string | null;
          id_ua_destino: string;
          fecha_turnado: string;
          instruccion: string | null;
          observaciones: string | null;
          fecha_vencimiento: string;
          dias_para_atencion: number | null;
          porcentaje_avance: number;
          fecha_ultimo_avance: string | null;
          estatus_turnado: 'Turnado' | 'Recibido' | 'En_Proceso' | 'Concluido' | 'Rechazado';
          id_firma_recepcion: string | null;
          fecha_firma_recepcion: string | null;
          hash_recepcion: string | null;
          motivo_rechazo: string | null;
          fecha_rechazo: string | null;
          rechazado_por: string | null;
          ua_sugerida_ia: string | null;
          confianza_ia: number | null;
          fecha_actualizacion: string;
        };
        Insert: {
          id_turnado?: string;
          id_doc_entrante?: string | null;
          id_ua_origen: string;
          id_usuario_turno?: string | null;
          id_ua_destino: string;
          fecha_turnado?: string;
          instruccion?: string | null;
          observaciones?: string | null;
          fecha_vencimiento: string;
          dias_para_atencion?: number | null;
          porcentaje_avance?: number;
          estatus_turnado?: 'Turnado' | 'Recibido' | 'En_Proceso' | 'Concluido' | 'Rechazado';
        };
        Update: {
          id_ua_destino?: string;
          instruccion?: string | null;
          observaciones?: string | null;
          fecha_vencimiento?: string;
          dias_para_atencion?: number | null;
          porcentaje_avance?: number;
          estatus_turnado?: 'Turnado' | 'Recibido' | 'En_Proceso' | 'Concluido' | 'Rechazado';
          motivo_rechazo?: string | null;
        };
      };
      tbl_avance: {
        Row: {
          id_avance: string;
          id_turnado: string | null;
          porcentaje_anterior: number | null;
          porcentaje_nuevo: number;
          comentario: string | null;
          fecha_avance: string;
          registrado_por: string | null;
        };
        Insert: {
          id_avance?: string;
          id_turnado?: string | null;
          porcentaje_anterior?: number | null;
          porcentaje_nuevo: number;
          comentario?: string | null;
        };
        Update: {
          porcentaje_nuevo?: number;
          comentario?: string | null;
        };
      };
      tbl_documento_saliente: {
        Row: {
          id_doc_saliente: string;
          tipo_doc: 'Oficio' | 'Nota_Informativa' | 'Circular' | 'Memorandum';
          numero_folio: string;
          ejercicio_fiscal: number;
          asunto: string;
          destinatario_nombre: string | null;
          destinatario_cargo: string | null;
          destinatario_institucion: string | null;
          contenido: string | null;
          id_ua_emisora: string;
          id_usuario_elabora: string | null;
          fecha_elaboracion: string;
          estatus_saliente: 'Borrador' | 'Firmado' | 'Enviado' | 'Cancelado' | 'Reactivado';
          fecha_envio: string | null;
          id_firma_emision: string | null;
          fecha_firma_emision: string | null;
          hash_documento: string | null;
          tiene_acuse: boolean;
          storage_path_acuse: string | null;
          fecha_acuse: string | null;
          fue_reactivado: boolean;
          fecha_reactivacion: string | null;
          motivo_reactivacion: string | null;
          storage_path: string | null;
          fecha_actualizacion: string;
          actualizado_por: string | null;
        };
        Insert: {
          id_doc_saliente?: string;
          tipo_doc: 'Oficio' | 'Nota_Informativa' | 'Circular' | 'Memorandum';
          numero_folio?: string;
          ejercicio_fiscal: number;
          asunto: string;
          destinatario_nombre?: string | null;
          destinatario_cargo?: string | null;
          destinatario_institucion?: string | null;
          contenido?: string | null;
          id_ua_emisora: string;
        };
        Update: {
          tipo_doc?: 'Oficio' | 'Nota_Informativa' | 'Circular' | 'Memorandum';
          asunto?: string;
          destinatario_nombre?: string | null;
          destinatario_cargo?: string | null;
          destinatario_institucion?: string | null;
          contenido?: string | null;
          estatus_saliente?: 'Borrador' | 'Firmado' | 'Enviado' | 'Cancelado' | 'Reactivado';
        };
      };
      tbl_notificaciones: {
        Row: {
          id_notificacion: string;
          id_usuario: string;
          tipo_notificacion: string;
          titulo: string;
          mensaje: string;
          id_doc_entrante: string | null;
          id_turnado: string | null;
          leida: boolean;
          fecha_lectura: string | null;
          enviada_email: boolean;
          fecha_envio_email: string | null;
          fecha_creacion: string;
        };
        Insert: {
          id_notificacion?: string;
          id_usuario: string;
          tipo_notificacion: string;
          titulo: string;
          mensaje: string;
          id_doc_entrante?: string | null;
          id_turnado?: string | null;
        };
        Update: {
          leida?: boolean;
          fecha_lectura?: string | null;
        };
      };
      tbl_inventario: {
        Row: {
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
          imagen_storage_path: string | null;
          fecha_registro: string;
          fecha_actualizacion: string;
        };
        Insert: {
          id_inventario?: string;
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
          proveedor?: string | null;
          marca?: string | null;
          modelo?: string | null;
          serie?: string | null;
        };
        Update: {
          categoria?: string;
          descripcion?: string;
          cantidad?: number;
          unidad?: string;
          estado?: 'Bueno' | 'Regular' | 'Malo' | 'Baja';
          ubicacion?: string;
          responsable?: string;
          fecha_adquisicion?: string;
          valor_unitario?: number;
          proveedor?: string | null;
          marca?: string | null;
          modelo?: string | null;
          serie?: string | null;
        };
      };
      tbl_log_auditoria: {
        Row: {
          id_log: number;
          id_usuario: string | null;
          ip_origen: string | null;
          user_agent: string | null;
          modulo: string;
          accion: string;
          descripcion: string | null;
          tabla_afectada: string | null;
          id_registro_afectado: string | null;
          datos_anteriores: Json | null;
          datos_nuevos: Json | null;
          fecha_hora: string;
        };
        Insert: {
          id_usuario?: string | null;
          ip_origen?: string | null;
          user_agent?: string | null;
          modulo: string;
          accion: string;
          descripcion?: string | null;
          tabla_afectada?: string | null;
          id_registro_afectado?: string | null;
          datos_anteriores?: Json | null;
          datos_nuevos?: Json | null;
        };
        Update: never;
      };
    };
    Functions: {
      search_documentos: {
        Args: { p_query: string; p_id_ua?: string; p_limit?: number };
        Returns: {
          id_doc_entrante: string;
          folio_interno: string;
          asunto: string;
          remitente_nombre: string;
          fecha_registro: string;
          rank: number;
        }[];
      };
      obtener_indicadores_dashboard: {
        Args: { p_id_ua: string };
        Returns: {
          total_documentos: number;
          verdes: number;
          amarillos: number;
          rojos: number;
          promedio_avance: number;
        }[];
      };
    };
  };
}

// Tipos auxiliares
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Tipos específicos para uso común
export type UnidadAdministrativa = Tables<'cat_unidad_administrativa'>;
export type Rol = Tables<'cat_roles'>;
export type ValorCatalogo = Tables<'cat_valores_catalogo'>;
export type Usuario = Tables<'tbl_usuarios'>;
export type DocumentoEntrante = Tables<'tbl_documento_entrante'>;
export type Anexo = Tables<'tbl_anexos'>;
export type Turnado = Tables<'tbl_turnado'>;
export type Avance = Tables<'tbl_avance'>;
export type DocumentoSaliente = Tables<'tbl_documento_saliente'>;
export type Notificacion = Tables<'tbl_notificaciones'>;
export type Inventario = Tables<'tbl_inventario'>;
export type LogAuditoria = Tables<'tbl_log_auditoria'>;

// Tipos con relaciones
export interface UsuarioConRelaciones extends Usuario {
  cat_unidad_administrativa?: UnidadAdministrativa;
  cat_roles?: Rol;
}

export interface DocumentoEntranteConRelaciones extends DocumentoEntrante {
  cat_unidad_administrativa?: UnidadAdministrativa;
  tbl_usuarios?: Usuario;
  prioridad?: ValorCatalogo;
  tipo_documento?: ValorCatalogo;
  area_remitente?: ValorCatalogo;
  tbl_anexos?: Anexo[];
  tbl_turnado?: Turnado[];
}

export interface TurnadoConRelaciones extends Turnado {
  tbl_documento_entrante?: DocumentoEntrante;
  ua_origen?: UnidadAdministrativa;
  ua_destino?: UnidadAdministrativa;
  tbl_avance?: Avance[];
}
