#!/usr/bin/env tsx

import { createPool, executeQuery, testConnection } from '../backend/database/config.js';
import { faker } from '@faker-js/faker/locale/es_MX';
import pg from 'pg';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m'
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}`)
};

interface UnidadAdministrativa {
  id_ua: string;
  nombre_ua: string;
  codigo_ua: string;
  nivel_jerarquico: number;
}

interface InventarioItem {
  categoria: string;
  subcategoria: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  estado: string;
  ubicacion: string;
  responsable: string;
  numero_inventario: string;
  fecha_adquisicion: Date;
  valor_unitario: number;
  valor_total: number;
  proveedor: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  observaciones?: string;
}

/**
 * Catálogo de bienes muebles por categoría
 */
const CATALOGO_BIENES = {
  'Mobiliario de Oficina': {
    items: [
      { nombre: 'Escritorio ejecutivo', unidad: 'Pieza', rango: [3000, 8000] },
      { nombre: 'Silla ergonómica', unidad: 'Pieza', rango: [1500, 4000] },
      { nombre: 'Mesa de juntas', unidad: 'Pieza', rango: [5000, 15000] },
      { nombre: 'Silla de visita', unidad: 'Pieza', rango: [500, 1500] },
      { nombre: 'Archivero metálico', unidad: 'Pieza', rango: [2000, 5000] },
      { nombre: 'Librero', unidad: 'Pieza', rango: [1500, 4000] },
      { nombre: 'Credenza', unidad: 'Pieza', rango: [2500, 6000] },
      { nombre: 'Perchero', unidad: 'Pieza', rango: [300, 800] }
    ]
  },
  'Equipo de Cómputo': {
    items: [
      { nombre: 'Computadora de escritorio', unidad: 'Equipo', rango: [8000, 18000], marca: true, modelo: true, serie: true },
      { nombre: 'Laptop', unidad: 'Equipo', rango: [10000, 25000], marca: true, modelo: true, serie: true },
      { nombre: 'Monitor LED', unidad: 'Equipo', rango: [2000, 6000], marca: true, modelo: true },
      { nombre: 'Impresora multifuncional', unidad: 'Equipo', rango: [3000, 12000], marca: true, modelo: true, serie: true },
      { nombre: 'Escáner', unidad: 'Equipo', rango: [2000, 8000], marca: true, modelo: true },
      { nombre: 'Proyector', unidad: 'Equipo', rango: [5000, 15000], marca: true, modelo: true, serie: true },
      { nombre: 'Servidor', unidad: 'Equipo', rango: [25000, 80000], marca: true, modelo: true, serie: true },
      { nombre: 'Switch de red', unidad: 'Equipo', rango: [1500, 8000], marca: true, modelo: true },
      { nombre: 'Router', unidad: 'Equipo', rango: [800, 5000], marca: true, modelo: true },
      { nombre: 'UPS/No-break', unidad: 'Equipo', rango: [1000, 5000], marca: true, modelo: true }
    ]
  },
  'Equipo de Comunicación': {
    items: [
      { nombre: 'Teléfono IP', unidad: 'Equipo', rango: [800, 3000], marca: true, modelo: true },
      { nombre: 'Central telefónica', unidad: 'Equipo', rango: [15000, 50000], marca: true, modelo: true },
      { nombre: 'Radio de comunicación', unidad: 'Equipo', rango: [2000, 6000], marca: true, modelo: true },
      { nombre: 'Sistema de audio/video conferencia', unidad: 'Equipo', rango: [10000, 40000], marca: true, modelo: true }
    ]
  },
  'Equipo de Seguridad': {
    items: [
      { nombre: 'Cámara de seguridad', unidad: 'Equipo', rango: [2000, 8000], marca: true, modelo: true },
      { nombre: 'DVR/NVR', unidad: 'Equipo', rango: [3000, 15000], marca: true, modelo: true, serie: true },
      { nombre: 'Control de acceso', unidad: 'Equipo', rango: [5000, 20000], marca: true, modelo: true },
      { nombre: 'Detector de humo', unidad: 'Equipo', rango: [300, 1000], marca: true }
    ]
  },
  'Vehículos': {
    items: [
      { nombre: 'Automóvil sedán', unidad: 'Vehículo', rango: [200000, 400000], marca: true, modelo: true, serie: true },
      { nombre: 'Camioneta SUV', unidad: 'Vehículo', rango: [300000, 600000], marca: true, modelo: true, serie: true },
      { nombre: 'Motocicleta', unidad: 'Vehículo', rango: [30000, 80000], marca: true, modelo: true, serie: true }
    ]
  },
  'Equipo de Oficina': {
    items: [
      { nombre: 'Destructora de papel', unidad: 'Equipo', rango: [1000, 5000], marca: true },
      { nombre: 'Engargoladora', unidad: 'Equipo', rango: [500, 2000] },
      { nombre: 'Guillotina', unidad: 'Equipo', rango: [800, 3000] },
      { nombre: 'Laminadora', unidad: 'Equipo', rango: [1500, 5000] },
      { nombre: 'Calculadora', unidad: 'Pieza', rango: [200, 800] },
      { nombre: 'Reloj checador', unidad: 'Equipo', rango: [2000, 8000], marca: true }
    ]
  },
  'Climatización': {
    items: [
      { nombre: 'Aire acondicionado tipo mini split', unidad: 'Equipo', rango: [5000, 15000], marca: true, modelo: true },
      { nombre: 'Ventilador de pedestal', unidad: 'Equipo', rango: [500, 1500], marca: true },
      { nombre: 'Calefactor', unidad: 'Equipo', rango: [800, 3000], marca: true }
    ]
  },
  'Equipo Audiovisual': {
    items: [
      { nombre: 'Televisor LED', unidad: 'Equipo', rango: [4000, 20000], marca: true, modelo: true },
      { nombre: 'Bocinas/Altavoces', unidad: 'Equipo', rango: [500, 5000], marca: true },
      { nombre: 'Pizarrón electrónico', unidad: 'Equipo', rango: [8000, 25000], marca: true, modelo: true },
      { nombre: 'Cámara fotográfica', unidad: 'Equipo', rango: [3000, 15000], marca: true, modelo: true, serie: true },
      { nombre: 'Videocámara', unidad: 'Equipo', rango: [5000, 20000], marca: true, modelo: true, serie: true }
    ]
  }
};

const MARCAS_POR_CATEGORIA = {
  'Equipo de Cómputo': ['Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'Asus', 'Samsung'],
  'Equipo de Comunicación': ['Cisco', 'Panasonic', 'Grandstream', 'Yealink', 'Polycom'],
  'Equipo de Seguridad': ['Hikvision', 'Dahua', 'Axis', 'Bosch', 'Hanwha'],
  'Vehículos': ['Nissan', 'Toyota', 'Volkswagen', 'Chevrolet', 'Ford', 'Honda'],
  'Climatización': ['Samsung', 'LG', 'Carrier', 'York', 'Mitsubishi'],
  'Equipo Audiovisual': ['Samsung', 'LG', 'Sony', 'Panasonic', 'Canon', 'Nikon']
};

const ESTADOS_BIEN = ['Excelente', 'Bueno', 'Regular', 'Malo', 'Baja'];

const PROVEEDORES = [
  'Office Depot de México',
  'Syscom',
  'CT Internacional',
  'Mercado Libre Comercial',
  'Dell Technologies México',
  'HP México',
  'Compusoluciones',
  'Amazon Business México',
  'Grupo CVA',
  'Ingram Micro',
  'Tech Data',
  'Mayoreo en Computación',
  'Lumen Technologies',
  'Grupo Dice'
];

/**
 * Generar número de inventario único
 */
function generarNumeroInventario(
  codigoUA: string,
  categoria: string,
  index: number
): string {
  const categoriaCodigo = categoria.substring(0, 3).toUpperCase();
  const anio = new Date().getFullYear();
  return `${codigoUA}-${categoriaCodigo}-${anio}-${String(index).padStart(4, '0')}`;
}

/**
 * Generar modelo realista
 */
function generarModelo(categoria: string, marca: string): string {
  const modelos: { [key: string]: string[] } = {
    'Dell': ['Optiplex 7090', 'Latitude 5420', 'XPS 13', 'Precision 3560'],
    'HP': ['ProDesk 400', 'EliteBook 840', 'ProBook 450', 'LaserJet Pro M428'],
    'Lenovo': ['ThinkCentre M720', 'ThinkPad E14', 'IdeaPad 3', 'Legion 5'],
    'Cisco': ['SG350-28', 'Catalyst 2960', 'IP Phone 7841'],
    'Hikvision': ['DS-2CD2043G0', 'DS-7608NI-K2'],
    'Nissan': ['Versa Sense', 'X-Trail Advance', 'Kicks Advance'],
    'Toyota': ['Corolla LE', 'RAV4 XLE', 'Hilux SR5'],
    'Samsung': ['24" F390', 'Split 12000 BTU', 'UN55TU7000'],
    'LG': ['27MK430H', 'Inverter V 18000 BTU', '55UN7300']
  };

  return faker.helpers.arrayElement(modelos[marca] || [`Modelo ${faker.string.alphanumeric(4).toUpperCase()}`]);
}

/**
 * Generar serie realista
 */
function generarSerie(): string {
  return faker.string.alphanumeric({ length: 12, casing: 'upper' });
}

/**
 * Generar inventario para una unidad administrativa
 */
async function generarInventarioUA(
  pool: pg.Pool,
  ua: UnidadAdministrativa,
  index: number
): Promise<number> {
  const inventario: InventarioItem[] = [];

  // Obtener usuarios de la UA para asignar responsables
  const usuarios = await executeQuery<{ id_usuario: string; nombre_completo: string }>(
    pool,
    'SELECT id_usuario, nombre_completo FROM tbl_usuarios WHERE id_ua = $1 LIMIT 10',
    [ua.id_ua]
  );

  if (usuarios.length === 0) {
    log.warning(`No hay usuarios en ${ua.nombre_ua}, se omite inventario`);
    return 0;
  }

  const responsables = usuarios.map(u => u.nombre_completo);

  // Cantidad de items según nivel jerárquico
  const itemsPorNivel = {
    1: { min: 50, max: 100 },  // Subsecretaría
    2: { min: 30, max: 60 },   // Dirección General
    3: { min: 20, max: 40 },   // Dirección
    4: { min: 10, max: 25 }    // Jefatura
  };

  const rango = itemsPorNivel[ua.nivel_jerarquico as keyof typeof itemsPorNivel] || { min: 10, max: 20 };
  const totalItems = faker.number.int({ min: rango.min, max: rango.max });

  let itemIndex = 1;

  // Generar items de inventario
  for (let i = 0; i < totalItems; i++) {
    const categoria = faker.helpers.arrayElement(Object.keys(CATALOGO_BIENES));
    const subcategoria = CATALOGO_BIENES[categoria as keyof typeof CATALOGO_BIENES];
    const item = faker.helpers.arrayElement(subcategoria.items);

    const cantidad = faker.number.int({ min: 1, max: 5 });
    const valorUnitario = faker.number.int({ min: item.rango[0], max: item.rango[1] });
    const valorTotal = cantidad * valorUnitario;

    const fechaAdquisicion = faker.date.between({
      from: '2020-01-01',
      to: new Date()
    });

    const estado = faker.helpers.weightedArrayElement([
      { value: 'Excelente', weight: 2 },
      { value: 'Bueno', weight: 5 },
      { value: 'Regular', weight: 2 },
      { value: 'Malo', weight: 1 }
    ]);

    const numeroInventario = generarNumeroInventario(ua.codigo_ua, categoria, itemIndex++);

    const ubicacion = `${ua.nombre_ua} - Piso ${faker.number.int({ min: 1, max: 5 })} - Área ${faker.number.int({ min: 100, max: 599 })}`;

    const responsable = faker.helpers.arrayElement(responsables);
    const proveedor = faker.helpers.arrayElement(PROVEEDORES);

    let marca = undefined;
    let modelo = undefined;
    let serie = undefined;

    if (true) {
      const marcas = MARCAS_POR_CATEGORIA[categoria as keyof typeof MARCAS_POR_CATEGORIA] || ['Genérica'];
      marca = faker.helpers.arrayElement(marcas);
    }

    if (marca) {
      modelo = generarModelo(categoria, marca);
    }


    const observaciones = faker.datatype.boolean({ probability: 0.3 })
      ? faker.helpers.arrayElement([
          'En garantía hasta diciembre 2025',
          'Requiere mantenimiento preventivo',
          'Asignado mediante acta entrega-recepción',
          'Bien resguardado',
          'En proceso de baja',
          'Requiere actualización'
        ])
      : undefined;

    inventario.push({
      categoria,
      subcategoria: categoria,
      descripcion: item.nombre,
      cantidad,
      unidad: item.unidad,
      estado,
      ubicacion,
      responsable,
      numero_inventario: numeroInventario,
      fecha_adquisicion: fechaAdquisicion,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      proveedor,
      marca,
      modelo,
      serie,
      observaciones
    });
  }

  // Insertar en tabla temporal de inventario (creamos tabla si no existe)
  await executeQuery(
    pool,
    `CREATE TABLE IF NOT EXISTS tbl_inventario (
      id_inventario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_ua UUID NOT NULL REFERENCES cat_unidad_administrativa(id_ua),
      categoria VARCHAR(100) NOT NULL,
      subcategoria VARCHAR(100),
      descripcion TEXT NOT NULL,
      cantidad INT NOT NULL,
      unidad VARCHAR(50) NOT NULL,
      estado VARCHAR(20) NOT NULL,
      ubicacion TEXT NOT NULL,
      responsable VARCHAR(200) NOT NULL,
      numero_inventario VARCHAR(50) UNIQUE NOT NULL,
      fecha_adquisicion DATE NOT NULL,
      valor_unitario NUMERIC(12,2) NOT NULL,
      valor_total NUMERIC(12,2) NOT NULL,
      proveedor VARCHAR(200) NOT NULL,
      marca VARCHAR(100),
      modelo VARCHAR(100),
      serie VARCHAR(50),
      observaciones TEXT,
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  // Insertar items
  for (const inv of inventario) {
    await executeQuery(
      pool,
      `INSERT INTO tbl_inventario
       (id_ua, categoria, subcategoria, descripcion, cantidad, unidad, estado, ubicacion,
        responsable, numero_inventario, fecha_adquisicion, valor_unitario, valor_total,
        proveedor, marca, modelo, serie, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        ua.id_ua,
        inv.categoria,
        inv.subcategoria,
        inv.descripcion,
        inv.cantidad,
        inv.unidad,
        inv.estado,
        inv.ubicacion,
        inv.responsable,
        inv.numero_inventario,
        inv.fecha_adquisicion,
        inv.valor_unitario,
        inv.valor_total,
        inv.proveedor,
        inv.marca,
        inv.modelo,
        inv.serie,
        inv.observaciones
      ]
    );
  }

  const valorTotalUA = inventario.reduce((sum, item) => sum + item.valor_total, 0);

  log.info(`  [${ua.codigo_ua}] ${ua.nombre_ua}: ${inventario.length} items - $${valorTotalUA.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);

  return inventario.length;
}

/**
 * Generar reporte de inventario
 */
async function generarReporte(pool: pg.Pool): Promise<void> {
  log.section('📊 Generando Reporte de Inventario...');

  // Resumen por UA
  const resumenUA = await executeQuery<{
    codigo_ua: string;
    nombre_ua: string;
    total_items: string;
    valor_total: string;
  }>(
    pool,
    `SELECT
       ua.codigo_ua,
       ua.nombre_ua,
       COUNT(inv.id_inventario)::TEXT as total_items,
       SUM(inv.valor_total)::TEXT as valor_total
     FROM cat_unidad_administrativa ua
     LEFT JOIN tbl_inventario inv ON ua.id_ua = inv.id_ua
     GROUP BY ua.id_ua, ua.codigo_ua, ua.nombre_ua
     HAVING COUNT(inv.id_inventario) > 0
     ORDER BY ua.codigo_ua`
  );

  console.log('\n');
  console.log('┌────────────┬──────────────────────────────────────────┬────────┬──────────────────┐');
  console.log('│   Código   │              Unidad Administrativa       │  Items │   Valor Total    │');
  console.log('├────────────┼──────────────────────────────────────────┼────────┼──────────────────┤');

  let totalItems = 0;
  let valorGlobal = 0;

  for (const ua of resumenUA) {
    const items = parseInt(ua.total_items);
    const valor = parseFloat(ua.valor_total);
    totalItems += items;
    valorGlobal += valor;

    const codigoPad = ua.codigo_ua.padEnd(10);
    const nombrePad = ua.nombre_ua.length > 40
      ? ua.nombre_ua.substring(0, 37) + '...'
      : ua.nombre_ua.padEnd(40);
    const itemsPad = String(items).padStart(6);
    const valorPad = `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`.padStart(16);

    console.log(`│ ${codigoPad} │ ${nombrePad} │ ${itemsPad} │ ${valorPad} │`);
  }

  console.log('├────────────┴──────────────────────────────────────────┼────────┼──────────────────┤');
  console.log(`│ ${' '.repeat(52)}TOTAL │ ${String(totalItems).padStart(6)} │ $${valorGlobal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`.padStart(16) + ' │');
  console.log('└───────────────────────────────────────────────────────┴────────┴──────────────────┘');

  // Resumen por categoría
  const resumenCategoria = await executeQuery<{
    categoria: string;
    total_items: string;
    valor_total: string;
  }>(
    pool,
    `SELECT
       categoria,
       COUNT(*)::TEXT as total_items,
       SUM(valor_total)::TEXT as valor_total
     FROM tbl_inventario
     GROUP BY categoria
     ORDER BY SUM(valor_total) DESC`
  );

  console.log('\n');
  log.section('📦 Resumen por Categoría');
  console.log('┌──────────────────────────────────────┬────────┬──────────────────┐');
  console.log('│            Categoría                 │  Items │   Valor Total    │');
  console.log('├──────────────────────────────────────┼────────┼──────────────────┤');

  for (const cat of resumenCategoria) {
    const items = parseInt(cat.total_items);
    const valor = parseFloat(cat.valor_total);

    const catPad = cat.categoria.length > 36
      ? cat.categoria.substring(0, 33) + '...'
      : cat.categoria.padEnd(36);
    const itemsPad = String(items).padStart(6);
    const valorPad = `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`.padStart(16);

    console.log(`│ ${catPad} │ ${itemsPad} │ ${valorPad} │`);
  }

  console.log('└──────────────────────────────────────┴────────┴──────────────────┘');
}

/**
 * Función principal
 */
async function main() {
  console.log(`
${colors.bright}${colors.magenta}
╔═══════════════════════════════════════════════╗
║   SISGEDI 2.0 - Generador de Inventario       ║
║   Inventario Aleatorio por Centro             ║
╚═══════════════════════════════════════════════╝
${colors.reset}
  `);

  const pool = createPool();

  try {
    // Verificar conexión
    log.section('🔌 Verificando conexión a la base de datos...');
    const connected = await testConnection(pool);

    if (!connected) {
      log.error('No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Obtener unidades administrativas
    log.section('🏛️  Obteniendo Unidades Administrativas...');
    const unidades = await executeQuery<UnidadAdministrativa>(
      pool,
      'SELECT id_ua, nombre_ua, codigo_ua, nivel_jerarquico FROM cat_unidad_administrativa ORDER BY codigo_ua'
    );

    if (unidades.length === 0) {
      log.warning('No hay unidades administrativas. Ejecuta primero: npm run seed');
      process.exit(1);
    }

    log.success(`Se encontraron ${unidades.length} unidades administrativas`);

    // Generar inventario para cada UA
    log.section('📦 Generando Inventario por Unidad Administrativa...');

    let totalItemsGenerados = 0;

    for (let i = 0; i < unidades.length; i++) {
      const itemsGenerados = await generarInventarioUA(pool, unidades[i], i + 1);
      totalItemsGenerados += itemsGenerados;
    }

    log.success(`\nTotal de items de inventario generados: ${totalItemsGenerados}`);

    // Generar reporte
    await generarReporte(pool);

    log.section('✅ Generación de inventario completada exitosamente!');

  } catch (error) {
    log.error('Error durante la generación de inventario:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar
main();
