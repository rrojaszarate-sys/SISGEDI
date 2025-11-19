/**
 * API Route para OCR usando Google Cloud Vision API
 * Extrae texto de imágenes y PDFs
 */

import { NextRequest, NextResponse } from 'next/server'
import { ImageAnnotatorClient } from '@google-cloud/vision'

// Inicializar cliente de Vision API
let visionClient: ImageAnnotatorClient

try {
  // Opción 1: Usar archivo de credenciales (desarrollo)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    })
  }
  // Opción 2: Usar JSON inline (producción - Vercel)
  else if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON)
    visionClient = new ImageAnnotatorClient({
      credentials
    })
  }
  // Opción 3: Default (usa credenciales del sistema)
  else {
    visionClient = new ImageAnnotatorClient()
  }
} catch (error) {
  console.error('Error initializing Vision client:', error)
}

export async function POST(request: NextRequest) {
  try {
    // Obtener archivo del form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 50MB)
    const maxSize = 50 * 1024 * 1024 // 50 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 50MB' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'application/pdf'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo imágenes y PDFs.' },
        { status: 400 }
      )
    }

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Si no hay cliente de Vision, retornar sin OCR
    if (!visionClient) {
      console.warn('Vision API no configurada, retornando sin OCR')
      return NextResponse.json({
        text: null,
        warning: 'OCR no disponible - credenciales de Google Cloud no configuradas'
      })
    }

    // Determinar qué tipo de detección usar
    let detectionType: 'TEXT_DETECTION' | 'DOCUMENT_TEXT_DETECTION' = 'TEXT_DETECTION'

    // Para PDFs o documentos escaneados, usar DOCUMENT_TEXT_DETECTION
    if (file.type === 'application/pdf' || file.name.toLowerCase().includes('scan')) {
      detectionType = 'DOCUMENT_TEXT_DETECTION'
    }

    // Realizar OCR
    const [result] = await visionClient.annotateImage({
      image: { content: buffer },
      features: [
        {
          type: detectionType,
          maxResults: 1
        }
      ],
      imageContext: {
        languageHints: ['es', 'en'] // Español e inglés
      }
    })

    // Extraer texto
    let extractedText = ''

    if (detectionType === 'DOCUMENT_TEXT_DETECTION') {
      // Para documentos, usar fullTextAnnotation
      const fullTextAnnotation = result.fullTextAnnotation
      extractedText = fullTextAnnotation?.text || ''
    } else {
      // Para texto simple, usar textAnnotations
      const textAnnotations = result.textAnnotations
      if (textAnnotations && textAnnotations.length > 0) {
        extractedText = textAnnotations[0].description || ''
      }
    }

    // Limpiar texto extraído
    extractedText = extractedText.trim()

    // Calcular confianza promedio
    let confidence = 0
    if (result.fullTextAnnotation?.pages) {
      const pages = result.fullTextAnnotation.pages
      let totalConfidence = 0
      let wordCount = 0

      pages.forEach(page => {
        page.blocks?.forEach(block => {
          block.paragraphs?.forEach(paragraph => {
            paragraph.words?.forEach(word => {
              if (word.confidence) {
                totalConfidence += word.confidence
                wordCount++
              }
            })
          })
        })
      })

      if (wordCount > 0) {
        confidence = totalConfidence / wordCount
      }
    }

    // Metadata del resultado
    const metadata = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      textLength: extractedText.length,
      confidence: confidence,
      detectionType: detectionType,
      language: result.fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode || 'unknown'
    }

    return NextResponse.json({
      text: extractedText || null,
      metadata,
      success: true
    })

  } catch (error: any) {
    console.error('Error en OCR:', error)

    // Si es error de autenticación de Google
    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      return NextResponse.json(
        {
          error: 'Error de autenticación con Google Cloud Vision API',
          details: 'Verifica tus credenciales de Google Cloud',
          text: null
        },
        { status: 401 }
      )
    }

    // Si es error de cuota excedida
    if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        {
          error: 'Cuota de Google Cloud Vision API excedida',
          text: null
        },
        { status: 429 }
      )
    }

    // Error genérico
    return NextResponse.json(
      {
        error: 'Error procesando OCR',
        details: error.message,
        text: null
      },
      { status: 500 }
    )
  }
}

// Configuración de Next.js para permitir archivos grandes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
}
