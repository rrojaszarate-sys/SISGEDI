#!/usr/bin/env tsx

import { createPool, testConnection } from '../backend/database/config.js';
import fs from 'fs/promises';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

async function main() {
  console.log(`
${colors.bright}${colors.red}
╔════════════════════════════════════════╗
║   SISGEDI 2.0 - Reset Database         ║
║   ¡ADVERTENCIA! Elimina todos los datos║
╚════════════════════════════════════════╝
${colors.reset}
  `);

  const pool = createPool();

  try {
    log.info('Verificando conexión...');
    const connected = await testConnection(pool);

    if (!connected) {
      log.error('No se pudo conectar a la base de datos');
      process.exit(1);
    }

    log.warning('Eliminando todos los datos de las tablas...');

    // Eliminar datos en orden correcto (respetando FKs)
    const tablasOrdenadas = [
      'tbl_log_auditoria',
      'tbl_sesiones',
      'tbl_notificaciones',
      'tbl_avance',
      'tbl_firmas',
      'tbl_relacion_respuesta',
      'tbl_documento_saliente',
      'tbl_turnado',
      'tbl_anexos',
      'tbl_documento_entrante',
      'tbl_inventario',
      'tbl_usuarios',
      'cat_valores_catalogo',
      'cat_unidad_administrativa',
      'cat_roles'
    ];

    for (const tabla of tablasOrdenadas) {
      try {
        await pool.query(`TRUNCATE TABLE ${tabla} CASCADE`);
        log.success(`Tabla ${tabla} limpiada`);
      } catch (error: any) {
        if (error.code === '42P01') {
          log.warning(`Tabla ${tabla} no existe`);
        } else {
          throw error;
        }
      }
    }

    log.success('Base de datos reiniciada exitosamente');
    log.info('Ejecuta "npm run seed" para generar nuevos datos de prueba');

  } catch (error) {
    log.error('Error durante el reset:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
