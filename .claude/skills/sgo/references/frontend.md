# Convenciones frontend — Angular 19

`frontend/` es el proyecto activo. `frontend1.2/` es build desplegado: **no editar**.

Stack: Angular `^19.2`, PrimeNG `^19.1` (+ `@primeng/themes` 20), PrimeIcons 7,
**Tailwind CSS 4**, RxJS 7.8, TypeScript 5.7.

## Estructura

```
frontend/src/app/
├── app.component.ts / app.config.ts / app.routes.ts
├── core/
│   ├── guards/          auth.guard.ts (authGuard, authMatchGuard, adminGuard), plan.guard.ts
│   ├── interceptors/    auth.interceptor.ts, plan-limit.interceptor.ts
│   ├── loading-server.interceptor.ts
│   ├── models/models.ts ← TODOS los modelos, archivo único (~880 líneas)
│   └── services/        navigation-history.service.ts
├── features/
│   ├── <dominio>-layout/   obras, clientes, proveedores, facturas, agendas,
│   │                       grupos, cuenta-corriente, movimientos
│   ├── components/         componentes de sub-dominio reutilizables
│   └── pages/              páginas ruteadas
├── services/<dominio>/     <x>.service.ts (HTTP) [+ <x>-state.service.ts]
└── shared/                 header, layout-header, sidebar, modal, kpi-card,
                            changelog-modal, upgrade-banner, pipes, directives, utils
```

## Componentes

`standalone: true` **siempre**, con `imports` explícitos. Sin NgModules.

```typescript
@Component({
  selector: 'app-obras-list',
  templateUrl: './obras-list.component.html',
  styleUrls: ['./obras-list.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, ToastModule],
  providers: [MessageService]
})
export class ObrasListComponent implements OnInit, OnDestroy {
  items: Obra[] = [];
  loading = false;
  private subs = new Subscription();

  constructor(private obrasService: ObrasService, private messageService: MessageService) {}

  ngOnInit(): void { this.cargarDatos(); }
  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
```

- El patrón dominante es **clase + RxJS + `Subscription` acumulada**, desuscrita en `ngOnDestroy`.
  **Copiá eso** al tocar componentes existentes.
- Hay **signals** solo en lo nuevo (planes, checkout, mi-plan, landing, agendas, `plan.service`).
  Podés usarlos en features nuevos aislados; no conviertas componentes existentes sin pedido.
- Templates: se usa el **control flow nuevo** (`@if`, `@for`, `@switch`), no `*ngIf`/`*ngFor`,
  en el código reciente. Los componentes viejos aún tienen las directivas estructurales.
- Los templates son inline (`template:`) o `templateUrl` según el componente — seguí el vecino.

## Estilos

**Tailwind 4 + PrimeNG conviven.** El layout y los estados visuales se hacen con clases Tailwind
(`flex flex-col`, `grid grid-cols-3 gap-4`, `text-gray-500 font-medium text-xs`); PrimeNG aporta
los componentes ricos (tablas, diálogos, selects, date pickers). Config en
`tailwind.config.js` + `postcss.config.js`.

Moneda: `| currency:'ARS':'symbol-narrow':'1.0-0'` es el formato habitual en listados.

## PrimeNG v19

| Necesitás | Módulo | Nota |
|---|---|---|
| Tabla | `TableModule` | `[value]`, `[loading]`, `[paginator]` |
| Select | `SelectModule` | usar `Select`, **no** `Dropdown` |
| Date picker | `DatePickerModule` | usar `DatePicker`, **no** `Calendar` |
| Diálogo | `DialogModule` | `[(visible)]`, `[modal]`, `[breakpoints]` |
| Toast | `ToastModule` | + `MessageService` |
| Confirmación | `ConfirmDialogModule` | + `ConfirmationService` |
| Botón / Card | `ButtonModule` / `CardModule` | |

`MessageService` está provisto globalmente en `app.config.ts`; re-proveelo local solo si
necesitás una instancia separada.

## Servicios

Un servicio HTTP por dominio en `services/<dominio>/<dominio>.service.ts`,
`@Injectable({ providedIn: 'root' })`, que devuelve `Observable<T>` sin `subscribe`.

```typescript
@Injectable({ providedIn: 'root' })
export class ObrasService {
  private apiUrl = `${environment.apiGateway}${environment.endpoints.obras}`;
  constructor(private http: HttpClient) {}

  listar(): Observable<Obra[]> { return this.http.get<Obra[]>(this.apiUrl); }
  crear(payload: ObraPayload): Observable<Obra> { return this.http.post<Obra>(this.apiUrl, payload); }
}
```

**Nunca hardcodees URLs**: siempre `environment.apiGateway + environment.endpoints.<x>`.

Los tipos de payload/respuesta específicos del transporte (`ObraPayload`, `CostoPayload`,
`ObrasConDetallesResponse`) pueden vivir en el propio `.service.ts`; los **modelos de dominio**
van en `core/models/models.ts`.

**State services** (`<x>-state.service.ts`) solo donde hace falta compartir estado entre layout y
pages: `BehaviorSubject` privado + `<x>$` público + `set/get/clear`. Existen para clientes,
facturas, obras, proveedores. No agregues uno si un servicio HTTP alcanza.

## Guards e interceptores

- `authGuard` / `authMatchGuard` — sesión. `adminGuard` — rol admin.
- `planGuard('facturas' | 'agenda' | 'grupos_obras' | ...)` — feature del plan; si falta,
  redirige a `/planes?feature=<x>`.
- `auth.interceptor.ts` — agrega `Bearer`, refresca el token en 401 con cola de espera
  (`BehaviorSubject` + `filter/take/switchMap`). Excluye `/auth/login`, `/auth/register`,
  `/auth/refresh`, y trata `/auth/change-password|perfil|admin` como 401 de negocio (no refresca).
- `plan-limit.interceptor.ts` — errores de límite de plan.
- `loading-server.interceptor.ts` — indicador de carga.

Token en `localStorage` bajo la clave **`sgo_access_token`** (la ruta raíz la usa para decidir
entre `/dashboard` y `/home`).

## Carga de datos

```typescript
forkJoin({
  obras: this.obrasService.listar(),
  clientes: this.clientesService.listar(),
  saldos: this.reportesService.obtenerSaldos().pipe(catchError(() => of([])))
}).subscribe(({ obras, clientes, saldos }) => { ... this.cargando = false; });
```

Un listado no sale de `loading` hasta tener **todos** los datos que muestra (ej. proveedores
espera también los saldos, si no la tabla parpadea con columnas vacías).

## Formularios

Reactive Forms en create/edit. `getRawValue()` (no `.value`) para incluir los controles
deshabilitados. Si el form es inválido: `markAllAsTouched()` y cortar.

## Regla de oro del frontend

**No recalcules negocio en el front.** Saldos, cuentas corrientes, totales de obra, estados
derivados y agregados vienen del backend. Si el dato no existe en el contrato, se agrega el
contrato — no se reconstruye en el componente ni en un pipe.

## Nomenclatura

| Elemento | Estilo | Ejemplo |
|---|---|---|
| Archivos | kebab-case | `obras-create.component.ts` |
| Clases | PascalCase | `ObrasCreateComponent` |
| Selectores | `app-` + kebab | `app-obras-list` |
| Métodos y variables | camelCase **en español** | `cargarDetalles()`, `obraActual` |
| Campos de payload/API | snake_case | `id_cliente`, `fecha_inicio`, `monto_restante` |

Los DTOs del backend viajan en snake_case, así que las interfaces de `models.ts` y los payloads
también los usan. No los "corrijas" a camelCase.

## Comandos

```bash
npm run start
```

```bash
npm run build
```
