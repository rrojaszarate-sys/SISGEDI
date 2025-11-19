import { faker } from '@faker-js/faker/locale/es_MX';

// Configurar Faker para español de México
faker.seed(12345); // Seed para reproducibilidad

/**
 * Genera nombres de unidades administrativas realistas
 */
export function generarNombreUA(nivel: number): string {
  const prefijos = {
    1: ['Subsecretaría de', 'Coordinación General de'],
    2: ['Dirección General de', 'Dirección General Adjunta de'],
    3: ['Dirección de', 'Subdirección de'],
    4: ['Jefatura de', 'Departamento de']
  };

  const areas = [
    'Gestión Documental',
    'Recursos Humanos',
    'Tecnologías de la Información',
    'Administración y Finanzas',
    'Asuntos Jurídicos',
    'Planeación y Evaluación',
    'Comunicación Social',
    'Servicios Generales',
    'Control Interno',
    'Transparencia',
    'Archivo General',
    'Atención Ciudadana',
    'Normatividad',
    'Capacitación',
    'Presupuesto',
    'Contabilidad',
    'Adquisiciones',
    'Infraestructura',
    'Desarrollo Organizacional',
    'Innovación Gubernamental'
  ];

  const prefijo = faker.helpers.arrayElement(prefijos[nivel as keyof typeof prefijos] || prefijos[4]);
  const area = faker.helpers.arrayElement(areas);

  return `${prefijo} ${area}`;
}

/**
 * Genera códigos de unidad administrativa
 */
export function generarCodigoUA(nivel: number, index: number): string {
  const prefijoNivel = {
    1: 'SS',
    2: 'DG',
    3: 'DIR',
    4: 'JEF'
  };

  return `${prefijoNivel[nivel as keyof typeof prefijoNivel] || 'UA'}-${String(index).padStart(3, '0')}`;
}

/**
 * Genera nombres completos de servidores públicos
 */
export function generarNombreCompleto(): string {
  const nombre = faker.person.firstName();
  const apellidoPaterno = faker.person.lastName();
  const apellidoMaterno = faker.person.lastName();

  return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`;
}

/**
 * Genera claves de servidor público (estilo gobierno mexicano)
 */
export function generarClaveServidorPublico(index: number): string {
  const prefijo = faker.helpers.arrayElement(['SP', 'CS', 'EP']);
  const anio = faker.date.between({ from: '2020-01-01', to: '2025-01-01' }).getFullYear();
  const numero = String(index).padStart(5, '0');

  return `${prefijo}${anio}${numero}`;
}

/**
 * Genera correos institucionales
 */
export function generarCorreoInstitucional(nombreCompleto: string): string {
  const partes = nombreCompleto.toLowerCase().split(' ');
  const nombre = partes[0];
  const apellido = partes[1] || partes[0];

  const dominios = [
    'economia.gob.mx',
    'gob.mx',
    'funcionpublica.gob.mx'
  ];

  const dominio = faker.helpers.arrayElement(dominios);

  return `${nombre}.${apellido}@${dominio}`;
}

/**
 * Genera números de oficio externos
 */
export function generarNumeroOficioExterno(institucion: string): string {
  const prefijo = institucion.substring(0, 3).toUpperCase();
  const numero = faker.number.int({ min: 100, max: 9999 });
  const anio = new Date().getFullYear();

  return `${prefijo}/${numero}/${anio}`;
}

/**
 * Genera nombres de instituciones gubernamentales
 */
export function generarInstitucionGubernamental(): string {
  const tipos = [
    'Secretaría de',
    'Comisión Nacional de',
    'Instituto Nacional de',
    'Procuraduría',
    'Fiscalía General de',
    'Gobierno del Estado de',
    'H. Ayuntamiento de'
  ];

  const areas = [
    'Hacienda y Crédito Público',
    'Educación Pública',
    'Salud',
    'Desarrollo Social',
    'Economía',
    'Trabajo y Previsión Social',
    'Medio Ambiente',
    'Energía',
    'Agricultura',
    'Turismo',
    'Cultura',
    'Comunicaciones y Transportes',
    'Seguridad Pública',
    'Justicia',
    'Transparencia',
    'Jalisco',
    'Nuevo León',
    'Ciudad de México',
    'Guadalajara',
    'Monterrey'
  ];

  const tipo = faker.helpers.arrayElement(tipos);
  const area = faker.helpers.arrayElement(areas);

  return `${tipo} ${area}`;
}

/**
 * Genera asuntos de documentos oficiales
 */
export function generarAsuntoDocumento(): string {
  const verbos = [
    'Se solicita',
    'Se requiere',
    'Se informa',
    'Se envía',
    'Se remite',
    'Se notifica',
    'Se comunica',
    'Se solicita opinión sobre',
    'Se da respuesta a',
    'Se atiende'
  ];

  const temas = [
    'información sobre el ejercicio presupuestal',
    'documentación complementaria del proyecto',
    'el estado que guarda el programa',
    'la designación de enlace administrativo',
    'el calendario de actividades',
    'la propuesta de reforma',
    'los lineamientos actualizados',
    'el informe trimestral',
    'la solicitud de transparencia',
    'los avances del convenio',
    'la integración del comité',
    'el programa de trabajo',
    'los términos de referencia',
    'la validación técnica',
    'el dictamen jurídico'
  ];

  const verbo = faker.helpers.arrayElement(verbos);
  const tema = faker.helpers.arrayElement(temas);

  return `${verbo} ${tema}.`;
}

/**
 * Genera contenido OCR simulado
 */
export function generarContenidoOCR(asunto: string): string {
  const fecha = faker.date.recent({ days: 30 }).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
Ciudad de México, a ${fecha}

${asunto}

Por medio del presente y en atención a su oficio de fecha reciente, me permito hacer de su conocimiento lo siguiente:

${faker.lorem.paragraphs(2)}

Sin otro particular, quedo de usted.

ATENTAMENTE
${generarNombreCompleto()}
${faker.helpers.arrayElement(['Director General', 'Titular de la Unidad', 'Coordinador', 'Jefe de Departamento'])}
  `.trim();
}

/**
 * Genera metadatos OCR
 */
export function generarMetadatosOCR() {
  return {
    entities: {
      fechas: [faker.date.recent({ days: 30 }).toISOString()],
      personas: [generarNombreCompleto()],
      instituciones: [generarInstitucionGubernamental()],
      locations: [faker.location.city()]
    },
    confidence: faker.number.float({ min: 0.85, max: 0.99, fractionDigits: 2 }),
    language: 'es',
    pages: faker.number.int({ min: 1, max: 5 })
  };
}

/**
 * Genera nombres de archivo
 */
export function generarNombreArchivo(tipo: 'pdf' | 'docx' | 'xlsx' | 'jpg' | 'png'): string {
  const bases = [
    'oficio',
    'anexo',
    'evidencia',
    'documento',
    'comprobante',
    'reporte',
    'acta'
  ];

  const base = faker.helpers.arrayElement(bases);
  const numero = faker.number.int({ min: 1, max: 999 });

  return `${base}_${numero}.${tipo}`;
}

/**
 * Genera tamaño de archivos en bytes
 */
export function generarTamanoArchivo(tipo: string): { bytes: number; mb: string } {
  const rangos = {
    pdf: { min: 100000, max: 5000000 },
    docx: { min: 50000, max: 2000000 },
    xlsx: { min: 30000, max: 1000000 },
    jpg: { min: 200000, max: 3000000 },
    png: { min: 300000, max: 4000000 }
  };

  const rango = rangos[tipo as keyof typeof rangos] || { min: 100000, max: 1000000 };
  const bytes = faker.number.int(rango);
  const mb = (bytes / 1048576).toFixed(2);

  return { bytes, mb };
}

/**
 * Genera instrucciones de turnado
 */
export function generarInstruccionTurnado(): string {
  const instrucciones = [
    'Para su atención y seguimiento correspondiente.',
    'Para los fines procedentes.',
    'Para su conocimiento y efectos legales.',
    'Para dar respuesta en un plazo no mayor a 5 días hábiles.',
    'Para elaborar dictamen técnico.',
    'Para elaborar opinión jurídica.',
    'Para su análisis y opinión.',
    'Para integrar expediente.',
    'Para dar seguimiento y reportar avances.',
    'Para coordinación de acciones.',
    'Para validación técnica.',
    'Para firma del titular.',
    'Para archivo definitivo.',
    'Urgente: Para atención inmediata.',
    'Para revisión y visto bueno.'
  ];

  return faker.helpers.arrayElement(instrucciones);
}

/**
 * Genera comentarios de avance
 */
export function generarComentarioAvance(porcentaje: number): string {
  const comentarios = {
    25: [
      'Se ha iniciado la revisión del documento.',
      'Se recibió y se está analizando.',
      'En proceso de recopilación de información.'
    ],
    50: [
      'Se ha avanzado en la elaboración del borrador.',
      'Se están coordinando las áreas involucradas.',
      'En proceso de validación interna.'
    ],
    75: [
      'Se ha concluido el borrador, en proceso de revisión final.',
      'Pendiente de firma del titular.',
      'En espera de validación jurídica.'
    ],
    100: [
      'Asunto atendido y concluido satisfactoriamente.',
      'Se dio respuesta mediante oficio.',
      'Documentación integrada en expediente.'
    ]
  };

  const grupo = porcentaje >= 75 ? 75 : porcentaje >= 50 ? 50 : porcentaje >= 25 ? 25 : 25;
  const opciones = comentarios[grupo as keyof typeof comentarios];

  return faker.helpers.arrayElement(opciones);
}

/**
 * Genera direcciones de oficinas gubernamentales
 */
export function generarDireccionOficina(): string {
  const calles = [
    'Avenida Insurgentes',
    'Paseo de la Reforma',
    'Avenida Juárez',
    'Eje Central Lázaro Cárdenas',
    'Avenida Constituyentes'
  ];

  const calle = faker.helpers.arrayElement(calles);
  const numero = faker.number.int({ min: 100, max: 9999 });
  const colonia = faker.location.streetAddress();
  const cp = faker.number.int({ min: 1000, max: 99999 });

  return `${calle} No. ${numero}, Col. ${colonia}, C.P. ${cp}, Ciudad de México`;
}

/**
 * Genera números de teléfono oficiales
 */
export function generarTelefonoOficial(): string {
  return `55-${faker.number.int({ min: 1000, max: 9999 })}-${faker.number.int({ min: 1000, max: 9999 })}`;
}

/**
 * Genera extensiones telefónicas
 */
export function generarExtension(): string {
  return String(faker.number.int({ min: 1000, max: 9999 }));
}

export default {
  generarNombreUA,
  generarCodigoUA,
  generarNombreCompleto,
  generarClaveServidorPublico,
  generarCorreoInstitucional,
  generarNumeroOficioExterno,
  generarInstitucionGubernamental,
  generarAsuntoDocumento,
  generarContenidoOCR,
  generarMetadatosOCR,
  generarNombreArchivo,
  generarTamanoArchivo,
  generarInstruccionTurnado,
  generarComentarioAvance,
  generarDireccionOficina,
  generarTelefonoOficial,
  generarExtension
};
