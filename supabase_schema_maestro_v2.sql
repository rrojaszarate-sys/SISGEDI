--
-- SISGEDI 2.0 - ESQUEMA MAESTRO COMPLETO
-- Sistema de Gestión Documental - Versión Moderna
-- Basado en sistema legado Java EE + Oracle
-- Migrado a PostgreSQL + Supabase Storage
--
-- Total: 54 tablas
-- Fecha: 2025-11-20
--

-- ============================================================================
-- LIMPIEZA INICIAL
-- ============================================================================

-- Eliminar tablas en orden inverso de dependencias
DROP TABLE IF EXISTS tbl_log_auditoria CASCADE;
DROP TABLE IF EXISTS tbl_usuario_sesion CASCADE;
DROP TABLE IF EXISTS tbl_direccion_ip CASCADE;
DROP TABLE IF EXISTS tbl_seguimiento_improcedente CASCADE;
DROP TABLE IF EXISTS tbl_seg_alcance_improcedente CASCADE;
DROP TABLE IF EXISTS tbl_cancelar_entrante CASCADE;

DROP TABLE IF EXISTS tbl_digitalizado_seguimiento CASCADE;
DROP TABLE IF EXISTS tbl_seguimiento_turno CASCADE;
DROP TABLE IF EXISTS tbl_dig_alcanceturado_seg CASCADE;
DROP TABLE IF EXISTS tbl_seguimiento_alcance_turnado CASCADE;
DROP TABLE IF EXISTS tbl_alcance_turnado CASCADE;
DROP TABLE IF EXISTS tbl_digitalizado_alcance CASCADE;
DROP TABLE IF EXISTS tbl_alcance_entrante CASCADE;

DROP TABLE IF EXISTS tbl_turnar_complemento CASCADE;
DROP TABLE IF EXISTS tbl_turnar_entrante CASCADE;

DROP TABLE IF EXISTS tbl_seguimiento_saliente CASCADE;
DROP TABLE IF EXISTS tbl_copia_documento_saliente CASCADE;
DROP TABLE IF EXISTS tbl_documento_entrante_saliente CASCADE;
DROP TABLE IF EXISTS tbl_documento_saliente CASCADE;

DROP TABLE IF EXISTS tbl_expediente_docto_entrante CASCADE;
DROP TABLE IF EXISTS tbl_documento_adicional CASCADE;
DROP TABLE IF EXISTS tbl_digitalizado_entrante CASCADE;
DROP TABLE IF EXISTS tbl_documento_entrante CASCADE;

DROP TABLE IF EXISTS tbl_asignacion_numeros CASCADE;
DROP TABLE IF EXISTS tbl_contrasenia CASCADE;
DROP TABLE IF EXISTS tbl_usuario_unidad_admin CASCADE;
DROP TABLE IF EXISTS tbl_usuario_rol CASCADE;
DROP TABLE IF EXISTS tbl_usuarios CASCADE;

DROP TABLE IF EXISTS cat_solicitante CASCADE;
DROP TABLE IF EXISTS cat_contacto_uadmin CASCADE;
DROP TABLE IF EXISTS cat_archivos_uadmin CASCADE;
DROP TABLE IF EXISTS cat_titular_unidad_admin CASCADE;
DROP TABLE IF EXISTS cat_unidad_administrativa CASCADE;
DROP TABLE IF EXISTS cat_remitente CASCADE;
DROP TABLE IF EXISTS cat_area_remitente CASCADE;

DROP TABLE IF EXISTS item_privilegios CASCADE;
DROP TABLE IF EXISTS submenu_privilegios CASCADE;
DROP TABLE IF EXISTS menu_privilegios CASCADE;
DROP TABLE IF EXISTS rol_menu CASCADE;
DROP TABLE IF EXISTS menu CASCADE;
DROP TABLE IF EXISTS rol CASCADE;

DROP TABLE IF EXISTS cat_valores_catalogo CASCADE;
DROP TABLE IF EXISTS cat_catalogo CASCADE;
DROP TABLE IF EXISTS diasinhabiles CASCADE;
DROP TABLE IF EXISTS semaforo CASCADE;
DROP TABLE IF EXISTS unidad_sede CASCADE;
DROP TABLE IF EXISTS unidad_admin_turnar CASCADE;
DROP TABLE IF EXISTS estatus_usuario CASCADE;

-- ============================================================================
-- CATÁLOGOS BASE
-- ============================================================================

-- Tabla: cat_catalogo (catálogos configurables)
CREATE TABLE cat_catalogo (
  id_catalogo SERIAL PRIMARY KEY,
  nombre_catalogo VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(250),
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_cat_catalogo_activo CHECK (activo IN (0, 1))
);

-- Tabla: cat_valores_catalogo (valores de catálogos)
CREATE TABLE cat_valores_catalogo (
  id_valor_catalogo SERIAL PRIMARY KEY,
  id_catalogo INTEGER NOT NULL REFERENCES cat_catalogo(id_catalogo),
  valor VARCHAR(250) NOT NULL,
  codigo VARCHAR(50),
  orden SMALLINT,
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_cat_valores_activo CHECK (activo IN (0, 1))
);

CREATE INDEX idx_cat_valores_catalogo ON cat_valores_catalogo(id_catalogo, activo);

-- Tabla: estatus_usuario
CREATE TABLE estatus_usuario (
  id_estatus_usuario SERIAL PRIMARY KEY,
  estatus_usuario VARCHAR(25) NOT NULL,
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_estatus_usuario_activo CHECK (activo IN (0, 1))
);

-- Tabla: diasinhabiles
CREATE TABLE diasinhabiles (
  id_diasinhabiles SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  descripcion VARCHAR(150),
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_diasinhabiles_activo CHECK (activo IN (0, 1))
);

CREATE INDEX idx_diasinhabiles_fecha ON diasinhabiles(fecha, activo);

-- Tabla: semaforo (configuración alertas visuales)
CREATE TABLE semaforo (
  id_semaforo SERIAL PRIMARY KEY,
  porcentaje_venc SMALLINT NOT NULL,
  color VARCHAR(50) NOT NULL,
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_semaforo_activo CHECK (activo IN (0, 1))
);

-- ============================================================================
-- UNIDADES ADMINISTRATIVAS
-- ============================================================================

-- Tabla: cat_unidad_administrativa
CREATE TABLE cat_unidad_administrativa (
  id_unidad_administrativa SERIAL PRIMARY KEY,
  codigo_ua VARCHAR(25) NOT NULL UNIQUE,
  nombre_ua VARCHAR(150) NOT NULL,
  nivel_unidad SMALLINT NOT NULL,
  id_unidad_reporta INTEGER REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  id_reporta_principal INTEGER REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  activa SMALLINT NOT NULL DEFAULT 1,
  autorizada SMALLINT NOT NULL DEFAULT 1, -- Puede turnar documentos
  color_identifica VARCHAR(25),
  expediente VARCHAR(15),
  abreviatura VARCHAR(10),
  folio_auto SMALLINT DEFAULT 1,
  firmante VARCHAR(150),
  domicilio VARCHAR(250),
  telefonos VARCHAR(100),
  contacto VARCHAR(100),
  horas SMALLINT DEFAULT 8,
  sede SMALLINT DEFAULT 0,
  CONSTRAINT chk_cat_ua_activa CHECK (activa IN (0, 1)),
  CONSTRAINT chk_cat_ua_autorizada CHECK (autorizada IN (0, 1)),
  CONSTRAINT chk_cat_ua_folio_auto CHECK (folio_auto IN (0, 1)),
  CONSTRAINT chk_cat_ua_sede CHECK (sede IN (0, 1)),
  CONSTRAINT chk_cat_ua_nivel CHECK (nivel_unidad BETWEEN 1 AND 7)
);

CREATE INDEX idx_cat_ua_nivel ON cat_unidad_administrativa(nivel_unidad, activa);
CREATE INDEX idx_cat_ua_reporta ON cat_unidad_administrativa(id_unidad_reporta);

COMMENT ON TABLE cat_unidad_administrativa IS 'Estructura organizacional completa de la institución';
COMMENT ON COLUMN cat_unidad_administrativa.nivel_unidad IS '1=Secretaría, 2=Subsecretaría, 3=Coord Gral, 4=Dir Gral, 5=Dir Área, 6=Subdir, 7=Jefatura';

-- Tabla: cat_titular_unidad_admin
CREATE TABLE cat_titular_unidad_admin (
  id_titular_unidad_admin SERIAL PRIMARY KEY,
  titular VARCHAR(150) NOT NULL,
  cargo VARCHAR(150) NOT NULL,
  telefono VARCHAR(15),
  correo_electronico VARCHAR(150),
  activo SMALLINT NOT NULL DEFAULT 1,
  fecha_inicio DATE,
  fecha_fin DATE,
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrative),
  CONSTRAINT chk_cat_titular_activo CHECK (activo IN (0, 1))
);

CREATE INDEX idx_cat_titular_ua ON cat_titular_unidad_admin(id_unidad_administrativa, activo);

COMMENT ON TABLE cat_titular_unidad_admin IS 'Titulares de unidades administrativas (personas responsables)';

-- Tabla: cat_solicitante
CREATE TABLE cat_solicitante (
  id_solicitante SERIAL PRIMARY KEY,
  nombre_solicitante VARCHAR(150) NOT NULL,
  cargo VARCHAR(150) NOT NULL,
  activo SMALLINT NOT NULL DEFAULT 1,
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  CONSTRAINT chk_cat_solicitante_activo CHECK (activo IN (0, 1))
);

CREATE INDEX idx_cat_solicitante_ua ON cat_solicitante(id_unidad_administrativa, activo);

-- Tabla: cat_contacto_uadmin
CREATE TABLE cat_contacto_uadmin (
  id_contacto_uadmin SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(15),
  correo VARCHAR(100),
  activo SMALLINT NOT NULL DEFAULT 1,
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  CONSTRAINT chk_cat_contacto_activo CHECK (activo IN (0, 1))
);

CREATE INDEX idx_cat_contacto_ua ON cat_contacto_uadmin(id_unidad_administrativa, activo);

-- Tabla: cat_archivos_uadmin (logos, sellos, plantillas)
CREATE TABLE cat_archivos_uadmin (
  id_archivo_uadmin SERIAL PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL,
  archivo_url TEXT, -- Path en Supabase Storage
  archivo_nombre VARCHAR(250),
  archivo_tipo VARCHAR(50), -- MIME type
  archivo_tamanio BIGINT, -- bytes
  activo SMALLINT NOT NULL DEFAULT 1,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  CONSTRAINT chk_cat_archivos_activo CHECK (activo IN (0, 1))
);

COMMENT ON TABLE cat_archivos_uadmin IS 'Archivos digitales de unidades (logos, sellos, plantillas). Antes BLOB, ahora en Supabase Storage';

-- Tabla: unidad_sede
CREATE TABLE unidad_sede (
  id_sede SERIAL PRIMARY KEY,
  sede VARCHAR(150) NOT NULL,
  activo SMALLINT NOT NULL DEFAULT 1,
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  CONSTRAINT chk_unidad_sede_activo CHECK (activo IN (0, 1))
);

-- Tabla: unidad_admin_turnar (configuración turnados permitidos)
CREATE TABLE unidad_admin_turnar (
  id_unidad_admin_turnar SERIAL PRIMARY KEY,
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  id_unidad_turnar INTEGER NOT NULL, -- ID de unidad destino permitida
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_ua_turnar_activo CHECK (activo IN (0, 1))
);

-- ============================================================================
-- REMITENTES (EXTERNOS)
-- ============================================================================

-- Tabla: cat_area_remitente
CREATE TABLE cat_area_remitente (
  id_area_remitente SERIAL PRIMARY KEY,
  area_remitente VARCHAR(150) NOT NULL,
  activa SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_area_remitente_activa CHECK (activa IN (0, 1))
);

-- Tabla: cat_remitente
CREATE TABLE cat_remitente (
  id_remitente BIGSERIAL PRIMARY KEY,
  remitente VARCHAR(300) NOT NULL,
  cargo VARCHAR(150),
  activa SMALLINT NOT NULL DEFAULT 1,
  id_area_remitente INTEGER NOT NULL REFERENCES cat_area_remitente(id_area_remitente),
  CONSTRAINT chk_cat_remitente_activa CHECK (activa IN (0, 1))
);

CREATE INDEX idx_cat_remitente_area ON cat_remitente(id_area_remitente, activa);

-- ============================================================================
-- USUARIOS, ROLES Y PERMISOS
-- ============================================================================

-- Tabla: rol
CREATE TABLE rol (
  id_rol SERIAL PRIMARY KEY,
  rol VARCHAR(30) NOT NULL UNIQUE,
  descripcion_rol VARCHAR(150) NOT NULL,
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_rol_activo CHECK (activo IN (0, 1))
);

-- Tabla: menu
CREATE TABLE menu (
  id_menu SERIAL PRIMARY KEY,
  menu VARCHAR(100) NOT NULL,
  descripcion VARCHAR(100),
  posicion SMALLINT NOT NULL,
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_menu_activo CHECK (activo IN (0, 1))
);

-- Tabla: menu_privilegios (relación menú-rol)
CREATE TABLE menu_privilegios (
  id_menu_privilegio SERIAL PRIMARY KEY,
  activo SMALLINT NOT NULL DEFAULT 1,
  id_rol INTEGER NOT NULL REFERENCES rol(id_rol),
  id_menu INTEGER NOT NULL REFERENCES menu(id_menu),
  CONSTRAINT chk_menu_priv_activo CHECK (activo IN (0, 1))
);

-- Tabla: submenu_privilegios
CREATE TABLE submenu_privilegios (
  id_submenu_privilegio SERIAL PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  pagina VARCHAR(150) NOT NULL, -- URL/path
  posicion SMALLINT NOT NULL,
  activo SMALLINT NOT NULL DEFAULT 1,
  id_menu_privilegio INTEGER NOT NULL REFERENCES menu_privilegios(id_menu_privilegio),
  CONSTRAINT chk_submenu_priv_activo CHECK (activo IN (0, 1))
);

-- Tabla: item_privilegios
CREATE TABLE item_privilegios (
  id_item_privilegio SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  posicion SMALLINT NOT NULL,
  pagina VARCHAR(150) NOT NULL,
  activo SMALLINT NOT NULL DEFAULT 1,
  id_submenu_privilegio INTEGER NOT NULL REFERENCES submenu_privilegios(id_submenu_privilegio),
  CONSTRAINT chk_item_priv_activo CHECK (activo IN (0, 1))
);

-- Tabla: rol_menu (relación alternativa con PK compuesta)
CREATE TABLE rol_menu (
  id_rol INTEGER NOT NULL REFERENCES rol(id_rol),
  id_menu INTEGER NOT NULL REFERENCES menu(id_menu),
  activo SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY (id_rol, id_menu),
  CONSTRAINT chk_rol_menu_activo CHECK (activo IN (0, 1))
);

-- Tabla: tbl_usuarios
CREATE TABLE tbl_usuarios (
  id_usuario SERIAL PRIMARY KEY,
  usuario VARCHAR(80), -- Username para login
  nombre VARCHAR(80) NOT NULL,
  primer_apellido VARCHAR(80),
  segundo_apellido VARCHAR(80),
  clave_servidor_publico VARCHAR(25),
  curp VARCHAR(18) NOT NULL UNIQUE,
  correo_institucional VARCHAR(150) NOT NULL UNIQUE,
  observaciones VARCHAR(250),
  id_usuario_registra INTEGER NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_modificacion TIMESTAMPTZ,
  fecha_bloqueo TIMESTAMPTZ,
  id_estatus_usuario INTEGER NOT NULL REFERENCES estatus_usuario(id_estatus_usuario)
);

CREATE INDEX idx_usuarios_curp ON tbl_usuarios(curp);
CREATE INDEX idx_usuarios_correo ON tbl_usuarios(correo_institucional);
CREATE INDEX idx_usuarios_estatus ON tbl_usuarios(id_estatus_usuario);

-- Tabla: tbl_usuario_rol (PK compuesta)
CREATE TABLE tbl_usuario_rol (
  id_usuario INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  id_rol INTEGER NOT NULL REFERENCES rol(id_rol),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  permiso_activar SMALLINT NOT NULL DEFAULT 0, -- 1=Rol activo en sesión
  id_usuario_registra INTEGER NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  CONSTRAINT chk_usuario_rol_activo CHECK (permiso_activar IN (0, 1))
);

COMMENT ON COLUMN tbl_usuario_rol.permiso_activar IS 'Solo un rol puede estar activo (=1) por usuario a la vez';

-- Tabla: tbl_usuario_unidad_admin (PK compuesta)
CREATE TABLE tbl_usuario_unidad_admin (
  id_usuario INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activa SMALLINT NOT NULL DEFAULT 0, -- 1=Unidad activa en sesión
  id_usuario_registra INTEGER NOT NULL,
  PRIMARY KEY (id_usuario, id_unidad_administrativa),
  CONSTRAINT chk_usuario_ua_activa CHECK (activa IN (0, 1))
);

COMMENT ON COLUMN tbl_usuario_unidad_admin.activa IS 'Solo una unidad puede estar activa (=1) por usuario a la vez';

-- Tabla: tbl_contrasenia
CREATE TABLE tbl_contrasenia (
  id_contrasenia SERIAL PRIMARY KEY,
  password VARCHAR(128) NOT NULL, -- Hash bcrypt/SHA-256
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_vencimiento TIMESTAMPTZ, -- +90 días desde creación
  activa SMALLINT NOT NULL DEFAULT 1, -- 1=Activa, 0=Histórica
  id_usuario INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  CONSTRAINT chk_contrasenia_activa CHECK (activa IN (0, 1))
);

CREATE INDEX idx_contrasenia_usuario ON tbl_contrasenia(id_usuario, activa);

COMMENT ON TABLE tbl_contrasenia IS 'Historial de contraseñas. Caducidad 90 días, no repetir últimas 5';

-- ============================================================================
-- ASIGNACIÓN DE NÚMEROS OFICIALES
-- ============================================================================

-- Tabla: tbl_asignacion_numeros
CREATE TABLE tbl_asignacion_numeros (
  id_asignacion_numero BIGSERIAL PRIMARY KEY,
  numero_documento INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_tipo_documento INTEGER NOT NULL, -- FK a cat_valores_catalogo
  id_titular_unidad_admin INTEGER NOT NULL REFERENCES cat_titular_unidad_admin(id_titular_unidad_admin),
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa)
);

CREATE UNIQUE INDEX idx_asignacion_unique ON tbl_asignacion_numeros(anio, numero_documento, id_tipo_documento, id_unidad_administrativa);
CREATE INDEX idx_asignacion_anio_ua ON tbl_asignacion_numeros(anio, id_unidad_administrativa);

COMMENT ON TABLE tbl_asignacion_numeros IS 'Control de numeración oficial correlativa de documentos';

-- ============================================================================
-- DOCUMENTOS ENTRANTES
-- ============================================================================

-- Tabla: tbl_documento_entrante
CREATE TABLE tbl_documento_entrante (
  id_doc_entrante UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_interno VARCHAR(50) NOT NULL UNIQUE,
  numero_oficio_externo VARCHAR(100),
  folio_externo VARCHAR(50),
  asunto VARCHAR(3500) NOT NULL,
  observaciones VARCHAR(500),
  fecha_recepcion TIMESTAMPTZ NOT NULL,
  fecha_documento DATE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  numero_anexos INTEGER DEFAULT 0,

  -- Archivo principal (Supabase Storage)
  archivo_url TEXT, -- Path en bucket 'documentos-entrantes'
  archivo_nombre VARCHAR(350),
  archivo_tipo VARCHAR(50),
  archivo_tamanio BIGINT,
  hash_archivo VARCHAR(64), -- SHA-256 para integridad

  -- OCR
  texto_ocr TEXT,

  -- Foreign Keys (referencias a cat_valores_catalogo)
  id_prioridad INTEGER NOT NULL, -- Baja/Normal/Alta/Urgente
  id_tipo_documento INTEGER NOT NULL, -- Oficio/Circular/etc
  id_tipo_asunto INTEGER NOT NULL, -- Administrativo/Técnico/etc
  id_tipo_atencion INTEGER NOT NULL, -- Inmediata/Ordinaria
  id_marca_seguimiento INTEGER NOT NULL DEFAULT 2, -- 1=Especial, 2=Normal
  estatus_documento INTEGER NOT NULL DEFAULT 1, -- 1=Registrado, 2=Turnado, 3=Cancelado, 4=Concluido
  id_documento_recibido INTEGER NOT NULL, -- 1=Original, 2=Copia

  -- Referencias a otras tablas
  id_remitente BIGINT NOT NULL REFERENCES cat_remitente(id_remitente),
  id_ua_destinataria INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  id_titular_destinatario INTEGER REFERENCES cat_titular_unidad_admin(id_titular_unidad_admin),
  id_usuario_registro INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_doc_ent_folio ON tbl_documento_entrante(folio_interno);
CREATE INDEX idx_doc_ent_fecha ON tbl_documento_entrante(fecha_recepcion);
CREATE INDEX idx_doc_ent_ua ON tbl_documento_entrante(id_ua_destinataria);
CREATE INDEX idx_doc_ent_estatus ON tbl_documento_entrante(estatus_documento);
CREATE INDEX idx_doc_ent_remitente ON tbl_documento_entrante(id_remitente);

COMMENT ON TABLE tbl_documento_entrante IS 'Documentos recibidos por la institución';
COMMENT ON COLUMN tbl_documento_entrante.archivo_url IS 'Path en Supabase Storage bucket documentos-entrantes/{año}/{folio}/archivo.pdf';
COMMENT ON COLUMN tbl_documento_entrante.hash_archivo IS 'SHA-256 hash del archivo para verificar integridad';

-- Tabla: tbl_digitalizado_entrante (archivos adicionales)
CREATE TABLE tbl_digitalizado_entrante (
  id_digitalizado_entrante SERIAL PRIMARY KEY,
  nombre_digitalizado VARCHAR(250) NOT NULL,
  archivo_url TEXT NOT NULL, -- Path en Storage
  archivo_tipo VARCHAR(50),
  archivo_tamanio BIGINT,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  id_doc_entrante UUID NOT NULL REFERENCES tbl_documento_entrante(id_doc_entrante)
);

COMMENT ON TABLE tbl_digitalizado_entrante IS 'Archivos adicionales de documentos entrantes (múltiples por documento)';

-- Tabla: tbl_documento_adicional (documentos físicos complementarios)
CREATE TABLE tbl_documento_adicional (
  id_documento_adicional BIGSERIAL PRIMARY KEY,
  nombre_documento VARCHAR(150) NOT NULL,
  numero_fojas VARCHAR(25),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_doc_entrante UUID NOT NULL REFERENCES tbl_documento_entrante(id_doc_entrante),
  id_remitente BIGINT REFERENCES cat_remitente(id_remitente),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario)
);

COMMENT ON TABLE tbl_documento_adicional IS 'Documentos complementarios físicos de gran volumen (planos, mapas, etc.)';

-- Tabla: tbl_cancelar_entrante
CREATE TABLE tbl_cancelar_entrante (
  id_cancelar_entrante SERIAL PRIMARY KEY,
  observaciones VARCHAR(250) NOT NULL,
  id_usuario_cancela INTEGER NOT NULL,
  fecha_cancelacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_doc_entrante UUID NOT NULL REFERENCES tbl_documento_entrante(id_doc_entrante)
);

-- Tabla: tbl_expediente_docto_entrante
CREATE TABLE tbl_expediente_docto_entrante (
  id_expediente BIGSERIAL PRIMARY KEY,
  numero_expediente VARCHAR(150) NOT NULL,
  clasificacion VARCHAR(150),
  numero_caja VARCHAR(50),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_doc_entrante UUID NOT NULL REFERENCES tbl_documento_entrante(id_doc_entrante),
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  id_tipo_documento INTEGER NOT NULL,
  id_tipo_asunto INTEGER NOT NULL
);

-- ============================================================================
-- TURNADO DE DOCUMENTOS
-- ============================================================================

-- Tabla: tbl_turnar_entrante (PK compuesta)
CREATE TABLE tbl_turnar_entrante (
  id_doc_entrante UUID NOT NULL REFERENCES tbl_documento_entrante(id_doc_entrante),
  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),

  instruccion VARCHAR(1000) NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revisado SMALLINT NOT NULL DEFAULT 0, -- 0=No leído, 1=Leído

  fecha_hora_vencimiento TIMESTAMPTZ,
  dias_atencion SMALLINT NOT NULL,
  horas SMALLINT,

  observacion_rechazo VARCHAR(2500),
  id_estatus INTEGER NOT NULL DEFAULT 1, -- 1=Turnado, 2=En Proceso, 3=Rechazado, 4=Concluido

  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  id_asignacion_numero BIGINT REFERENCES tbl_asignacion_numeros(id_asignacion_numero), -- Número de oficio
  id_unidad_retornado INTEGER REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  id_sede INTEGER REFERENCES unidad_sede(id_sede),

  PRIMARY KEY (id_doc_entrante, id_unidad_administrativa),
  CONSTRAINT chk_turnar_revisado CHECK (revisado IN (0, 1))
);

CREATE INDEX idx_turnar_ua ON tbl_turnar_entrante(id_unidad_administrativa, id_estatus);
CREATE INDEX idx_turnar_fecha ON tbl_turnar_entrante(fecha_registro);
CREATE INDEX idx_turnar_vencimiento ON tbl_turnar_entrante(fecha_hora_vencimiento);
CREATE INDEX idx_turnar_revisado ON tbl_turnar_entrante(revisado, fecha_registro);

COMMENT ON TABLE tbl_turnar_entrante IS 'Distribución interna de documentos a unidades administrativas';
COMMENT ON COLUMN tbl_turnar_entrante.revisado IS 'Marca si el destinatario ya leyó el turnado';

-- Tabla: tbl_seguimiento_turno
CREATE TABLE tbl_seguimiento_turno (
  id_seguimiento_turno BIGSERIAL PRIMARY KEY,
  seguimiento_turno VARCHAR(2500) NOT NULL,
  porcentaje_avance SMALLINT NOT NULL DEFAULT 0,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  id_estatus INTEGER NOT NULL, -- 2=En proceso, 4=Concluido

  -- FK compuesta a tbl_turnar_entrante
  id_doc_entrante UUID NOT NULL,
  id_unidad_administrativa INTEGER NOT NULL,

  FOREIGN KEY (id_doc_entrante, id_unidad_administrativa)
    REFERENCES tbl_turnar_entrante(id_doc_entrante, id_unidad_administrativa),

  CONSTRAINT chk_seguimiento_avance CHECK (porcentaje_avance BETWEEN 0 AND 100)
);

CREATE INDEX idx_seguimiento_turno ON tbl_seguimiento_turno(id_doc_entrante, id_unidad_administrativa);
CREATE INDEX idx_seguimiento_fecha ON tbl_seguimiento_turno(fecha_registro DESC);

-- Tabla: tbl_digitalizado_seguimiento
CREATE TABLE tbl_digitalizado_seguimiento (
  id_digitalizado_seguimiento SERIAL PRIMARY KEY,
  nombre_digitalizado VARCHAR(250) NOT NULL,
  archivo_url TEXT NOT NULL, -- Path en Storage bucket 'seguimientos'
  archivo_tipo VARCHAR(50),
  archivo_tamanio BIGINT,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activo SMALLINT NOT NULL DEFAULT 1,
  id_seguimiento_turno BIGINT NOT NULL REFERENCES tbl_seguimiento_turno(id_seguimiento_turno),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  CONSTRAINT chk_dig_seguimiento_activo CHECK (activo IN (0, 1))
);

COMMENT ON TABLE tbl_digitalizado_seguimiento IS 'Archivos adjuntos a seguimientos de turnados';

-- Tabla: tbl_seguimiento_improcedente
CREATE TABLE tbl_seguimiento_improcedente (
  id_seguimiento_improcedente SERIAL PRIMARY KEY,
  observaciones VARCHAR(250) NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_seguimiento_turno BIGINT NOT NULL REFERENCES tbl_seguimiento_turno(id_seguimiento_turno),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario)
);

COMMENT ON TABLE tbl_seguimiento_improcedente IS 'Seguimientos que no deben contar en estadísticas (registrados por error)';

-- Tabla: tbl_turnar_complemento
CREATE TABLE tbl_turnar_complemento (
  id_turnar_complemento BIGSERIAL PRIMARY KEY,
  instruccion VARCHAR(1000) NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),

  -- FK compuesta
  id_doc_entrante UUID NOT NULL,
  id_unidad_administrativa INTEGER NOT NULL,

  FOREIGN KEY (id_doc_entrante, id_unidad_administrativa)
    REFERENCES tbl_turnar_entrante(id_doc_entrante, id_unidad_administrativa)
);

-- ============================================================================
-- ALCANCES (DOCUMENTOS COMPLEMENTARIOS)
-- ============================================================================

-- Tabla: tbl_alcance_entrante
CREATE TABLE tbl_alcance_entrante (
  id_alcance_entrante SERIAL PRIMARY KEY,
  numero_documento VARCHAR(150),
  fecha_recepcion TIMESTAMPTZ NOT NULL,
  asunto VARCHAR(3500) NOT NULL,
  anexo VARCHAR(250),
  estatus SMALLINT NOT NULL DEFAULT 1, -- 1=Registrado, 2=Turnado, 3=Cancelado, 4=Concluido

  id_doc_entrante UUID NOT NULL REFERENCES tbl_documento_entrante(id_doc_entrante),
  id_remitente BIGINT NOT NULL REFERENCES cat_remitente(id_remitente),
  id_tipo_documento INTEGER NOT NULL,
  id_tipo_asunto INTEGER NOT NULL,
  id_prioridad INTEGER NOT NULL,
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_alcance_doc ON tbl_alcance_entrante(id_doc_entrante);

COMMENT ON TABLE tbl_alcance_entrante IS 'Documentos complementarios que modifican/amplían un documento entrante previo';

-- Tabla: tbl_digitalizado_alcance
CREATE TABLE tbl_digitalizado_alcance (
  id_digitalizado_alcance SERIAL PRIMARY KEY,
  nombre_digitalizado VARCHAR(250) NOT NULL,
  archivo_url TEXT NOT NULL,
  archivo_tipo VARCHAR(50),
  archivo_tamanio BIGINT,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  id_alcance_entrante INTEGER NOT NULL REFERENCES tbl_alcance_entrante(id_alcance_entrante)
);

-- Tabla: tbl_alcance_turnado (PK compuesta)
CREATE TABLE tbl_alcance_turnado (
  id_alcance_entrante INTEGER NOT NULL REFERENCES tbl_alcance_entrante(id_alcance_entrante),
  numero_turnado INTEGER NOT NULL,

  instruccion VARCHAR(1000),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_estatus INTEGER NOT NULL, -- 4=Concluido, 5=Atendido, 11=Pendiente

  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),

  PRIMARY KEY (id_alcance_entrante, numero_turnado)
);

-- Tabla: tbl_seguimiento_alcance_turnado
CREATE TABLE tbl_seguimiento_alcance_turnado (
  id_seg_alcance_turnado SERIAL PRIMARY KEY,
  observaciones VARCHAR(2500) NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- FK compuesta
  id_alcance_entrante INTEGER NOT NULL,
  numero_turnado INTEGER NOT NULL,

  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),

  FOREIGN KEY (id_alcance_entrante, numero_turnado)
    REFERENCES tbl_alcance_turnado(id_alcance_entrante, numero_turnado)
);

-- Tabla: tbl_dig_alcanceturado_seg
CREATE TABLE tbl_dig_alcanceturado_seg (
  id_dig_alcance_turnado_seg SERIAL PRIMARY KEY,
  nombre_digitalizado VARCHAR(250),
  archivo_url TEXT,
  archivo_tipo VARCHAR(50),
  archivo_tamanio BIGINT,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  activo SMALLINT DEFAULT 1,
  id_seg_alcance_turnado INTEGER REFERENCES tbl_seguimiento_alcance_turnado(id_seg_alcance_turnado),
  id_usuario_registra INTEGER REFERENCES tbl_usuarios(id_usuario),
  CONSTRAINT chk_dig_alcance_activo CHECK (activo IN (0, 1))
);

-- Tabla: tbl_seg_alcance_improcedente
CREATE TABLE tbl_seg_alcance_improcedente (
  id_seg_alcance_improcedente SERIAL PRIMARY KEY,
  observaciones VARCHAR(250) NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_seg_alcance_turnado INTEGER NOT NULL REFERENCES tbl_seguimiento_alcance_turnado(id_seg_alcance_turnado),
  id_usuario_registro INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario)
);

-- ============================================================================
-- DOCUMENTOS SALIENTES
-- ============================================================================

-- Tabla: tbl_documento_saliente
CREATE TABLE tbl_documento_saliente (
  id_doc_saliente BIGSERIAL PRIMARY KEY,
  asunto VARCHAR(1100) NOT NULL,
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_estatus SMALLINT NOT NULL DEFAULT 1, -- 1=Registrado, 4=Concluido

  id_unidad_administrativa INTEGER NOT NULL REFERENCES cat_unidad_administrativa(id_unidad_administrativa),
  id_solicitante INTEGER NOT NULL REFERENCES cat_solicitante(id_solicitante),
  id_tipo_documento INTEGER NOT NULL,
  id_remitente_destino BIGINT NOT NULL REFERENCES cat_remitente(id_remitente),
  id_asignacion_numero BIGINT REFERENCES tbl_asignacion_numeros(id_asignacion_numero)
);

CREATE INDEX idx_doc_sal_ua ON tbl_documento_saliente(id_unidad_administrativa);
CREATE INDEX idx_doc_sal_fecha ON tbl_documento_saliente(fecha_solicitud);

COMMENT ON TABLE tbl_documento_saliente IS 'Documentos enviados por la institución (respuestas)';

-- Tabla: tbl_seguimiento_saliente
CREATE TABLE tbl_seguimiento_saliente (
  id_seguimiento_saliente BIGSERIAL PRIMARY KEY,
  seguimiento_saliente VARCHAR(1000) NOT NULL,
  archivo_url TEXT, -- Acuse de recibo en Storage
  archivo_nombre VARCHAR(200),
  archivo_tipo VARCHAR(50),
  archivo_tamanio BIGINT,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activo SMALLINT NOT NULL DEFAULT 1,
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  id_doc_saliente BIGINT NOT NULL REFERENCES tbl_documento_saliente(id_doc_saliente),
  CONSTRAINT chk_seg_saliente_activo CHECK (activo IN (0, 1))
);

COMMENT ON TABLE tbl_seguimiento_saliente IS 'Seguimientos de documentos salientes con acuses de recibo escaneados';

-- Tabla: tbl_documento_entrante_saliente (relación entrante-respuesta)
CREATE TABLE tbl_documento_entrante_saliente (
  id_documento_entrante_saliente BIGSERIAL PRIMARY KEY,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_doc_entrante UUID NOT NULL REFERENCES tbl_documento_entrante(id_doc_entrante),
  id_doc_saliente BIGINT NOT NULL REFERENCES tbl_documento_saliente(id_doc_saliente),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario)
);

COMMENT ON TABLE tbl_documento_entrante_saliente IS 'Trazabilidad: vincula documento entrante con su respuesta (saliente)';

-- Tabla: tbl_copia_documento_saliente (copias de conocimiento)
CREATE TABLE tbl_copia_documento_saliente (
  id_copia_documento_saliente SERIAL PRIMARY KEY,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_doc_saliente BIGINT NOT NULL REFERENCES tbl_documento_saliente(id_doc_saliente),
  id_remitente_destino BIGINT NOT NULL REFERENCES cat_remitente(id_remitente),
  id_usuario_registra INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario)
);

-- ============================================================================
-- AUDITORÍA Y CONTROL
-- ============================================================================

-- Tabla: tbl_log_auditoria (bitácora completa)
CREATE TABLE tbl_log_auditoria (
  id_log_auditoria BIGSERIAL PRIMARY KEY,
  modulo VARCHAR(300) NOT NULL,
  descripcion VARCHAR(300) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip VARCHAR(45), -- Soporta IPv6
  registro_modificado VARCHAR(300),
  registro_anterior VARCHAR(300),
  id_usuario INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario),
  id_accion INTEGER NOT NULL -- FK a cat_valores_catalogo (Alta/Baja/Cambio/Consulta/etc)
);

CREATE INDEX idx_log_fecha ON tbl_log_auditoria(fecha_creacion DESC);
CREATE INDEX idx_log_usuario ON tbl_log_auditoria(id_usuario);
CREATE INDEX idx_log_modulo ON tbl_log_auditoria(modulo);

COMMENT ON TABLE tbl_log_auditoria IS 'Auditoría completa de TODAS las acciones en el sistema';

-- Tabla: tbl_usuario_sesion
CREATE TABLE tbl_usuario_sesion (
  id_usuario_sesion BIGSERIAL PRIMARY KEY,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMPTZ,
  ip VARCHAR(45),
  id_usuario INTEGER NOT NULL REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_sesion_usuario ON tbl_usuario_sesion(id_usuario, fecha_inicio DESC);

-- Tabla: tbl_direccion_ip (control IPs autorizadas)
CREATE TABLE tbl_direccion_ip (
  id_direccion_ip SERIAL PRIMARY KEY,
  direccion_ip VARCHAR(45) NOT NULL UNIQUE,
  nombre VARCHAR(100),
  activo SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT chk_direccion_ip_activo CHECK (activo IN (0, 1))
);

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Catálogos base
INSERT INTO cat_catalogo (nombre_catalogo, descripcion) VALUES
('Prioridad', 'Niveles de urgencia de documentos'),
('TipoDocumento', 'Tipos de documentos oficiales'),
('TipoAsunto', 'Clasificación temática de asuntos'),
('TipoAtencion', 'Tipo de atención requerida'),
('MarcaSeguimiento', 'Control especial de documentos'),
('DocumentoRecibido', 'Original o Copia'),
('EstatusDocumento', 'Estados de documentos y turnados'),
('Accion', 'Tipos de acciones para bitácora');

-- Valores de Prioridad
INSERT INTO cat_valores_catalogo (id_catalogo, valor, codigo, orden) VALUES
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Prioridad'), 'Baja', 'BAJA', 1),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Prioridad'), 'Normal', 'NORMAL', 2),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Prioridad'), 'Alta', 'ALTA', 3),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Prioridad'), 'Urgente', 'URGENTE', 4);

-- Valores de TipoDocumento
INSERT INTO cat_valores_catalogo (id_catalogo, valor, codigo, orden) VALUES
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoDocumento'), 'Oficio', 'OFICIO', 1),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoDocumento'), 'Circular', 'CIRCULAR', 2),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoDocumento'), 'Memorándum', 'MEMO', 3),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoDocumento'), 'Acuerdo', 'ACUERDO', 4),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoDocumento'), 'Convenio', 'CONVENIO', 5);

-- Valores de TipoAsunto
INSERT INTO cat_valores_catalogo (id_catalogo, valor, codigo, orden) VALUES
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoAsunto'), 'Administrativo', 'ADM', 1),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoAsunto'), 'Técnico', 'TEC', 2),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoAsunto'), 'Jurídico', 'JUR', 3),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoAsunto'), 'Financiero', 'FIN', 4);

-- Valores de TipoAtencion
INSERT INTO cat_valores_catalogo (id_catalogo, valor, codigo, orden) VALUES
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoAtencion'), 'Inmediata', 'IMM', 1),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoAtencion'), 'Ordinaria', 'ORD', 2),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'TipoAtencion'), 'Informativa', 'INF', 3);

-- Valores de MarcaSeguimiento
INSERT INTO cat_valores_catalogo (id_catalogo, valor, codigo, orden) VALUES
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'MarcaSeguimiento'), 'Con seguimiento especial', 'ESPECIAL', 1),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'MarcaSeguimiento'), 'Normal', 'NORMAL', 2);

-- Valores de DocumentoRecibido
INSERT INTO cat_valores_catalogo (id_catalogo, valor, codigo, orden) VALUES
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'DocumentoRecibido'), 'Original', 'ORIG', 1),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'DocumentoRecibido'), 'Copia', 'COPIA', 2);

-- Valores de EstatusDocumento
INSERT INTO cat_valores_catalogo (id_catalogo, valor, codigo, orden) VALUES
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'EstatusDocumento'), 'Registrado', 'REG', 1),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'EstatusDocumento'), 'Turnado', 'TURN', 2),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'EstatusDocumento'), 'Cancelado', 'CANC', 3),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'EstatusDocumento'), 'Concluido', 'CONC', 4),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'EstatusDocumento'), 'En Proceso', 'PROC', 5),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'EstatusDocumento'), 'Atendido', 'ATEND', 6);

-- Valores de Accion
INSERT INTO cat_valores_catalogo (id_catalogo, valor, codigo, orden) VALUES
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Accion'), 'Alta', 'ALTA', 1),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Accion'), 'Baja', 'BAJA', 2),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Accion'), 'Cambio', 'CAMBIO', 3),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Accion'), 'Consulta', 'CONSULT', 4),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Accion'), 'Impresión', 'PRINT', 5),
((SELECT id_catalogo FROM cat_catalogo WHERE nombre_catalogo = 'Accion'), 'Descarga', 'DOWNLOAD', 6);

-- Estatus de usuario
INSERT INTO estatus_usuario (estatus_usuario) VALUES
('Baja'),
('Activo'),
('Inactivo'),
('Bloqueado'),
('Primer Ingreso');

-- Áreas de remitentes
INSERT INTO cat_area_remitente (area_remitente) VALUES
('Gobierno Federal'),
('Poder Legislativo'),
('Poder Judicial'),
('Gobierno Estatal'),
('Organismos Autónomos'),
('Organizaciones Civiles'),
('Sector Privado'),
('Ciudadanos'),
('Municipios'),
('Embajadas y Consulados');

-- Semáforo
INSERT INTO semaforo (porcentaje_venc, color) VALUES
(70, 'Verde'),
(99, 'Amarillo'),
(100, 'Rojo');

-- Roles básicos
INSERT INTO rol (rol, descripcion_rol) VALUES
('ADMINISTRADOR', 'Administrador del sistema con acceso total'),
('COORDINADOR', 'Coordinador de unidad administrativa'),
('CAPTURISTA', 'Captura documentos entrantes'),
('CONSULTOR', 'Solo consulta documentos'),
('TITULAR', 'Titular de unidad, turna y da seguimiento');

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Verificación
SELECT 'Esquema SISGEDI 2.0 creado exitosamente' AS status;
SELECT COUNT(*) AS total_tablas FROM information_schema.tables WHERE table_schema = 'public';
