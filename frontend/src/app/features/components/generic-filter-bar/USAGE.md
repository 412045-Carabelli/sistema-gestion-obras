# Generic Filter Bar Component

Componente reutilizable para barras de filtros genéricas en pantallas @list.

## Features

- ✅ Soporte para múltiples tipos de input (select, input, date)
- ✅ Acciones custom (botones) configurables
- ✅ Manejo automático de formularios reactivos
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Diseño moderno y limpio

## Usage

### 1. Importar el componente

```typescript
import { GenericFilterBarComponent, FilterDefinition, FilterAction } from '../generic-filter-bar/generic-filter-bar.component';

@Component({
  imports: [GenericFilterBarComponent, ...]
})
export class MiListComponent {}
```

### 2. Definir filtros

```typescript
export class MiListComponent implements OnInit {
  filterDefinitions: FilterDefinition[] = [];
  filterActions: FilterAction[] = [];
  currentFilters: Record<string, any> = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.setupFilters();
  }

  private setupFilters(): void {
    this.filterDefinitions = [
      {
        key: 'clienteId',
        label: 'Cliente',
        type: 'select',
        placeholder: 'Todos',
        options: [
          { label: 'Cliente A', value: 1 },
          { label: 'Cliente B', value: 2 }
        ]
      },
      {
        key: 'nombre',
        label: 'Nombre',
        type: 'input',
        placeholder: 'Buscar por nombre...'
      },
      {
        key: 'fechaInicio',
        label: 'Fecha Inicio',
        type: 'date'
      }
    ];

    this.setupActions();
  }

  private setupActions(): void {
    this.filterActions = [
      {
        label: 'Exportar PDF',
        icon: 'pi pi-file-pdf',
        severity: 'info',
        callback: () => this.exportPdf()
      },
      {
        label: 'Exportar Excel',
        icon: 'pi pi-file-excel',
        severity: 'success',
        callback: () => this.exportExcel()
      }
    ];
  }
}
```

### 3. Usar en template

```html
<app-generic-filter-bar
  [filterDefinitions]="filterDefinitions"
  [actions]="filterActions"
  (filterChange)="onFilterChange($event)"
  (clearFilters)="onClearFilters()"
></app-generic-filter-bar>

<!-- Tu contenido -->
<div class="space-y-4">
  <!-- tablas, cards, etc -->
</div>
```

### 4. Manejar cambios de filtros

```typescript
onFilterChange(filters: Record<string, any>): void {
  this.currentFilters = filters;
  this.cargarDatos();  // Recargar datos con filtros
}

onClearFilters(): void {
  this.currentFilters = {};
  this.cargarDatos();  // Recargar sin filtros
}

private cargarDatos(): void {
  this.http.post('/api/datos', this.currentFilters).subscribe((data) => {
    // Actualizar tabla
  });
}

private exportPdf(): void {
  // Usar this.currentFilters para la exportación
  this.http.post('/api/export-pdf', this.currentFilters, { responseType: 'blob' })
    .subscribe((blob) => {
      // Descargar
    });
}
```

## Interfaces

### FilterDefinition

```typescript
interface FilterDefinition {
  key: string;                                    // Clave del filtro (formControlName)
  label: string;                                  // Etiqueta visible
  type: 'select' | 'input' | 'date';            // Tipo de input
  placeholder?: string;                           // Placeholder
  options?: Array<{ label: string; value: any }>; // Opciones (para select)
  validators?: any[];                             // Validadores (opcional)
}
```

### FilterAction

```typescript
interface FilterAction {
  label: string;                                       // Texto del botón
  icon: string;                                        // Icono PrimeNG (ej: 'pi pi-file-pdf')
  severity?: 'primary' | 'success' | 'danger' | 'info' | 'secondary';
  loading?: boolean;                                   // Mostrar spinner
  callback: () => void;                               // Función a ejecutar
}
```

## Eventos

### filterChange

Emitido cuando cualquier filtro cambia.

```typescript
(filterChange)="onFilterChange($event)"
// $event: Record<string, any> - Solo filtros con valores (null/'' excluidos)
```

### clearFilters

Emitido cuando se presiona el botón "Limpiar".

```typescript
(clearFilters)="onClearFilters()"
```

## Styling

El componente usa Tailwind CSS y es responsive:
- **Mobile**: Una columna, inputs a ancho completo
- **Tablet/Desktop**: Filas horizontales, compact layout
- **Acciones**: Alineadas a la derecha

Puedes overriding styles con CSS custom:

```css
::ng-deep app-generic-filter-bar .p-select {
  max-width: 200px;
}
```

## Ejemplo Completo

Ver `cuentas-corrientes-list.component.ts` para un ejemplo real.
