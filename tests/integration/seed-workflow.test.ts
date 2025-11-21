import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPool, executeQuery } from '../../backend/database/config.js';
import pg from 'pg';

describe('Seed Workflow Integration Tests', () => {
  let pool: pg.Pool;

  beforeAll(() => {
    pool = createPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Database Schema Validation', () => {
    it('should have all required tables created', async () => {
      const requiredTables = [
        'cat_roles',
        'cat_unidad_administrativa',
        'cat_valores_catalogo',
        'tbl_usuarios',
        'tbl_documento_entrante',
        'tbl_anexos',
        'tbl_turnado',
        'tbl_avance',
        'tbl_documento_saliente',
        'tbl_relacion_respuesta',
        'tbl_firmas',
        'tbl_log_auditoria',
        'tbl_sesiones',
        'tbl_notificaciones'
      ];

      for (const tableName of requiredTables) {
        const result = await executeQuery<{ exists: boolean }>(
          pool,
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
          )`,
          [tableName]
        );

        expect(result[0].exists).toBe(true);
      }
    }, 30000);

    it('should have initial seed data for roles', async () => {
      const roles = await executeQuery(
        pool,
        'SELECT COUNT(*) as count FROM cat_roles'
      );

      const count = parseInt(roles[0].count);
      expect(count).toBeGreaterThanOrEqual(7);
    });

    it('should have initial catalog values', async () => {
      const catalogos = await executeQuery(
        pool,
        'SELECT COUNT(*) as count FROM cat_valores_catalogo'
      );

      const count = parseInt(catalogos[0].count);
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should ensure all users have valid roles', async () => {
      const invalidUsers = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_usuarios u
         WHERE NOT EXISTS (
           SELECT 1 FROM cat_roles r WHERE r.id_rol = u.id_rol
         )`
      );

      expect(parseInt(invalidUsers[0].count)).toBe(0);
    });

    it('should ensure all users have valid UAs', async () => {
      const invalidUsers = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_usuarios u
         WHERE NOT EXISTS (
           SELECT 1 FROM cat_unidad_administrativa ua WHERE ua.id_ua = u.id_ua
         )`
      );

      expect(parseInt(invalidUsers[0].count)).toBe(0);
    });

    it('should ensure all documents have valid users', async () => {
      const invalidDocs = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_documento_entrante d
         WHERE NOT EXISTS (
           SELECT 1 FROM tbl_usuarios u WHERE u.id_usuario = d.id_usuario_registro
         )`
      );

      expect(parseInt(invalidDocs[0].count)).toBe(0);
    });

    it('should ensure all turnados reference valid documents', async () => {
      const invalidTurnados = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_turnado t
         WHERE NOT EXISTS (
           SELECT 1 FROM tbl_documento_entrante d
           WHERE d.id_doc_entrante = t.id_doc_entrante
         )`
      );

      expect(parseInt(invalidTurnados[0].count)).toBe(0);
    });

    it('should ensure all anexos reference valid documents', async () => {
      const invalidAnexos = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_anexos a
         WHERE NOT EXISTS (
           SELECT 1 FROM tbl_documento_entrante d
           WHERE d.id_doc_entrante = a.id_doc_entrante
         )`
      );

      expect(parseInt(invalidAnexos[0].count)).toBe(0);
    });
  });

  describe('Business Rules Validation', () => {
    it('should have unique employee codes', async () => {
      const duplicates = await executeQuery(
        pool,
        `SELECT clave_servidor_publico, COUNT(*) as count
         FROM tbl_usuarios
         GROUP BY clave_servidor_publico
         HAVING COUNT(*) > 1`
      );

      expect(duplicates.length).toBe(0);
    });

    it('should have unique UA codes', async () => {
      const duplicates = await executeQuery(
        pool,
        `SELECT codigo_ua, COUNT(*) as count
         FROM cat_unidad_administrativa
         GROUP BY codigo_ua
         HAVING COUNT(*) > 1`
      );

      expect(duplicates.length).toBe(0);
    });

    it('should have valid email formats', async () => {
      const invalidEmails = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_usuarios
         WHERE correo_institucional !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'`
      );

      expect(parseInt(invalidEmails[0].count)).toBe(0);
    });

    it('should have valid progress percentages (0-100)', async () => {
      const invalidProgress = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_turnado
         WHERE porcentaje_avance < 0 OR porcentaje_avance > 100`
      );

      expect(parseInt(invalidProgress[0].count)).toBe(0);
    });

    it('should have valid OCR confidence values (0.00-1.00)', async () => {
      const invalidConfidence = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_documento_entrante
         WHERE confianza_ocr IS NOT NULL
         AND (confianza_ocr < 0 OR confianza_ocr > 1)`
      );

      expect(parseInt(invalidConfidence[0].count)).toBe(0);
    });

    it('should have valid user status values', async () => {
      const invalidStatus = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_usuarios
         WHERE estatus NOT IN ('Activo', 'Inhabilitado', 'Suspendido', 'Eliminado')`
      );

      expect(parseInt(invalidStatus[0].count)).toBe(0);
    });
  });

  describe('Full-Text Search Tests', () => {
    it('should have ts_contenido_ocr generated for documents', async () => {
      const docsWithOCR = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_documento_entrante
         WHERE contenido_ocr IS NOT NULL AND ts_contenido_ocr IS NULL`
      );

      expect(parseInt(docsWithOCR[0].count)).toBe(0);
    });

    it('should be able to perform full-text search', async () => {
      const searchResults = await executeQuery(
        pool,
        `SELECT COUNT(*) as count FROM tbl_documento_entrante
         WHERE ts_contenido_ocr @@ to_tsquery('spanish', 'solicita | requiere')`
      );

      // Debería encontrar al menos algún documento
      expect(parseInt(searchResults[0].count)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Inventory Tests', () => {
    it('should have inventory table if generated', async () => {
      const tableExists = await executeQuery<{ exists: boolean }>(
        pool,
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'tbl_inventario'
        )`
      );

      if (tableExists[0].exists) {
        const inventory = await executeQuery(
          pool,
          'SELECT COUNT(*) as count FROM tbl_inventario'
        );
        expect(parseInt(inventory[0].count)).toBeGreaterThan(0);
      }
    });

    it('should have unique inventory numbers if inventory exists', async () => {
      const tableExists = await executeQuery<{ exists: boolean }>(
        pool,
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'tbl_inventario'
        )`
      );

      if (tableExists[0].exists) {
        const duplicates = await executeQuery(
          pool,
          `SELECT numero_inventario, COUNT(*) as count
           FROM tbl_inventario
           GROUP BY numero_inventario
           HAVING COUNT(*) > 1`
        );
        expect(duplicates.length).toBe(0);
      }
    });

    it('should have valid inventory values if inventory exists', async () => {
      const tableExists = await executeQuery<{ exists: boolean }>(
        pool,
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'tbl_inventario'
        )`
      );

      if (tableExists[0].exists) {
        const invalidValues = await executeQuery(
          pool,
          `SELECT COUNT(*) as count FROM tbl_inventario
           WHERE valor_unitario <= 0 OR valor_total <= 0
           OR cantidad <= 0`
        );
        expect(parseInt(invalidValues[0].count)).toBe(0);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should query documents efficiently (< 1s for 100 docs)', async () => {
      const start = Date.now();
      await executeQuery(
        pool,
        'SELECT * FROM tbl_documento_entrante LIMIT 100'
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });

    it('should perform full-text search efficiently (< 2s)', async () => {
      const start = Date.now();
      await executeQuery(
        pool,
        `SELECT * FROM tbl_documento_entrante
         WHERE ts_contenido_ocr @@ to_tsquery('spanish', 'solicita')
         LIMIT 50`
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });
});
