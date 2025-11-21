/**
 * Tipos de TypeScript generados para la base de datos SISGEDI 2.0
 * Basados en el esquema híbrido optimizado (16 tablas)
 * Estos tipos proporcionan autocompletado y verificación de tipos
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ========================================================================
      // CATÁLOGOS BASE
      // ========================================================================

      cat_diasinhabiles: {
        Row: {
          id_dia_inhabil: string
          fecha: string
          descripcion: string | null
          tipo: string | null
          estatus: boolean | null
          fecha_creacion: string | null
        }
        Insert: {
          id_dia_inhabil?: string
          fecha: string
          descripcion?: string | null
          tipo?: string | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
        Update: {
          id_dia_inhabil?: string
          fecha?: string
          descripcion?: string | null
          tipo?: string | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
      }

      cat_semaforo: {
        Row: {
          id_semaforo: string
          porcentaje_vencimiento: number
          color: string
          descripcion: string | null
          estatus: boolean | null
        }
        Insert: {
          id_semaforo?: string
          porcentaje_vencimiento: number
          color: string
          descripcion?: string | null
          estatus?: boolean | null
        }
        Update: {
          id_semaforo?: string
          porcentaje_vencimiento?: number
          color?: string
          descripcion?: string | null
          estatus?: boolean | null
        }
      }

      cat_unidad_administrativa: {
        Row: {
          id_ua: string
          nombre_ua: string
          codigo_ua: string | null
          nivel_jerarquico: number
          id_ua_superior: string | null
          abreviatura: string | null
          direccion: string | null
          telefono: string | null
          extension: string | null
          color_identifica: string | null
          puede_turnar: boolean | null
          folio_automatico: boolean | null
          estatus: boolean | null
          fecha_creacion: string | null
        }
        Insert: {
          id_ua?: string
          nombre_ua: string
          codigo_ua?: string | null
          nivel_jerarquico: number
          id_ua_superior?: string | null
          abreviatura?: string | null
          direccion?: string | null
          telefono?: string | null
          extension?: string | null
          color_identifica?: string | null
          puede_turnar?: boolean | null
          folio_automatico?: boolean | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
        Update: {
          id_ua?: string
          nombre_ua?: string
          codigo_ua?: string | null
          nivel_jerarquico?: number
          id_ua_superior?: string | null
          abreviatura?: string | null
          direccion?: string | null
          telefono?: string | null
          extension?: string | null
          color_identifica?: string | null
          puede_turnar?: boolean | null
          folio_automatico?: boolean | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
      }

      cat_roles: {
        Row: {
          id_rol: string
          nombre_rol: string
          descripcion: string | null
          permisos: Json
          estatus: boolean | null
          fecha_creacion: string | null
        }
        Insert: {
          id_rol?: string
          nombre_rol: string
          descripcion?: string | null
          permisos?: Json
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
        Update: {
          id_rol?: string
          nombre_rol?: string
          descripcion?: string | null
          permisos?: Json
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
      }

      cat_valores_catalogo: {
        Row: {
          id_valor_catalogo: string
          tipo_catalogo: string
          valor: string
          codigo: string | null
          descripcion: string | null
          orden: number | null
          metadata: Json | null
          es_modificable: boolean | null
          estatus: boolean | null
          fecha_creacion: string | null
        }
        Insert: {
          id_valor_catalogo?: string
          tipo_catalogo: string
          valor: string
          codigo?: string | null
          descripcion?: string | null
          orden?: number | null
          metadata?: Json | null
          es_modificable?: boolean | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
        Update: {
          id_valor_catalogo?: string
          tipo_catalogo?: string
          valor?: string
          codigo?: string | null
          descripcion?: string | null
          orden?: number | null
          metadata?: Json | null
          es_modificable?: boolean | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
      }

      cat_area_remitente: {
        Row: {
          id_area_remitente: string
          nombre_area: string
          tipo: string | null
          estatus: boolean | null
          fecha_creacion: string | null
        }
        Insert: {
          id_area_remitente?: string
          nombre_area: string
          tipo?: string | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
        Update: {
          id_area_remitente?: string
          nombre_area?: string
          tipo?: string | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
      }

      cat_remitente: {
        Row: {
          id_remitente: string
          nombre_completo: string
          cargo: string | null
          email: string | null
          telefono: string | null
          id_area_remitente: string | null
          estatus: boolean | null
          fecha_creacion: string | null
        }
        Insert: {
          id_remitente?: string
          nombre_completo: string
          cargo?: string | null
          email?: string | null
          telefono?: string | null
          id_area_remitente?: string | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
        Update: {
          id_remitente?: string
          nombre_completo?: string
          cargo?: string | null
          email?: string | null
          telefono?: string | null
          id_area_remitente?: string | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
      }

      // ========================================================================
      // USUARIOS Y SESIONES
      // ========================================================================

      tbl_usuarios: {
        Row: {
          id_usuario: string
          clave_servidor_publico: string | null
          curp: string | null
          nombre_completo: string
          id_ua: string
          id_rol: string
          correo_institucional: string
          telefono: string | null
          extension: string | null
          estatus: string | null
          fecha_creacion: string | null
          fecha_actualizacion: string | null
          ultimo_acceso: string | null
          metadata: Json | null
        }
        Insert: {
          id_usuario: string
          clave_servidor_publico?: string | null
          curp?: string | null
          nombre_completo: string
          id_ua: string
          id_rol: string
          correo_institucional: string
          telefono?: string | null
          extension?: string | null
          estatus?: string | null
          fecha_creacion?: string | null
          fecha_actualizacion?: string | null
          ultimo_acceso?: string | null
          metadata?: Json | null
        }
        Update: {
          id_usuario?: string
          clave_servidor_publico?: string | null
          curp?: string | null
          nombre_completo?: string
          id_ua?: string
          id_rol?: string
          correo_institucional?: string
          telefono?: string | null
          extension?: string | null
          estatus?: string | null
          fecha_creacion?: string | null
          fecha_actualizacion?: string | null
          ultimo_acceso?: string | null
          metadata?: Json | null
        }
      }

      tbl_sesiones: {
        Row: {
          id_sesion: string
          id_usuario: string
          ip_address: string | null
          user_agent: string | null
          fecha_inicio: string | null
          fecha_fin: string | null
          activa: boolean | null
        }
        Insert: {
          id_sesion?: string
          id_usuario: string
          ip_address?: string | null
          user_agent?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          activa?: boolean | null
        }
        Update: {
          id_sesion?: string
          id_usuario?: string
          ip_address?: string | null
          user_agent?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          activa?: boolean | null
        }
      }

      // ========================================================================
      // DOCUMENTOS
      // ========================================================================

      tbl_documento_entrante: {
        Row: {
          id_doc_entrante: string
          folio_interno: string | null
          numero_oficio_externo: string | null
          folio_externo: string | null
          asunto: string
          observaciones: string | null
          numero_fojas: string | null
          fecha_documento: string | null
          fecha_recepcion: string
          fecha_registro: string | null
          storage_path: string | null
          bucket_name: string | null
          nombre_archivo: string | null
          tipo_mime: string | null
          tamano_bytes: number | null
          hash_archivo: string | null
          contenido_ocr: string | null
          metadatos_ocr: Json | null
          confianza_ocr: number | null
          ts_contenido_ocr: unknown | null
          id_prioridad: string | null
          id_tipo_doc: string | null
          id_tipo_asunto: string | null
          id_remitente: string | null
          id_ua_destinataria: string
          marca_seguimiento: string | null
          estatus_general: string | null
          id_usuario_registro: string | null
          fecha_actualizacion: string | null
          // Campos de compatibilidad con frontend (deprecated - usar relación a cat_remitente)
          remitente_nombre: string | null
          remitente_cargo: string | null
          remitente_institucion: string | null
          numero_anexos: number | null
        }
        Insert: {
          id_doc_entrante?: string
          folio_interno?: string | null
          numero_oficio_externo?: string | null
          folio_externo?: string | null
          asunto: string
          observaciones?: string | null
          numero_fojas?: string | null
          fecha_documento?: string | null
          fecha_recepcion: string
          fecha_registro?: string | null
          storage_path?: string | null
          bucket_name?: string | null
          nombre_archivo?: string | null
          tipo_mime?: string | null
          tamano_bytes?: number | null
          hash_archivo?: string | null
          contenido_ocr?: string | null
          metadatos_ocr?: Json | null
          confianza_ocr?: number | null
          ts_contenido_ocr?: unknown | null
          id_prioridad?: string | null
          id_tipo_doc?: string | null
          id_tipo_asunto?: string | null
          id_remitente?: string | null
          id_ua_destinataria: string
          marca_seguimiento?: string | null
          estatus_general?: string | null
          id_usuario_registro?: string | null
          fecha_actualizacion?: string | null
          remitente_nombre?: string | null
          remitente_cargo?: string | null
          remitente_institucion?: string | null
          numero_anexos?: number | null
        }
        Update: {
          id_doc_entrante?: string
          folio_interno?: string | null
          numero_oficio_externo?: string | null
          folio_externo?: string | null
          asunto?: string
          observaciones?: string | null
          numero_fojas?: string | null
          fecha_documento?: string | null
          fecha_recepcion?: string
          fecha_registro?: string | null
          storage_path?: string | null
          bucket_name?: string | null
          nombre_archivo?: string | null
          tipo_mime?: string | null
          tamano_bytes?: number | null
          hash_archivo?: string | null
          contenido_ocr?: string | null
          metadatos_ocr?: Json | null
          confianza_ocr?: number | null
          ts_contenido_ocr?: unknown | null
          id_prioridad?: string | null
          id_tipo_doc?: string | null
          id_tipo_asunto?: string | null
          id_remitente?: string | null
          id_ua_destinataria?: string
          marca_seguimiento?: string | null
          estatus_general?: string | null
          id_usuario_registro?: string | null
          fecha_actualizacion?: string | null
          remitente_nombre?: string | null
          remitente_cargo?: string | null
          remitente_institucion?: string | null
          numero_anexos?: number | null
        }
      }

      tbl_anexos: {
        Row: {
          id_anexo: string
          id_doc_entrante: string | null
          nombre_archivo: string
          descripcion: string | null
          storage_path: string
          bucket_name: string | null
          tipo_mime: string | null
          tamano_bytes: number | null
          hash_archivo: string | null
          fecha_carga: string | null
          cargado_por: string | null
        }
        Insert: {
          id_anexo?: string
          id_doc_entrante?: string | null
          nombre_archivo: string
          descripcion?: string | null
          storage_path: string
          bucket_name?: string | null
          tipo_mime?: string | null
          tamano_bytes?: number | null
          hash_archivo?: string | null
          fecha_carga?: string | null
          cargado_por?: string | null
        }
        Update: {
          id_anexo?: string
          id_doc_entrante?: string | null
          nombre_archivo?: string
          descripcion?: string | null
          storage_path?: string
          bucket_name?: string | null
          tipo_mime?: string | null
          tamano_bytes?: number | null
          hash_archivo?: string | null
          fecha_carga?: string | null
          cargado_por?: string | null
        }
      }

      tbl_turnado: {
        Row: {
          id_turnado: string
          id_doc_entrante: string | null
          id_ua_origen: string
          id_usuario_turno: string | null
          id_ua_destino: string
          instruccion: string
          fecha_turnado: string | null
          dias_atencion: number
          fecha_vencimiento: string
          porcentaje_avance: number | null
          estatus_turnado: string | null
          revisado: boolean | null
          observacion_rechazo: string | null
          fecha_actualizacion: string | null
        }
        Insert: {
          id_turnado?: string
          id_doc_entrante?: string | null
          id_ua_origen: string
          id_usuario_turno?: string | null
          id_ua_destino: string
          instruccion: string
          fecha_turnado?: string | null
          dias_atencion?: number
          fecha_vencimiento: string
          porcentaje_avance?: number | null
          estatus_turnado?: string | null
          revisado?: boolean | null
          observacion_rechazo?: string | null
          fecha_actualizacion?: string | null
        }
        Update: {
          id_turnado?: string
          id_doc_entrante?: string | null
          id_ua_origen?: string
          id_usuario_turno?: string | null
          id_ua_destino?: string
          instruccion?: string
          fecha_turnado?: string | null
          dias_atencion?: number
          fecha_vencimiento?: string
          porcentaje_avance?: number | null
          estatus_turnado?: string | null
          revisado?: boolean | null
          observacion_rechazo?: string | null
          fecha_actualizacion?: string | null
        }
      }

      tbl_documento_saliente: {
        Row: {
          id_doc_saliente: string
          tipo_doc: string
          numero_folio: string
          ejercicio_fiscal: number
          asunto: string
          contenido: string | null
          destinatario_nombre: string | null
          destinatario_cargo: string | null
          id_remitente_destino: string | null
          id_ua_emisora: string
          id_usuario_elabora: string | null
          id_doc_entrante_ref: string | null
          storage_path: string | null
          bucket_name: string | null
          hash_archivo: string | null
          estatus_saliente: string | null
          fecha_elaboracion: string | null
          fecha_envio: string | null
          fecha_actualizacion: string | null
        }
        Insert: {
          id_doc_saliente?: string
          tipo_doc: string
          numero_folio: string
          ejercicio_fiscal: number
          asunto: string
          contenido?: string | null
          destinatario_nombre?: string | null
          destinatario_cargo?: string | null
          id_remitente_destino?: string | null
          id_ua_emisora: string
          id_usuario_elabora?: string | null
          id_doc_entrante_ref?: string | null
          storage_path?: string | null
          bucket_name?: string | null
          hash_archivo?: string | null
          estatus_saliente?: string | null
          fecha_elaboracion?: string | null
          fecha_envio?: string | null
          fecha_actualizacion?: string | null
        }
        Update: {
          id_doc_saliente?: string
          tipo_doc?: string
          numero_folio?: string
          ejercicio_fiscal?: number
          asunto?: string
          contenido?: string | null
          destinatario_nombre?: string | null
          destinatario_cargo?: string | null
          id_remitente_destino?: string | null
          id_ua_emisora?: string
          id_usuario_elabora?: string | null
          id_doc_entrante_ref?: string | null
          storage_path?: string | null
          bucket_name?: string | null
          hash_archivo?: string | null
          estatus_saliente?: string | null
          fecha_elaboracion?: string | null
          fecha_envio?: string | null
          fecha_actualizacion?: string | null
        }
      }

      tbl_notificaciones: {
        Row: {
          id_notificacion: string
          id_usuario: string
          tipo_notificacion: string
          titulo: string
          mensaje: string
          referencia_tipo: string | null
          referencia_id: string | null
          leida: boolean | null
          fecha_leida: string | null
          fecha_creacion: string | null
        }
        Insert: {
          id_notificacion?: string
          id_usuario: string
          tipo_notificacion: string
          titulo: string
          mensaje: string
          referencia_tipo?: string | null
          referencia_id?: string | null
          leida?: boolean | null
          fecha_leida?: string | null
          fecha_creacion?: string | null
        }
        Update: {
          id_notificacion?: string
          id_usuario?: string
          tipo_notificacion?: string
          titulo?: string
          mensaje?: string
          referencia_tipo?: string | null
          referencia_id?: string | null
          leida?: boolean | null
          fecha_leida?: string | null
          fecha_creacion?: string | null
        }
      }

      // ========================================================================
      // INVENTARIO
      // ========================================================================

      tbl_inventario: {
        Row: {
          id_inventario: string
          categoria: string
          subcategoria: string | null
          descripcion: string
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          cantidad: number
          unidad: string
          estado: string
          id_ua: string
          ubicacion_fisica: string
          responsable: string
          numero_inventario: string
          numero_factura: string | null
          fecha_adquisicion: string
          valor_unitario: number
          valor_total: number
          proveedor: string | null
          imagen_storage_path: string | null
          bucket_name: string | null
          metadata: Json | null
          estatus: boolean | null
          fecha_registro: string | null
          fecha_actualizacion: string | null
        }
        Insert: {
          id_inventario?: string
          categoria: string
          subcategoria?: string | null
          descripcion: string
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          cantidad?: number
          unidad?: string
          estado: string
          id_ua: string
          ubicacion_fisica: string
          responsable: string
          numero_inventario: string
          numero_factura?: string | null
          fecha_adquisicion: string
          valor_unitario: number
          valor_total: number
          proveedor?: string | null
          imagen_storage_path?: string | null
          bucket_name?: string | null
          metadata?: Json | null
          estatus?: boolean | null
          fecha_registro?: string | null
          fecha_actualizacion?: string | null
        }
        Update: {
          id_inventario?: string
          categoria?: string
          subcategoria?: string | null
          descripcion?: string
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          cantidad?: number
          unidad?: string
          estado?: string
          id_ua?: string
          ubicacion_fisica?: string
          responsable?: string
          numero_inventario?: string
          numero_factura?: string | null
          fecha_adquisicion?: string
          valor_unitario?: number
          valor_total?: number
          proveedor?: string | null
          imagen_storage_path?: string | null
          bucket_name?: string | null
          metadata?: Json | null
          estatus?: boolean | null
          fecha_registro?: string | null
          fecha_actualizacion?: string | null
        }
      }

      // ========================================================================
      // AUDITORÍA
      // ========================================================================

      tbl_log_auditoria: {
        Row: {
          id_log: number
          id_usuario: string | null
          modulo: string
          accion: string
          descripcion: string | null
          tabla_afectada: string | null
          registro_id: string | null
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          ip_address: string | null
          user_agent: string | null
          fecha_hora: string | null
        }
        Insert: {
          id_log?: number
          id_usuario?: string | null
          modulo: string
          accion: string
          descripcion?: string | null
          tabla_afectada?: string | null
          registro_id?: string | null
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          fecha_hora?: string | null
        }
        Update: {
          id_log?: number
          id_usuario?: string | null
          modulo?: string
          accion?: string
          descripcion?: string | null
          tabla_afectada?: string | null
          registro_id?: string | null
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          fecha_hora?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_fecha_vencimiento: {
        Args: {
          p_fecha_inicio: string
          p_dias_habiles: number
        }
        Returns: string
      }
      search_documentos: {
        Args: {
          p_query: string
          p_id_ua?: string
          p_estatus?: string
          p_fecha_inicio?: string
          p_fecha_fin?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id_doc_entrante: string
          folio_interno: string
          asunto: string
          fecha_recepcion: string
          estatus_general: string
          rank: number
        }[]
      }
      generar_inventario_aleatorio: {
        Args: {
          p_cantidad?: number
        }
        Returns: {
          total_generado: number
          valor_total_inventario: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
