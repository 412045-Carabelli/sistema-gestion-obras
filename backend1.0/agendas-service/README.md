# Agendas Service

Microservicio para gestionar tareas y agendas del sistema de gestión de obras.

## Funcionalidades

- Crear tareas
- Listar todas las tareas
- Obtener detalle de una tarea
- Actualizar tareas
- Cambiar estado de tareas (Pendiente → En Progreso → Completada)
- Eliminar tareas

## Campos de la Tarea

- `id`: Identificador único
- `titulo`: Título de la tarea (obligatorio)
- `obraId`: ID de la obra asociada (opcional)
- `clienteId`: ID del cliente asociado (opcional)
- `proveedorId`: ID del proveedor asociado (opcional)
- `estado`: Estado de la tarea (PENDIENTE, EN_PROGRESO, COMPLETADA)
- `descripcion`: Descripción enriquecida (texto)
- `creadoEn`: Fecha de creación
- `ultimaActualizacion`: Fecha de última actualización

## Endpoints

### Crear Tarea
```
POST /api/tareas
```

### Listar Tareas
```
GET /api/tareas
```

### Obtener Tarea
```
GET /api/tareas/{id}
```

### Actualizar Tarea
```
PUT /api/tareas/{id}
```

### Cambiar Estado
```
PATCH /api/tareas/{id}/estado
Body: { "estado": "EN_PROGRESO" }
```

### Eliminar Tarea
```
DELETE /api/tareas/{id}
```

## Configuración

- Puerto: 8088
- Base de datos: SQL Server
- Base de datos: sgo_agendas
