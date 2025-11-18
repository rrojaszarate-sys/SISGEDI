import { PrismaClient, Rol } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...')
    await prisma.auditoria.deleteMany()
    await prisma.documentoEtiqueta.deleteMany()
    await prisma.etiqueta.deleteMany()
    await prisma.firma.deleteMany()
    await prisma.tarea.deleteMany()
    await prisma.tramite.deleteMany()
    await prisma.documentoVersion.deleteMany()
    await prisma.documento.deleteMany()
    await prisma.expediente.deleteMany()
    await prisma.workflow.deleteMany()
    await prisma.usuarioDependencia.deleteMany()
    await prisma.dependencia.deleteMany()
    await prisma.usuario.deleteMany()
  }

  // Crear dependencias
  console.log('📁 Creating dependencias...')
  const dependenciaJuridica = await prisma.dependencia.create({
    data: {
      nombre: 'Departamento Jurídico',
      descripcion: 'Gestión de asuntos legales y contratos',
    },
  })

  const dependenciaFinanzas = await prisma.dependencia.create({
    data: {
      nombre: 'Departamento de Finanzas',
      descripcion: 'Administración financiera y presupuestal',
    },
  })

  const dependenciaRH = await prisma.dependencia.create({
    data: {
      nombre: 'Recursos Humanos',
      descripcion: 'Gestión de personal y nómina',
    },
  })

  // Crear usuarios de ejemplo (nota: en producción estos vendrían de Supabase Auth)
  console.log('👥 Creating usuarios...')
  const adminUser = await prisma.usuario.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@sisgedi.com',
      nombre_completo: 'Administrador del Sistema',
      nivel_seguridad: 3,
    },
  })

  const juridicoUser = await prisma.usuario.create({
    data: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'juridico@sisgedi.com',
      nombre_completo: 'Juan Pérez - Jurídico',
      nivel_seguridad: 2,
    },
  })

  const finanzasUser = await prisma.usuario.create({
    data: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'finanzas@sisgedi.com',
      nombre_completo: 'María García - Finanzas',
      nivel_seguridad: 2,
    },
  })

  // Asignar usuarios a dependencias
  console.log('🔗 Assigning usuarios to dependencias...')
  await prisma.usuarioDependencia.create({
    data: {
      usuario_id: adminUser.id,
      dependencia_id: dependenciaJuridica.id,
      rol: Rol.SUPER_ADMIN,
    },
  })

  await prisma.usuarioDependencia.create({
    data: {
      usuario_id: juridicoUser.id,
      dependencia_id: dependenciaJuridica.id,
      rol: Rol.JEFE_DEPARTAMENTO,
    },
  })

  await prisma.usuarioDependencia.create({
    data: {
      usuario_id: finanzasUser.id,
      dependencia_id: dependenciaFinanzas.id,
      rol: Rol.JEFE_DEPARTAMENTO,
    },
  })

  // Crear expedientes de ejemplo
  console.log('📂 Creating expedientes...')
  const expedienteContratos = await prisma.expediente.create({
    data: {
      codigo: 'EXP-2025-001',
      nombre: 'Contratos de Servicios 2025',
      descripcion: 'Expediente de contratos de servicios profesionales',
      serie_documental: 'Contratos',
      subserie_documental: 'Servicios Profesionales',
    },
  })

  // Crear etiquetas
  console.log('🏷️  Creating etiquetas...')
  const etiquetaUrgente = await prisma.etiqueta.create({
    data: {
      nombre: 'Urgente',
      color: '#EF4444',
    },
  })

  const etiquetaRevision = await prisma.etiqueta.create({
    data: {
      nombre: 'En Revisión',
      color: '#F59E0B',
    },
  })

  // Crear documento de ejemplo
  console.log('📄 Creating documentos...')
  const documento = await prisma.documento.create({
    data: {
      titulo: 'Contrato de Servicios Profesionales - Ejemplo',
      tipo: 'CONTRATO',
      clasificacion: 'INTERNO',
      contenido: 'Este es un contrato de ejemplo para demostración del sistema.',
      hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      formato_archivo: 'application/pdf',
      tamano_bytes: 1024,
      periodo_retencion: 10,
      autor_id: juridicoUser.id,
      dependencia_id: dependenciaJuridica.id,
      expediente_id: expedienteContratos.id,
    },
  })

  // Asociar etiquetas al documento
  await prisma.documentoEtiqueta.createMany({
    data: [
      {
        documento_id: documento.id,
        etiqueta_id: etiquetaRevision.id,
      },
    ],
  })

  // Crear workflow básico
  console.log('🔄 Creating workflows...')
  const workflowAprobacion = await prisma.workflow.create({
    data: {
      nombre: 'Aprobación de Contratos',
      descripcion: 'Workflow para aprobación de contratos',
      definicion_bpmn: {
        id: 'workflow-contratos',
        tasks: [
          { id: 'task-1', name: 'Revisión Jurídica', type: 'REVISION' },
          { id: 'task-2', name: 'Aprobación Financiera', type: 'APROBACION' },
          { id: 'task-3', name: 'Firma Digital', type: 'FIRMA' },
        ],
      },
    },
  })

  // Crear trámite
  console.log('📮 Creating tramites...')
  const tramite = await prisma.tramite.create({
    data: {
      documento_id: documento.id,
      workflow_id: workflowAprobacion.id,
      estado: 'INICIADO',
      prioridad: 'ALTA',
      fecha_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      dependencia_origen_id: dependenciaJuridica.id,
      dependencia_destino_id: dependenciaFinanzas.id,
      usuario_asignado_id: finanzasUser.id,
      observaciones: 'Requiere aprobación urgente',
    },
  })

  // Crear tareas del trámite
  await prisma.tarea.createMany({
    data: [
      {
        tramite_id: tramite.id,
        workflow_id: workflowAprobacion.id,
        nombre: 'Revisión Jurídica',
        tipo: 'REVISION',
        estado: 'COMPLETADA',
        fecha_limite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        tramite_id: tramite.id,
        workflow_id: workflowAprobacion.id,
        nombre: 'Aprobación Financiera',
        tipo: 'APROBACION',
        estado: 'PENDIENTE',
        fecha_limite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  // Crear configuraciones del sistema
  console.log('⚙️  Creating configuraciones...')
  await prisma.configuracion.createMany({
    data: [
      {
        clave: 'sla_default_horas',
        valor: 72,
        descripcion: 'SLA por defecto en horas para trámites',
      },
      {
        clave: 'tamano_maximo_archivo_mb',
        valor: 100,
        descripcion: 'Tamaño máximo de archivo en MB',
      },
      {
        clave: 'formatos_permitidos',
        valor: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'],
        descripcion: 'Formatos de archivo permitidos',
      },
    ],
  })

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - ${await prisma.dependencia.count()} dependencias`)
  console.log(`   - ${await prisma.usuario.count()} usuarios`)
  console.log(`   - ${await prisma.expediente.count()} expedientes`)
  console.log(`   - ${await prisma.documento.count()} documentos`)
  console.log(`   - ${await prisma.tramite.count()} trámites`)
  console.log(`   - ${await prisma.workflow.count()} workflows`)
  console.log(`   - ${await prisma.etiqueta.count()} etiquetas`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
