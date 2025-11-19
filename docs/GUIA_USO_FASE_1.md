# 📖 GUÍA DE USO - SISGEDI 2.0 (FASE 1)

## 🎯 INTRODUCCIÓN

Bienvenido a SISGEDI 2.0 - Sistema de Gestión de Documentación Integral. Esta guía te ayudará a utilizar las funcionalidades implementadas en la Fase 1.

---

## 🚀 INICIO RÁPIDO

### Requisitos Previos

1. ✅ Base de datos creada en Supabase (ejecutar `supabase_datos_prueba.sql`)
2. ✅ Variables de entorno configuradas (`.env.local`)
3. ✅ Usuario creado en Supabase Auth
4. ✅ Dependencias instaladas (`npm install`)

### Primer Acceso

1. Ejecutar el proyecto en desarrollo:
   ```bash
   npm run dev
   ```

2. Abrir navegador en: `http://localhost:3000`

3. Serás redirigido automáticamente a `/login`

---

## 🔐 MÓDULO DE AUTENTICACIÓN

### Iniciar Sesión

1. Ingresa a `http://localhost:3000/login`

2. Completa el formulario:
   - **Correo Institucional**: El email registrado en Supabase Auth
   - **Contraseña**: La contraseña configurada

3. Click en "Iniciar Sesión"

**Ejemplo con datos de prueba**:
```
Email: admin@sisgedi.gob.mx
Password: [tu contraseña configurada en Supabase]
```

### Validaciones

El sistema valida:
- ✅ Credenciales correctas en Supabase Auth
- ✅ Usuario existe en `tbl_usuarios`
- ✅ Estado del usuario es "Activo"

Si alguna validación falla, verás un mensaje de error específico.

### Cerrar Sesión

1. En cualquier página del dashboard, localiza el sidebar izquierdo
2. Scroll hasta el final
3. Click en "Cerrar Sesión"
4. Serás redirigido a `/login`

---

## 📊 DASHBOARD PRINCIPAL

### Vista General

Al iniciar sesión, verás el dashboard principal con:

#### 1. Tarjetas de Estadísticas
Cuatro tarjetas con contadores en tiempo real:
- **Docs. Entrantes**: Total de documentos recibidos
- **Docs. Salientes**: Total de documentos enviados
- **Turnados**: Total de turnados realizados
- **Inventario**: Total de items registrados

**Función**: Click en cualquier tarjeta para ir al módulo correspondiente

#### 2. Documentos Recientes
Lista de los últimos 5 documentos entrantes registrados, mostrando:
- Folio interno
- Prioridad (badge de color)
- Asunto
- Fecha de registro
- Estatus actual

### Navegación

**Sidebar izquierdo** con acceso a:
- Dashboard
- Docs. Entrantes
- Docs. Salientes
- Turnados
- Inventario
- Búsqueda
- Notificaciones
- **Administración** ← Acceso a catálogos

El menú visible depende de tu rol asignado.

---

## ⚙️ ADMINISTRACIÓN DE CATÁLOGOS

### Acceso

1. Click en "Administración" en el sidebar
2. Verás 5 módulos de administración disponibles

---

## 📋 CATÁLOGOS DE VALORES

**Ruta**: Dashboard → Administración → Catálogos del Sistema

### ¿Qué son?

Los catálogos de valores almacenan opciones reutilizables del sistema, como:
- **Prioridad**: Urgente, Alta, Media, Baja
- **Tipo Documento**: Oficio, Circular, Memorándum, etc.
- **Tipo Atención**: Para Atención, Para Conocimiento, etc.

### Crear Nuevo Catálogo

1. Click en "Nuevo Catálogo" (botón azul superior derecho)

2. Completa el formulario:
   - **Tipo de Catálogo**: Categoría que agrupa valores similares
     - Ejemplos: "Prioridad", "Tipo Documento", "Estado"
   - **Valor**: El valor específico del catálogo
     - Ejemplos: "Urgente", "Oficio", "Cancelado"
   - **Descripción**: (Opcional) Explicación del valor
   - **Es modificable**: Si se puede editar/eliminar después
   - **Activo**: Si está disponible para uso

3. Click en "Crear"

**Ejemplo práctico**:
```
Tipo de Catálogo: Estado
Valor: En Revisión
Descripción: Documento en proceso de revisión interna
Es modificable: ✓
Activo: ✓
```

### Editar Catálogo

1. Localiza el catálogo en la tabla
2. Click en el icono de lápiz (✏️)
3. Modifica los campos necesarios
4. Click en "Actualizar"

**⚠️ Nota**: Solo catálogos con `es_modificable = true` pueden editarse

### Eliminar Catálogo

1. Click en el icono de papelera (🗑️)
2. Confirma la eliminación en el modal
3. El catálogo será eliminado permanentemente

**⚠️ Advertencia**:
- Solo catálogos modificables pueden eliminarse
- Si el catálogo está en uso, la eliminación puede fallar

### Filtrar por Tipo

Usa el selector superior izquierdo para filtrar por tipo de catálogo:
- "Todos los tipos" (por defecto)
- "Prioridad"
- "Tipo Documento"
- etc.

---

## 👥 ROLES Y PERMISOS

**Ruta**: Dashboard → Administración → Roles y Permisos

### ¿Qué son?

Los roles definen qué puede hacer cada usuario en el sistema. Cada rol tiene:
- **Nombre**: Ej. "Administrador General", "Capturista"
- **Descripción**: Explicación del rol
- **Permisos de Menú**: Elementos del menú que puede ver

### Crear Nuevo Rol

1. Click en "Nuevo Rol"

2. Completa el formulario:
   - **Nombre del Rol**: Nombre descriptivo
   - **Descripción**: Funciones del rol
   - **Permisos de Menú**: Selecciona checkboxes de los módulos permitidos
   - **Activo**: Si el rol está disponible

3. Click en "Crear"

**Ejemplo práctico**:
```
Nombre: Supervisor de Documentos
Descripción: Supervisa entrada y salida de documentos
Permisos:
  ✓ dashboard
  ✓ documentos
  ✓ turnados
  ✓ reportes
  ☐ configuracion
  ☐ auditoria
Activo: ✓
```

### Permisos de Menú Disponibles

- `dashboard` - Acceso al dashboard principal
- `documentos` - Gestión de documentos entrantes/salientes
- `turnados` - Sistema de turnado
- `inventario` - Gestión de inventario
- `busqueda` - Búsqueda global
- `notificaciones` - Ver notificaciones
- `usuarios` - Administrar usuarios
- `reportes` - Generar reportes
- `configuracion` - Configuración del sistema
- `auditoria` - Ver logs de auditoría

### Editar Permisos

1. Click en editar (✏️) en el rol deseado
2. Marca/desmarca checkboxes de permisos
3. Click en "Actualizar"

**Los cambios se reflejan inmediatamente** en las sesiones de usuarios con ese rol (después de recargar).

### Eliminar Rol

1. Click en eliminar (🗑️)
2. Confirma en el modal

**⚠️ Protección**: No se puede eliminar un rol que tiene usuarios asignados.

---

## 🏢 UNIDADES ADMINISTRATIVAS

**Ruta**: Dashboard → Administración → Unidades Administrativas

### ¿Qué son?

Representan la estructura organizacional de la institución en 4 niveles jerárquicos:
- **Nivel 1**: Secretaría (raíz)
- **Nivel 2**: Subsecretarías
- **Nivel 3**: Direcciones Generales
- **Nivel 4**: Direcciones de Área

### Visualización de Jerarquía

La tabla muestra la jerarquía visual mediante:
- **Indentación**: Niveles más profundos tienen mayor margen izquierdo
- **Flechas**: Indican subordinación
- **Badges de Nivel**: "Nivel 1", "Nivel 2", etc.

### Crear Nueva UA

1. Click en "Nueva Unidad Administrativa"

2. Completa el formulario:
   - **Nombre de la UA**: Nombre completo de la unidad
   - **Código de UA**: Código alfanumérico único (Ej: SS-DG-001)
   - **Nivel Jerárquico**: Selecciona del 1 al 4
   - **UA Superior**: Solo si nivel > 1, selecciona la UA padre
   - **Dirección**: Ubicación física (opcional)
   - **Teléfono**: Número de contacto (opcional)
   - **Extensión**: Extensión telefónica (opcional)
   - **Activa**: Si está operativa

3. Click en "Crear"

**Ejemplo - UA de Nivel 1**:
```
Nombre: Secretaría de Salud
Código: SS-001
Nivel: 1 (Raíz)
UA Superior: (vacío - es raíz)
Dirección: Av. Paseo de la Reforma 450
Teléfono: 5555-1234
Extensión: 1000
Activa: ✓
```

**Ejemplo - UA de Nivel 3**:
```
Nombre: Dirección General de Epidemiología
Código: SS-DG-001
Nivel: 3 (Dirección General)
UA Superior: Subsecretaría de Prevención (Nivel 2)
Teléfono: 5555-2001
Extensión: 2100
Activa: ✓
```

### Reglas de Jerarquía

1. **Nivel 1**: No requiere UA superior (es raíz)
2. **Nivel 2**: Requiere UA superior de Nivel 1
3. **Nivel 3**: Requiere UA superior de Nivel 1 o 2
4. **Nivel 4**: Requiere UA superior de Nivel 1, 2 o 3

El selector de "UA Superior" muestra automáticamente solo las UAs válidas según el nivel seleccionado.

### Editar UA

1. Click en editar (✏️)
2. Modifica campos necesarios
3. Click en "Actualizar"

**⚠️ Cuidado**: Cambiar el nivel jerárquico puede afectar UAs subordinadas.

### Eliminar UA

1. Click en eliminar (🗑️)
2. Confirma en el modal

**⚠️ Protección**: No se puede eliminar una UA que tiene unidades subordinadas.

---

## 🎨 COMPONENTES DE LA INTERFAZ

### Botones

Los botones tienen 4 variantes:
- **Primary** (Azul): Acción principal
- **Secondary** (Gris): Acción secundaria
- **Danger** (Rojo): Acciones destructivas
- **Ghost** (Transparente): Acciones terciarias

**Estados**:
- Normal: Interactivo
- Hover: Cambia de tono
- Loading: Muestra spinner
- Disabled: Gris y no clickeable

### Formularios

**Campos requeridos** muestran asterisco rojo (*)

**Validaciones**:
- Borde azul: Campo normal
- Borde rojo: Error de validación
- Mensaje debajo: Descripción del error

### Tablas

**Características**:
- Scroll horizontal en pantallas pequeñas
- Acciones a la derecha de cada fila
- Estado de loading con skeleton
- Mensaje de "sin datos" si está vacía

### Modales

**Controles**:
- **ESC**: Cierra el modal
- **Click fuera**: Cierra el modal
- **X** (esquina superior derecha): Cierra el modal
- **Botón Cancelar**: Cierra sin guardar

**Tipos**:
- **Modal normal**: Para formularios
- **Modal de confirmación**: Para acciones destructivas (rojo)

### Alertas

**Tipos**:
- **Success** (Verde): Operación exitosa
- **Error** (Rojo): Error en operación
- **Warning** (Amarillo): Advertencia
- **Info** (Azul): Información general

Click en la X para cerrar la alerta.

---

## ⌨️ ATAJOS DE TECLADO

| Acción | Atajo |
|--------|-------|
| Cerrar modal | ESC |
| Navegar formulario | TAB |
| Enviar formulario | ENTER (en campos de texto) |

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### No puedo iniciar sesión

**Verifica**:
1. ✅ Credenciales correctas en Supabase Auth
2. ✅ Usuario existe en tabla `tbl_usuarios`
3. ✅ Campo `estatus` del usuario es "Activo"
4. ✅ El `id_usuario` en `tbl_usuarios` coincide con el UID de Supabase Auth

**Solución**:
```sql
-- Verificar usuario en Supabase Auth (ver en dashboard de Supabase)
-- Verificar en tbl_usuarios
SELECT * FROM tbl_usuarios WHERE correo_institucional = 'tu@email.com';

-- Si es necesario, activar usuario
UPDATE tbl_usuarios
SET estatus = 'Activo'
WHERE correo_institucional = 'tu@email.com';
```

### No veo opciones en el menú

**Causa**: Tu rol no tiene permisos asignados

**Solución**:
1. Login con usuario administrador
2. Ir a Roles y Permisos
3. Editar tu rol
4. Marcar los permisos necesarios
5. Logout y login nuevamente

### Error al crear/editar catálogo

**Posibles causas**:
- Valor duplicado (tipo_catalogo + valor debe ser único)
- Catálogo no modificable
- Campos requeridos vacíos

**Solución**:
- Revisar mensaje de error específico
- Verificar que `es_modificable = true`
- Completar todos los campos requeridos

### No puedo eliminar un registro

**Protecciones del sistema**:
- Catálogo de valores: Solo si `es_modificable = true`
- Rol: Solo si no tiene usuarios asignados
- UA: Solo si no tiene UAs subordinadas

**Solución**:
1. Eliminar primero las dependencias
2. Luego eliminar el registro principal

---

## 📞 SOPORTE

Para reportar bugs o solicitar ayuda:

1. **GitHub Issues**: https://github.com/rrojaszarate-sys/SISGEDI/issues
2. **Documentación técnica**: `/docs/PRUEBAS_FASE_1.md`
3. **Configuración**: Ver `CONFIGURACION_ENTORNO.md`

---

## 🔄 PRÓXIMAS FUNCIONALIDADES

En desarrollo para la Fase 2:
- ✓ Gestión completa de Documentos Entrantes
- ✓ Sistema de Turnado con workflow
- ✓ Módulo de Inventario
- ✓ Búsqueda global con FTS
- ✓ Generación de reportes

---

**Versión**: SISGEDI 2.0 - Fase 1
**Última actualización**: 2025-11-19
**Autor**: SISGEDI Team
