import {Component, Input, Output, EventEmitter, signal, effect, inject, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {InputTextarea} from 'primeng/inputtextarea';
import {DropdownModule} from 'primeng/dropdown';
import {MessageService, ConfirmationService} from 'primeng/api';
import {forkJoin, of, switchMap} from 'rxjs';
import {ModalComponent} from '../../../../shared/modal/modal.component';

import {Agenda, ESTADOS_AGENDA_OPCIONES, PRIORIDADES_AGENDA, Obra, Cliente, Proveedor} from '../../../../core/models/models';
import {environment} from '../../../../../environments/environment';
import {AgendasService} from '../../../../services/agendas/agendas.service';
import {ObrasService} from '../../../../services/obras/obras.service';
import {ClientesService} from '../../../../services/clientes/clientes.service';
import {ProveedoresService} from '../../../../services/proveedores/proveedores.service';

@Component({
  selector: 'app-agenda-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    ModalComponent
  ],
  templateUrl: './agenda-modal.component.html',
  styleUrls: ['./agenda-modal.component.css']
})
export class AgendaModalComponent {
  visible = input<boolean>(false);
  agenda = input<Agenda | null>(null);
  /** Cuando se setea (usado embebido en Obras/Detalle), fija la obra y evita traer todas. */
  @Input() obraFija?: Obra;
  @Output() onClose = new EventEmitter<void>();
  @Output() onGuardada = new EventEmitter<Agenda>();
  @Output() onEliminada = new EventEmitter<number>();

  private agendasService = inject(AgendasService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private obrasService = inject(ObrasService);
  private clientesService = inject(ClientesService);
  private proveedoresService = inject(ProveedoresService);
  private http = inject(HttpClient);

  form!: FormGroup;
  guardando = signal(false);
  esEdicion = signal(false);
  estadosOptions = ESTADOS_AGENDA_OPCIONES;
  prioridadesOptions = PRIORIDADES_AGENDA;
  obrasOptions = signal<Array<{label: string; value: number}>>([]);
  obrasMap = signal<Map<number, Obra>>(new Map());
  clientesOptions = signal<Array<{label: string; value: number}>>([]);
  proveedoresOptions = signal<Array<{label: string; value: number}>>([]);
  /** Listas completas sin acotar por ningún filtro (para restaurar cuando se limpian todos). */
  private obrasOptionsCompletas: Array<{label: string; value: number}> = [];
  private clientesOptionsCompletas: Array<{label: string; value: number}> = [];
  private proveedoresOptionsCompletas: Array<{label: string; value: number}> = [];
  cargandoFiltro = signal(false);
  cargandoDatos = signal(false);

  constructor() {
    effect(() => {
      const visible = this.visible();
      const agenda = this.agenda(); // track always, even when visible=false
      if (visible) {
        this.cargarDatos();
        this.inicializarFormulario();
      }
    });
  }

  private cargarDatos() {
    this.cargandoDatos.set(true);

    if (this.obraFija) {
      // Embebido en Obras/Detalle: la obra ya se conoce, no hace falta traer todas.
      const map = new Map<number, Obra>();
      map.set(this.obraFija.id!, this.obraFija);
      this.obrasMap.set(map);
      this.obrasOptions.set([{ label: this.obraFija.nombre, value: this.obraFija.id! }]);
      this.clientesOptions.set(
        this.obraFija.cliente ? [{ label: this.obraFija.cliente.nombre, value: this.obraFija.cliente.id }] : []
      );
    } else {
      this.obrasService.getObrasSimple().subscribe({
        next: (obras) => {
          const EXCLUIDOS = ['PERDIDA', 'FINALIZADA'];
          const obrasFiltradas = obras
            .filter(o => {
              const raw = o.obra_estado;
              const estado = typeof raw === 'string'
                ? raw.toUpperCase()
                : ((raw as any)?.name ?? (raw as any)?.value ?? '').toString().toUpperCase();
              return !EXCLUIDOS.includes(estado) && o.activo !== false;
            })
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
          const map = new Map<number, Obra>();
          obrasFiltradas.forEach(o => map.set(o.id!, o));
          this.obrasMap.set(map);
          this.obrasOptionsCompletas = obrasFiltradas.map(o => ({ label: o.nombre, value: o.id! }));
          this.obrasOptions.set(this.obrasOptionsCompletas);
        },
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'No se pudieron cargar las obras'
          });
        }
      });

      this.clientesService.getClientesSimple().subscribe({
        next: (clientes) => {
          const clientesActivos = clientes
            .filter(c => c.activo !== false)
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
          this.clientesOptionsCompletas = clientesActivos.map(c => ({ label: c.nombre, value: c.id }));
          this.clientesOptions.set(this.clientesOptionsCompletas);
        },
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'No se pudieron cargar los clientes'
          });
        }
      });
    }

    if (this.obraFija) {
      // Embebido en Obras/Detalle: solo los proveedores con costos cargados en esta obra.
      this.proveedoresOptions.set(
        this.proveedoresDeObra(this.obraFija).map(p => ({ label: p.nombre, value: p.id! }))
      );
      this.cargandoDatos.set(false);
    } else {
      this.proveedoresService.getProveedoresSimple().subscribe({
        next: (proveedores) => {
          const proveedoresActivos = proveedores
            .filter(p => p.activo !== false)
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
          this.proveedoresOptionsCompletas = proveedoresActivos.map(p => ({ label: p.nombre, value: p.id }));
          this.proveedoresOptions.set(this.proveedoresOptionsCompletas);
          this.cargandoDatos.set(false);
        },
        error: () => {
          this.cargandoDatos.set(false);
          this.messageService.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'No se pudieron cargar los proveedores'
          });
        }
      });
    }
  }

  /** Proveedores únicos con costos cargados en la obra (evita pedir el catálogo completo). */
  private proveedoresDeObra(obra: Obra): Proveedor[] {
    const map = new Map<number, Proveedor>();
    (obra.costos || []).forEach(c => {
      const id = c.proveedor?.id ?? c.id_proveedor;
      if (id && !map.has(id)) {
        map.set(id, c.proveedor ?? ({ id, nombre: `Proveedor #${id}` } as Proveedor));
      }
    });
    return [...map.values()].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }

  private inicializarFormulario() {
    const agenda = this.agenda();
    this.esEdicion.set(!!agenda?.id);

    let fechaInicioFormato: string | null = null;
    let fechaVencimientoFormato: string | null = null;

    if (agenda?.fechaInicio) {
      try {
        const fecha = new Date(agenda.fechaInicio);
        if (!isNaN(fecha.getTime())) {
          const y = fecha.getFullYear();
          const m = String(fecha.getMonth() + 1).padStart(2, '0');
          const d = String(fecha.getDate()).padStart(2, '0');
          fechaInicioFormato = `${y}-${m}-${d}`;
        }
      } catch {}
    }
    if (!fechaInicioFormato && !agenda?.id) {
      // Alta nueva: default hoy (fecha local, no UTC)
      const hoy = new Date();
      const y = hoy.getFullYear();
      const m = String(hoy.getMonth() + 1).padStart(2, '0');
      const d = String(hoy.getDate()).padStart(2, '0');
      fechaInicioFormato = `${y}-${m}-${d}`;
    }

    if (agenda?.fechaVencimiento) {
      const fecha = new Date(agenda.fechaVencimiento);
      const y = fecha.getFullYear();
      const m = String(fecha.getMonth() + 1).padStart(2, '0');
      const d = String(fecha.getDate()).padStart(2, '0');
      fechaVencimientoFormato = `${y}-${m}-${d}`;
    }

    this.form = this.fb.group({
      titulo: [agenda?.titulo || '', Validators.required],
      estado: [agenda?.estado || 'PENDIENTE'],
      prioridad: [agenda?.prioridad || 'MEDIA'],
      obraId: [agenda?.obraId || this.obraFija?.id || null],
      clienteId: [agenda?.clienteId || this.obraFija?.cliente?.id || null],
      proveedorId: [agenda?.proveedorId || null],
      descripcion: [agenda?.descripcion || ''],
      fechaInicio: [fechaInicioFormato || null],
      fechaVencimiento: [fechaVencimientoFormato || null]
    }, { validators: this.validadorFechas() });

    if (this.obraFija) {
      this.form.get('obraId')?.disable();
    }
  }

  private validadorFechas() {
    return (group: AbstractControl): ValidationErrors | null => {
      const fechaInicio = group.get('fechaInicio')?.value;
      const fechaVencimiento = group.get('fechaVencimiento')?.value;

      if (fechaInicio && fechaVencimiento) {
        const inicio = new Date(fechaInicio).getTime();
        const vencimiento = new Date(fechaVencimiento).getTime();

        if (vencimiento < inicio) {
          group.get('fechaVencimiento')?.setErrors({ fechaMenorQueInicio: true });
          return { fechaMenorQueInicio: true };
        } else {
          const errors = group.get('fechaVencimiento')?.errors;
          if (errors) {
            delete errors['fechaMenorQueInicio'];
            if (Object.keys(errors).length === 0) {
              group.get('fechaVencimiento')?.setErrors(null);
            }
          }
        }
      }
      return null;
    };
  }

  /**
   * Filtro en cascada (obra / cliente / proveedor, cada uno opcional e independiente):
   * - Obra elegida (1:1 con su cliente): autocompleta cliente y acota proveedores a los de esa obra.
   * - Proveedor elegido: acota obras a las de ese proveedor, y clientes a los de esas obras.
   * - Cliente elegido: acota obras a las de ese cliente, y proveedores a los de esas obras.
   * - Nada elegido: vuelve a mostrar los catálogos completos.
   * No se usa en contexto embebido (obraFija): ahí la obra ya viene fija y bloqueada.
   */
  onFiltroCambiado(origen: 'obraId' | 'clienteId' | 'proveedorId') {
    if (this.obraFija) return;

    const obraId = this.form.get('obraId')?.value;
    const proveedorId = this.form.get('proveedorId')?.value;
    const clienteId = this.form.get('clienteId')?.value;

    if (obraId) {
      // Obra→cliente es 1:1: el combo de cliente queda acotado a ÚNICAMENTE el de esa obra
      // (se elija o se borre el valor, la opción disponible sigue siendo esa sola).
      const obra = this.obrasMap().get(obraId);
      this.clientesOptions.set(
        obra?.cliente ? [{ label: obra.cliente.nombre, value: obra.cliente.id }] : []
      );
      // Autocompletar el valor solo cuando el cambio vino de elegir la obra — si el usuario
      // después limpia el cliente a mano, no se lo volvemos a forzar (pero sigue siendo la
      // única opción disponible en el combo).
      if (origen === 'obraId' && obra?.cliente) {
        this.form.patchValue({ clienteId: obra.cliente.id }, { emitEvent: false });
      }
      this.cargandoFiltro.set(true);
      this.http.get<Array<{id: number; nombre: string}>>(
        `${environment.apiGateway}/bff/reportes/filtros/proveedores-por-obra?obraId=${obraId}`
      ).subscribe({
        next: (proveedores) => {
          this.proveedoresOptions.set(
            proveedores.map(p => ({ label: p.nombre, value: p.id })).sort((a, b) => a.label.localeCompare(b.label, 'es'))
          );
          this.cargandoFiltro.set(false);
        },
        error: () => {
          this.cargandoFiltro.set(false);
          this.avisoFiltro();
        }
      });
      return;
    }

    if (proveedorId) {
      this.obrasOptions.set(this.obrasOptionsCompletas);
      this.cargandoFiltro.set(true);
      this.http.get<Array<{id: number; nombre: string}>>(
        `${environment.apiGateway}/bff/reportes/filtros/obras-por-proveedor?proveedorId=${proveedorId}`
      ).pipe(
        switchMap(obras => {
          this.obrasOptions.set(obras.map(o => ({ label: o.nombre, value: o.id })));
          if (obras.length === 0) return of([] as Array<{id: number; nombre: string}>[]);
          return forkJoin(obras.map(o =>
            this.http.get<Array<{id: number; nombre: string}>>(
              `${environment.apiGateway}/bff/reportes/filtros/clientes-por-obra?obraId=${o.id}`
            )
          ));
        })
      ).subscribe({
        next: (results) => {
          this.clientesOptions.set(this.mergeUnicos(results));
          this.cargandoFiltro.set(false);
        },
        error: () => {
          this.cargandoFiltro.set(false);
          this.avisoFiltro();
        }
      });
      return;
    }

    if (clienteId) {
      this.proveedoresOptions.set(this.proveedoresOptionsCompletas);
      this.cargandoFiltro.set(true);
      this.http.get<Array<{id: number; nombre: string}>>(
        `${environment.apiGateway}/bff/reportes/filtros/obras-por-cliente?clienteId=${clienteId}`
      ).pipe(
        switchMap(obras => {
          this.obrasOptions.set(obras.map(o => ({ label: o.nombre, value: o.id })));
          if (obras.length === 0) return of([] as Array<{id: number; nombre: string}>[]);
          return forkJoin(obras.map(o =>
            this.http.get<Array<{id: number; nombre: string}>>(
              `${environment.apiGateway}/bff/reportes/filtros/proveedores-por-obra?obraId=${o.id}`
            )
          ));
        })
      ).subscribe({
        next: (results) => {
          this.proveedoresOptions.set(this.mergeUnicos(results));
          this.cargandoFiltro.set(false);
        },
        error: () => {
          this.cargandoFiltro.set(false);
          this.avisoFiltro();
        }
      });
      return;
    }

    // Ningún filtro activo: catálogos completos.
    this.obrasOptions.set(this.obrasOptionsCompletas);
    this.clientesOptions.set(this.clientesOptionsCompletas);
    this.proveedoresOptions.set(this.proveedoresOptionsCompletas);
  }

  private mergeUnicos(grupos: Array<Array<{id: number; nombre: string}>>): Array<{label: string; value: number}> {
    const set = new Map<number, string>();
    grupos.forEach(grupo => grupo.forEach(item => set.set(item.id, item.nombre)));
    return Array.from(set.entries())
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }

  private avisoFiltro() {
    this.messageService.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'No se pudieron filtrar obras/clientes/proveedores'
    });
  }

  guardar() {
    if (!this.form.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa los campos obligatorios y verifica las fechas'
      });
      return;
    }

    this.guardando.set(true);
    const formValue = this.form.getRawValue();

    if (formValue.fechaInicio) {
      const [y, mo, d] = formValue.fechaInicio.split('-').map(Number);
      formValue.fechaInicio = new Date(y, mo - 1, d, 12, 0, 0).toISOString();
    }

    if (formValue.fechaVencimiento) {
      const [y, mo, d] = formValue.fechaVencimiento.split('-').map(Number);
      formValue.fechaVencimiento = new Date(y, mo - 1, d, 12, 0, 0).toISOString();
    }

    const agenda: Agenda = {
      ...formValue,
      id: this.agenda()?.id
    };

    const operacion = this.esEdicion()
      ? this.agendasService.actualizar(agenda.id!, agenda)
      : this.agendasService.crear(agenda);

    operacion.subscribe({
      next: (resultado) => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion() ? 'Tarea actualizada' : 'Tarea creada',
          detail: `La tarea "${resultado.titulo}" fue ${this.esEdicion() ? 'actualizada' : 'creada'} exitosamente`,
          life: 3000
        });
        this.onGuardada.emit(resultado);
      },
      error: () => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la tarea',
          life: 3000
        });
      }
    });
  }

  eliminar() {
    const agendaActual = this.agenda();
    if (!agendaActual?.id) return;

    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar esta tarea?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.guardando.set(true);
        this.agendasService.eliminar(agendaActual.id!).subscribe({
          next: () => {
            this.guardando.set(false);
            this.onEliminada.emit(agendaActual.id!);
          },
          error: () => {
            this.guardando.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la tarea'
            });
          }
        });
      }
    });
  }

  cerrar() {
    this.onClose.emit();
  }

  getEstadoLabel(estado: string): string {
    return ESTADOS_AGENDA_OPCIONES.find(e => e.name === estado)?.label || estado;
  }
}
