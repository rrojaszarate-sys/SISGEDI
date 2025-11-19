/**
 * Tipos de TypeScript generados para la base de datos SISGEDI
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
      cat_unidad_administrativa: {
        Row: {
          id_ua: string
          nombre_ua: string
          codigo_ua: string | null
          nivel_jerarquico: number
          id_ua_superior: string | null
          estatus: boolean | null
          fecha_creacion: string | null
          direccion: string | null
          telefono: string | null
          extension: string | null
        }
        Insert: {
          id_ua?: string
          nombre_ua: string
          codigo_ua?: string | null
          nivel_jerarquico: number
          id_ua_superior?: string | null
          estatus?: boolean | null
          fecha_creacion?: string | null
          direccion?: string | null
          telefono?: string | null
          extension?: string | null
        }
        Update: {
          id_ua?: string
          nombre_ua?: string
          codigo_ua?: string | null
          nivel_jerarquico?: number
          id_ua_superior?: string | null
          estatus?: boolean | null
          fecha_creacion?: string | null
          direccion?: string | null
          telefono?: string | null
          extension?: string | null
        }
      }
      cat_roles: {
        Row: {
          id_rol: string
          nombre_rol: string
          descripcion: string | null
          elementos_menu: Json
          estatus: boolean | null
          fecha_creacion: string | null
        }
        Insert: {
          id_rol?: string
          nombre_rol: string
          descripcion?: string | null
          elementos_menu?: Json
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
        Update: {
          id_rol?: string
          nombre_rol?: string
          descripcion?: string | null
          elementos_menu?: Json
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
      }
      cat_valores_catalogo: {
        Row: {
          id_valor_catalogo: string
          tipo_catalogo: string
          valor: string
          descripcion: string | null
          es_modificable: boolean | null
          estatus: boolean | null
          fecha_creacion: string | null
        }
        Insert: {
          id_valor_catalogo?: string
          tipo_catalogo: string
          valor: string
          descripcion?: string | null
          es_modificable?: boolean | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
        Update: {
          id_valor_catalogo?: string
          tipo_catalogo?: string
          valor?: string
          descripcion?: string | null
          es_modificable?: boolean | null
          estatus?: boolean | null
          fecha_creacion?: string | null
        }
      }
      tbl_usuarios: {
        Row: {
          id_usuario: string
          clave_servidor_publico: string
          id_ua: string
          id_rol: string
          nombre_completo: string
          correo_institucional: string
          telefono: string | null
          estatus: string | null
          fecha_creacion: string | null
          fecha_actualizacion: string | null
          metadata: Json | null
        }
        Insert: {
          id_usuario?: string
          clave_servidor_publico: string
          id_ua: string
          id_rol: string
          nombre_completo: string
          correo_institucional: string
          telefono?: string | null
          estatus?: string | null
          fecha_creacion?: string | null
          fecha_actualizacion?: string | null
          metadata?: Json | null
        }
        Update: {
          id_usuario?: string
          clave_servidor_publico?: string
          id_ua?: string
          id_rol?: string
          nombre_completo?: string
          correo_institucional?: string
          telefono?: string | null
          estatus?: string | null
          fecha_creacion?: string | null
          fecha_actualizacion?: string | null
          metadata?: Json | null
        }
      }
      tbl_documento_entrante: {
        Row: {
          id_doc_entrante: string
          numero_oficio_externo: string | null
          folio_interno: string | null
          fecha_registro: string | null
          fecha_documento: string | null
          id_ua_registro: string
          id_usuario_registro: string | null
          asunto: string
          id_prioridad: string | null
          id_tipo_doc: string | null
          remitente_nombre: string | null
          remitente_cargo: string | null
          remitente_institucion: string | null
          numero_anexos: number | null
          observaciones: string | null
          estatus: string | null
          metadata: Json | null
          contenido_ocr: string | null
        }
        Insert: {
          id_doc_entrante?: string
          numero_oficio_externo?: string | null
          folio_interno?: string | null
          fecha_registro?: string | null
          fecha_documento?: string | null
          id_ua_registro: string
          id_usuario_registro?: string | null
          asunto: string
          id_prioridad?: string | null
          id_tipo_doc?: string | null
          remitente_nombre?: string | null
          remitente_cargo?: string | null
          remitente_institucion?: string | null
          numero_anexos?: number | null
          observaciones?: string | null
          estatus?: string | null
          metadata?: Json | null
          contenido_ocr?: string | null
        }
        Update: {
          id_doc_entrante?: string
          numero_oficio_externo?: string | null
          folio_interno?: string | null
          fecha_registro?: string | null
          fecha_documento?: string | null
          id_ua_registro?: string
          id_usuario_registro?: string | null
          asunto?: string
          id_prioridad?: string | null
          id_tipo_doc?: string | null
          remitente_nombre?: string | null
          remitente_cargo?: string | null
          remitente_institucion?: string | null
          numero_anexos?: number | null
          observaciones?: string | null
          estatus?: string | null
          metadata?: Json | null
          contenido_ocr?: string | null
        }
      }
      tbl_inventario: {
        Row: {
          id_inventario: string
          id_ua: string
          numero_inventario: string | null
          categoria: string
          nombre_bien: string
          descripcion: string | null
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          fecha_adquisicion: string | null
          valor_adquisicion: number | null
          estado_conservacion: string | null
          ubicacion_fisica: string | null
          resguardante: string | null
          observaciones: string | null
          ruta_foto: string | null
          estatus: string | null
          fecha_registro: string | null
          metadata: Json | null
        }
        Insert: {
          id_inventario?: string
          id_ua: string
          numero_inventario?: string | null
          categoria: string
          nombre_bien: string
          descripcion?: string | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          fecha_adquisicion?: string | null
          valor_adquisicion?: number | null
          estado_conservacion?: string | null
          ubicacion_fisica?: string | null
          resguardante?: string | null
          observaciones?: string | null
          ruta_foto?: string | null
          estatus?: string | null
          fecha_registro?: string | null
          metadata?: Json | null
        }
        Update: {
          id_inventario?: string
          id_ua?: string
          numero_inventario?: string | null
          categoria?: string
          nombre_bien?: string
          descripcion?: string | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          fecha_adquisicion?: string | null
          valor_adquisicion?: number | null
          estado_conservacion?: string | null
          ubicacion_fisica?: string | null
          resguardante?: string | null
          observaciones?: string | null
          ruta_foto?: string | null
          estatus?: string | null
          fecha_registro?: string | null
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_documentos: {
        Args: {
          termino_busqueda: string
        }
        Returns: {
          tipo: string
          id: string
          folio: string
          asunto: string
          fecha: string
          ranking: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
