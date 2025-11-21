#!/usr/bin/env tsx

import { createPool, testConnection, executeQuery } from '../backend/database/config.js';
import { faker } from '@faker-js/faker/locale/es_MX';
import fakerData from '../backend/seed/faker-data.js';
import pg from 'pg';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

interface SeedConfig {
  unidadesAdministrativas: number;
  usuariosPorUA: number;
  documentosEntrantes: number;
  documentosSalientes: number;
  turnadosPorDoc: number;
}

const defaultConfig: SeedConfig = {
  unidadesAdministrativas: 20,
  usuariosPorUA: 5,
  documentosEntrantes: 100,
  documentosSalientes: 50,
  turnadosPorDoc: 3
};

// IDs generados para referencias
let rolesIds: string[] = [];
let unidadesIds: string[] = [];
let usuariosIds: string[] = [];
let catalogoIds: { [key: string]: string[] } = {};

/**
 * Obtener IDs de roles
 */
async function obtenerRoles(pool: pg.Pool): Promise<void> {
  log.section('📋 Obteniendo roles del sistema...');

  const roles = await executeQuery<{ id_rol: string; nombre_rol: string }>(
    pool,
    'SELECT id_rol, nombre_rol FROM cat_roles ORDER BY nombre_rol'
  );

  rolesIds = roles.map(r => r.id_rol);
  log.success(`Se encontraron ${roles.length} roles:`);
  roles.forEach(r => log.info(`  - ${r.nombre_rol}`));
}

/**
 * Obtener valores de catálogos
 */
async function obtenerCatalogos(pool: pg.Pool): Promise<void> {
  log.section('📚 Obteniendo catálogos del sistema...');

  const tipos = ['Prioridad', 'Tipo_Documento', 'Area_Remitente'];

  for (const tipo of tipos) {
    const valores = await executeQuery<{ id_valor: string; valor: string }>(
      pool,
      'SELECT id_valor, valor FROM cat_valores_catalogo WHERE tipo_catalogo = $1',
      [tipo]
    );

    catalogoIds[tipo] = valores.map(v => v.id_valor);
    log.success(`Catálogo '${tipo}': ${valores.length} valores`);
  }
}

/**
 * Generar Unidades Administrativas
 */
async function generarUnidadesAdministrativas(
  pool: pg.Pool,
  cantidad: number
): Promise<void> {
  log.section('🏛️  Generando Unidades Administrativas...');

  // Crear jerarquía: primero nivel 1, luego 2, 3, 4
  const distribucion = {
    1: Math.ceil(cantidad * 0.1), // 10% Subsecretarías
    2: Math.ceil(cantidad * 0.2), // 20% Direcciones Generales
    3: Math.ceil(cantidad * 0.4), // 40% Direcciones
    4: cantidad - Math.ceil(cantidad * 0.1) - Math.ceil(cantidad * 0.2) - Math.ceil(cantidad * 0.4) // 30% Jefaturas
  };

  let contador = 0;
  const uasPorNivel: { [key: number]: string[] } = { 1: [], 2: [], 3: [], 4: [] };

  for (let nivel = 1; nivel <= 4; nivel++) {
    const cantidadNivel = distribucion[nivel as keyof typeof distribucion];

    for (let i = 0; i < cantidadNivel; i++) {
      contador++;
      const nombreUA = fakerData.generarNombreUA(nivel);
      const codigoUA = fakerData.generarCodigoUA(nivel, contador);

      // Determinar superior jerárquico
      let idUASuperior = null;
      if (nivel > 1) {
        const nivelSuperior = nivel - 1;
        const superiores = uasPorNivel[nivelSuperior];
        if (superiores.length > 0) {
          idUASuperior = faker.helpers.arrayElement(superiores);
        }
      }

      const result = await executeQuery<{ id_ua: string }>(
        pool,
        `INSERT INTO cat_unidad_administrativa
         (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion, telefono, extension)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id_ua`,
        [
          nombreUA,
          codigoUA,
          nivel,
          idUASuperior,
          fakerData.generarDireccionOficina(),
          fakerData.generarTelefonoOficial(),
          fakerData.generarExtension()
        ]
      );

      const idUA = result[0].id_ua;
      unidadesIds.push(idUA);
      uasPorNivel[nivel].push(idUA);

      log.info(`  [Nivel ${nivel}] ${nombreUA} (${codigoUA})`);
    }
  }

  log.success(`${contador} Unidades Administrativas creadas`);
}

/**
 * Generar Usuarios
 */
async function generarUsuarios(pool: pg.Pool, usuariosPorUA: number): Promise<void> {
  log.section('👥 Generando Usuarios...');

  let contador = 0;

  for (const idUA of unidadesIds) {
    for (let i = 0; i < usuariosPorUA; i++) {
      contador++;
      const nombreCompleto = fakerData.generarNombreCompleto();
      const claveServidorPublico = fakerData.generarClaveServidorPublico(contador);
      const correo = fakerData.generarCorreoInstitucional(nombreCompleto);

      // Asignar rol aleatorio (más peso a roles operativos)
      const rolesConPeso = [
        ...Array(5).fill(rolesIds[2]), // Recepción (más común)
        ...Array(3).fill(rolesIds[3]), // Nivel 1
        ...Array(3).fill(rolesIds[4]), // Nivel 2
        ...Array(2).fill(rolesIds[5]), // Nivel 3
        rolesIds[1], // Admin UA (menos común)
        rolesIds[6]  // Visor
      ];

      const idRol = faker.helpers.arrayElement(rolesConPeso);

      const result = await executeQuery<{ id_usuario: string }>(
        pool,
        `INSERT INTO tbl_usuarios
         (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional,
          password_hash, estatus)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id_usuario`,
        [
          claveServidorPublico,
          idUA,
          idRol,
          nombreCompleto,
          correo,
          '$2a$10$' + faker.string.alphanumeric(53), // Hash bcrypt simulado
          'Activo'
        ]
      );

      usuariosIds.push(result[0].id_usuario);
    }
  }

  log.success(`${contador} Usuarios creados`);
}

/**
 * Generar Documentos Entrantes
 */
async function generarDocumentosEntrantes(
  pool: pg.Pool,
  cantidad: number
): Promise<string[]> {
  log.section('📥 Generando Documentos Entrantes...');

  const documentosIds: string[] = [];

  for (let i = 0; i < cantidad; i++) {
    const asunto = fakerData.generarAsuntoDocumento();
    const contenidoOCR = fakerData.generarContenidoOCR(asunto);
    const metadatosOCR = fakerData.generarMetadatosOCR();

    const idUARegistro = faker.helpers.arrayElement(unidadesIds);
    const usuariosUA = usuariosIds; // Simplificado
    const idUsuarioRegistro = faker.helpers.arrayElement(usuariosUA);

    const prioridad = faker.helpers.arrayElement(catalogoIds['Prioridad'] || []);
    const tipoDoc = faker.helpers.arrayElement(catalogoIds['Tipo_Documento'] || []);
    const areaRemitente = faker.helpers.arrayElement(catalogoIds['Area_Remitente'] || []);

    const fechaDocumento = faker.date.recent({ days: 60 });
    const remitente = fakerData.generarNombreCompleto();
    const institucion = fakerData.generarInstitucionGubernamental();
    const numeroOficio = fakerData.generarNumeroOficioExterno(institucion);

    const marcaSeguimiento = faker.helpers.arrayElement(['Turnarse', 'Archivo', 'Conocimiento']);
    const estatusGeneral = faker.helpers.weightedArrayElement([
      { value: 'Pendiente', weight: 2 },
      { value: 'En_Proceso', weight: 5 },
      { value: 'Concluido', weight: 2 },
      { value: 'Archivado', weight: 1 }
    ]);

    const result = await executeQuery<{ id_doc_entrante: string }>(
      pool,
      `INSERT INTO tbl_documento_entrante
       (numero_oficio_externo, fecha_documento, id_ua_registro, id_usuario_registro,
        asunto, id_prioridad, id_tipo_doc, id_area_remitente,
        remitente_nombre, remitente_cargo, remitente_institucion,
        marca_seguimiento, estatus_general, contenido_ocr, metadatos_ocr, confianza_ocr)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id_doc_entrante`,
      [
        numeroOficio,
        fechaDocumento,
        idUARegistro,
        idUsuarioRegistro,
        asunto,
        prioridad,
        tipoDoc,
        areaRemitente,
        remitente,
        faker.helpers.arrayElement(['Director General', 'Titular', 'Coordinador', 'Secretario']),
        institucion,
        marcaSeguimiento,
        estatusGeneral,
        contenidoOCR,
        JSON.stringify(metadatosOCR),
        metadatosOCR.confidence
      ]
    );

    documentosIds.push(result[0].id_doc_entrante);

    // Generar anexos (30% de probabilidad)
    if (faker.datatype.boolean({ probability: 0.3 })) {
      const numAnexos = faker.number.int({ min: 1, max: 3 });
      for (let j = 0; j < numAnexos; j++) {
        const tipo = faker.helpers.arrayElement(['pdf', 'docx', 'xlsx', 'jpg']);
        const nombreArchivo = fakerData.generarNombreArchivo(tipo as any);
        const { bytes, mb } = fakerData.generarTamanoArchivo(tipo);

        await executeQuery(
          pool,
          `INSERT INTO tbl_anexos
           (id_doc_entrante, nombre_archivo, url_storage, tipo_mime, tamano_bytes, tamano_mb, es_alcance)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            result[0].id_doc_entrante,
            nombreArchivo,
            `documents/${result[0].id_doc_entrante}/${nombreArchivo}`,
            `application/${tipo}`,
            bytes,
            parseFloat(mb),
            faker.datatype.boolean({ probability: 0.1 })
          ]
        );
      }
    }

    if ((i + 1) % 20 === 0) {
      log.info(`  Generados ${i + 1}/${cantidad} documentos...`);
    }
  }

  log.success(`${cantidad} Documentos Entrantes creados`);
  return documentosIds;
}

/**
 * Generar Turnados
 */
async function generarTurnados(
  pool: pg.Pool,
  documentosIds: string[],
  turnadosPorDoc: number
): Promise<void> {
  log.section('🔄 Generando Turnados...');

  let contador = 0;

  for (const idDocEntrante of documentosIds) {
    const numTurnados = faker.number.int({ min: 1, max: turnadosPorDoc });

    let uaOrigenActual = faker.helpers.arrayElement(unidadesIds);

    for (let i = 0; i < numTurnados; i++) {
      const uaDestino = faker.helpers.arrayElement(
        unidadesIds.filter(id => id !== uaOrigenActual)
      );

      const usuarioTurno = faker.helpers.arrayElement(usuariosIds);
      const instruccion = fakerData.generarInstruccionTurnado();
      const diasAtencion = faker.number.int({ min: 3, max: 15 });
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + diasAtencion);

      const porcentajeAvance = faker.helpers.arrayElement([0, 25, 50, 75, 100]);
      const estatusTurnado = faker.helpers.weightedArrayElement([
        { value: 'Turnado', weight: 1 },
        { value: 'Recibido', weight: 2 },
        { value: 'En_Proceso', weight: 4 },
        { value: 'Concluido', weight: 2 },
        { value: 'Rechazado', weight: 1 }
      ]);

      await executeQuery(
        pool,
        `INSERT INTO tbl_turnado
         (id_doc_entrante, id_ua_origen, id_ua_destino, id_usuario_turno,
          instruccion, fecha_vencimiento, dias_para_atencion, porcentaje_avance, estatus_turnado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          idDocEntrante,
          uaOrigenActual,
          uaDestino,
          usuarioTurno,
          instruccion,
          fechaVencimiento,
          diasAtencion,
          porcentajeAvance,
          estatusTurnado
        ]
      );

      uaOrigenActual = uaDestino; // Siguiente turnado desde el destino
      contador++;
    }
  }

  log.success(`${contador} Turnados creados`);
}

/**
 * Generar Documentos Salientes
 */
async function generarDocumentosSalientes(
  pool: pg.Pool,
  cantidad: number,
  documentosEntrantesIds: string[]
): Promise<void> {
  log.section('📤 Generando Documentos Salientes...');

  for (let i = 0; i < cantidad; i++) {
    const tipoDoc = faker.helpers.arrayElement(['Oficio', 'Nota_Informativa', 'Circular', 'Memorandum']);
    const ejercicioFiscal = new Date().getFullYear();
    const asunto = fakerData.generarAsuntoDocumento();
    const destinatario = fakerData.generarNombreCompleto();
    const cargo = faker.helpers.arrayElement(['Director General', 'Titular', 'Coordinador']);
    const institucion = fakerData.generarInstitucionGubernamental();
    const contenido = fakerData.generarContenidoOCR(asunto);

    const idUAEmisora = faker.helpers.arrayElement(unidadesIds);
    const idUsuarioElabora = faker.helpers.arrayElement(usuariosIds);

    const estatusSaliente = faker.helpers.weightedArrayElement([
      { value: 'Borrador', weight: 2 },
      { value: 'Firmado', weight: 3 },
      { value: 'Enviado', weight: 4 },
      { value: 'Cancelado', weight: 1 }
    ]);

    const result = await executeQuery<{ id_doc_saliente: string }>(
      pool,
      `INSERT INTO tbl_documento_saliente
       (tipo_doc, ejercicio_fiscal, asunto, destinatario_nombre, destinatario_cargo,
        destinatario_institucion, contenido, id_ua_emisora, id_usuario_elabora, estatus_saliente)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id_doc_saliente`,
      [tipoDoc, ejercicioFiscal, asunto, destinatario, cargo, institucion, contenido,
       idUAEmisora, idUsuarioElabora, estatusSaliente]
    );

    // 40% de probabilidad de ser respuesta a documento entrante
    if (faker.datatype.boolean({ probability: 0.4 }) && documentosEntrantesIds.length > 0) {
      const idDocEntrante = faker.helpers.arrayElement(documentosEntrantesIds);

      await executeQuery(
        pool,
        `INSERT INTO tbl_relacion_respuesta (id_doc_saliente, id_doc_entrante, tipo_relacion)
         VALUES ($1, $2, $3)`,
        [result[0].id_doc_saliente, idDocEntrante, 'Respuesta']
      );
    }

    if ((i + 1) % 10 === 0) {
      log.info(`  Generados ${i + 1}/${cantidad} documentos salientes...`);
    }
  }

  log.success(`${cantidad} Documentos Salientes creados`);
}

/**
 * Generar Notificaciones
 */
async function generarNotificaciones(pool: pg.Pool): Promise<void> {
  log.section('🔔 Generando Notificaciones...');

  const tiposNotif = ['Vencimiento', 'Turnado', 'Rechazo', 'Firma'];
  let contador = 0;

  for (const idUsuario of usuariosIds.slice(0, 50)) { // Solo primeros 50 usuarios
    const numNotif = faker.number.int({ min: 0, max: 5 });

    for (let i = 0; i < numNotif; i++) {
      const tipo = faker.helpers.arrayElement(tiposNotif);
      const titulo = `Notificación de ${tipo}`;
      const mensaje = `Se le notifica sobre un evento de tipo ${tipo}.`;
      const leida = faker.datatype.boolean();

      await executeQuery(
        pool,
        `INSERT INTO tbl_notificaciones
         (id_usuario, tipo_notificacion, titulo, mensaje, leida, enviada_email)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [idUsuario, tipo, titulo, mensaje, leida, faker.datatype.boolean()]
      );

      contador++;
    }
  }

  log.success(`${contador} Notificaciones creadas`);
}

/**
 * Función principal de seed
 */
async function main() {
  console.log(`
${colors.bright}${colors.cyan}
╔════════════════════════════════════════╗
║   SISGEDI 2.0 - Seed Database          ║
║   Generación de Datos Aleatorios       ║
╚════════════════════════════════════════╝
${colors.reset}
  `);

  const args = process.argv.slice(2);
  const isFull = args.includes('--full');

  const config: SeedConfig = isFull
    ? {
        unidadesAdministrativas: 50,
        usuariosPorUA: 10,
        documentosEntrantes: 500,
        documentosSalientes: 200,
        turnadosPorDoc: 5
      }
    : defaultConfig;

  log.info(`Modo: ${isFull ? 'COMPLETO' : 'ESTÁNDAR'}`);
  log.info(`Configuración:`);
  log.info(`  - Unidades Administrativas: ${config.unidadesAdministrativas}`);
  log.info(`  - Usuarios por UA: ${config.usuariosPorUA}`);
  log.info(`  - Documentos Entrantes: ${config.documentosEntrantes}`);
  log.info(`  - Documentos Salientes: ${config.documentosSalientes}`);
  log.info(`  - Turnados por Documento: ${config.turnadosPorDoc}`);

  const pool = createPool();

  try {
    // Verificar conexión
    log.section('🔌 Verificando conexión a la base de datos...');
    const connected = await testConnection(pool);

    if (!connected) {
      log.error('No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Obtener datos base
    await obtenerRoles(pool);
    await obtenerCatalogos(pool);

    // Generar datos
    await generarUnidadesAdministrativas(pool, config.unidadesAdministrativas);
    await generarUsuarios(pool, config.usuariosPorUA);
    const documentosEntrantesIds = await generarDocumentosEntrantes(pool, config.documentosEntrantes);
    await generarTurnados(pool, documentosEntrantesIds, config.turnadosPorDoc);
    await generarDocumentosSalientes(pool, config.documentosSalientes, documentosEntrantesIds);
    await generarNotificaciones(pool);

    // Resumen final
    log.section('📊 Resumen de Datos Generados');
    log.success(`Unidades Administrativas: ${unidadesIds.length}`);
    log.success(`Usuarios: ${usuariosIds.length}`);
    log.success(`Documentos Entrantes: ${documentosEntrantesIds.length}`);
    log.success(`Documentos Salientes: ${config.documentosSalientes}`);

    log.section('✅ Seed completado exitosamente!');

  } catch (error) {
    log.error('Error durante el proceso de seed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar
main();
