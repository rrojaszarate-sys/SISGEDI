// ============================================================================
// SISGEDI 2.0 - Edge Function: OCR Processor
// Descripción: Procesa documentos con Google Vision API para extracción de texto
// RF6: Alta Inteligente de Documentos
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Tipos
interface OCRRequest {
  fileUrl: string
  documentId?: string
}

interface OCRResponse {
  success: boolean
  text: string
  entities: {
    asunto?: string
    remitente?: string
    fecha?: string
    numeroOficio?: string
  }
  classification: {
    tipoDoc?: string
    prioridad?: string
    confidence: number
  }
  error?: string
}

// Función principal
serve(async (req: Request) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Validar método
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Obtener datos del request
    const { fileUrl, documentId }: OCRRequest = await req.json()

    if (!fileUrl) {
      throw new Error('fileUrl es requerido')
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // TODO: Implementar llamada a Google Vision API
    // Por ahora, retornamos datos de prueba
    const mockResponse: OCRResponse = {
      success: true,
      text: 'Contenido extraído del documento (mock)',
      entities: {
        asunto: 'Asunto del documento extraído por OCR',
        remitente: 'Nombre del remitente',
        fecha: new Date().toISOString(),
        numeroOficio: 'OF-2025-001',
      },
      classification: {
        tipoDoc: 'Oficio',
        prioridad: 'Normal',
        confidence: 0.85,
      },
    }

    // Si se proporciona documentId, actualizar en la base de datos
    if (documentId) {
      await supabase
        .from('tbl_documento_entrante')
        .update({
          contenido_ocr: mockResponse.text,
          asunto: mockResponse.entities.asunto,
          remitente_nombre: mockResponse.entities.remitente,
        })
        .eq('id_doc_entrante', documentId)
    }

    return new Response(JSON.stringify(mockResponse), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('Error en OCR processor:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

// Helper functions (para implementación futura con Google Vision)

// function extractWithRegex(text: string, regex: RegExp): string {
//   const match = text.match(regex)
//   return match ? match[1].trim() : ''
// }

// function classifyDocumentType(text: string): string {
//   const keywords = {
//     'Oficio': ['oficio', 'of.'],
//     'Circular': ['circular', 'circ.'],
//     'Memorándum': ['memorándum', 'memo'],
//     'Nota Informativa': ['nota informativa']
//   }

//   for (const [tipo, kws] of Object.entries(keywords)) {
//     if (kws.some(kw => text.toLowerCase().includes(kw))) {
//       return tipo
//     }
//   }

//   return 'Desconocido'
// }

// function predictPriority(text: string): string {
//   const urgentKeywords = ['urgente', 'inmediato', 'prioritario', 'emergencia']
//   const lowerText = text.toLowerCase()
//   return urgentKeywords.some(kw => lowerText.includes(kw)) ? 'Urgente' : 'Normal'
// }
