import { describe, it, expect } from 'vitest';
import fakerData from '../../backend/seed/faker-data.js';

describe('Faker Data Generation Tests', () => {
  describe('Unidades Administrativas', () => {
    it('should generate UA name for each level', () => {
      for (let nivel = 1; nivel <= 4; nivel++) {
        const nombre = fakerData.generarNombreUA(nivel);
        expect(nombre).toBeDefined();
        expect(nombre.length).toBeGreaterThan(0);
      }
    });

    it('should generate unique UA codes', () => {
      const codes = new Set();
      for (let i = 1; i <= 100; i++) {
        const code = fakerData.generarCodigoUA(1, i);
        codes.add(code);
      }
      expect(codes.size).toBe(100);
    });

    it('should generate UA code with correct format', () => {
      const code = fakerData.generarCodigoUA(2, 5);
      expect(code).toMatch(/^DG-\d{3}$/);
    });
  });

  describe('Usuarios', () => {
    it('should generate valid full names', () => {
      const nombre = fakerData.generarNombreCompleto();
      expect(nombre).toBeDefined();
      expect(nombre.split(' ').length).toBeGreaterThanOrEqual(2);
    });

    it('should generate valid server public employee codes', () => {
      const clave = fakerData.generarClaveServidorPublico(1);
      expect(clave).toMatch(/^(SP|CS|EP)\d{9}$/);
    });

    it('should generate valid institutional emails', () => {
      const nombre = 'Juan Pérez García';
      const email = fakerData.generarCorreoInstitucional(nombre);
      expect(email).toMatch(/^[a-z]+\.[a-z]+@.+\.gob\.mx$/);
    });

    it('should generate unique employee codes', () => {
      const codes = new Set();
      for (let i = 1; i <= 100; i++) {
        const code = fakerData.generarClaveServidorPublico(i);
        codes.add(code);
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('Documentos', () => {
    it('should generate valid external office numbers', () => {
      const numero = fakerData.generarNumeroOficioExterno('Secretaría');
      expect(numero).toMatch(/^[A-Z]{3}\/\d+\/\d{4}$/);
    });

    it('should generate valid governmental institutions', () => {
      const institucion = fakerData.generarInstitucionGubernamental();
      expect(institucion).toBeDefined();
      expect(institucion.length).toBeGreaterThan(10);
    });

    it('should generate valid document subjects', () => {
      const asunto = fakerData.generarAsuntoDocumento();
      expect(asunto).toBeDefined();
      expect(asunto.endsWith('.')).toBe(true);
      expect(asunto.length).toBeGreaterThan(20);
    });

    it('should generate OCR content with correct structure', () => {
      const asunto = 'Se solicita información';
      const contenido = fakerData.generarContenidoOCR(asunto);
      expect(contenido).toContain(asunto);
      expect(contenido).toContain('Ciudad de México');
      expect(contenido).toContain('ATENTAMENTE');
    });

    it('should generate valid OCR metadata', () => {
      const metadata = fakerData.generarMetadatosOCR();
      expect(metadata).toHaveProperty('entities');
      expect(metadata).toHaveProperty('confidence');
      expect(metadata.confidence).toBeGreaterThanOrEqual(0.85);
      expect(metadata.confidence).toBeLessThanOrEqual(0.99);
      expect(metadata.language).toBe('es');
    });
  });

  describe('Archivos', () => {
    it('should generate valid file names for each type', () => {
      const tipos: Array<'pdf' | 'docx' | 'xlsx' | 'jpg' | 'png'> = ['pdf', 'docx', 'xlsx', 'jpg', 'png'];
      tipos.forEach(tipo => {
        const nombre = fakerData.generarNombreArchivo(tipo);
        expect(nombre).toMatch(new RegExp(`\\.${tipo}$`));
      });
    });

    it('should generate realistic file sizes', () => {
      const { bytes, mb } = fakerData.generarTamanoArchivo('pdf');
      expect(bytes).toBeGreaterThan(0);
      expect(parseFloat(mb)).toBeGreaterThan(0);
      expect(parseFloat(mb)).toBeLessThan(10);
    });
  });

  describe('Turnados y Avances', () => {
    it('should generate valid turnado instructions', () => {
      const instruccion = fakerData.generarInstruccionTurnado();
      expect(instruccion).toBeDefined();
      expect(instruccion.length).toBeGreaterThan(10);
    });

    it('should generate contextual progress comments', () => {
      const comentarios = [25, 50, 75, 100].map(p =>
        fakerData.generarComentarioAvance(p)
      );
      comentarios.forEach(comentario => {
        expect(comentario).toBeDefined();
        expect(comentario.length).toBeGreaterThan(20);
      });
    });
  });

  describe('Datos de Oficina', () => {
    it('should generate valid office addresses', () => {
      const direccion = fakerData.generarDireccionOficina();
      expect(direccion).toContain('Ciudad de México');
      expect(direccion).toMatch(/C\.P\. \d+/);
    });

    it('should generate valid phone numbers', () => {
      const telefono = fakerData.generarTelefonoOficial();
      expect(telefono).toMatch(/^\d{2}-\d{4}-\d{4}$/);
    });

    it('should generate valid extensions', () => {
      const extension = fakerData.generarExtension();
      expect(extension).toMatch(/^\d{4}$/);
    });
  });
});
