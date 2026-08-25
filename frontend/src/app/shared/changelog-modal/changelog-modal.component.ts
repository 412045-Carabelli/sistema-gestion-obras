import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { ChangelogService } from '../../services/changelog/changelog.service';

const VERSION = 'v1.18.24';
const STORAGE_KEY = `sgo-changelog-seen-${VERSION}`;

interface ChangeItem {
  texto: string;
  estado: 'done' | 'pending';
}

interface ChangeGroup {
  modulo: string;
  icon: string;
  items: ChangeItem[];
}

@Component({
  selector: 'app-changelog-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, TagModule],
  templateUrl: './changelog-modal.component.html',
})
export class ChangelogModalComponent implements OnInit, OnDestroy {
  visible = false;
  version = VERSION;
  private sub = new Subscription();

  grupos: ChangeGroup[] = [
    {
      modulo: 'Mejoras 24-25/08/2026',
      icon: 'pi pi-sparkles',
      items: [
        { texto: 'Movimientos: se arregló un bug de base de datos por el que la columna "Tipo Transacción" (cobro/pago) aparecía siempre vacía en el listado', estado: 'done' },
        { texto: 'Reportes: si una tabla no tiene datos para el período/filtro elegido, ya no se muestra la tabla vacía, solo el mensaje "Sin datos"', estado: 'done' },
        { texto: 'Reportes: los filtros de Obra, Cliente y Proveedor ahora se acotan entre sí (igual que en Cuentas Corrientes) — elegir un cliente deja solo sus obras y proveedores disponibles', estado: 'done' },
        { texto: 'Reportes: al aplicar un filtro ya no se recarga toda la barra de filtros, solo los KPIs y las tablas', estado: 'done' },
        { texto: 'Obras: la fecha de inicio en el listado se ve más grande y sin el prefijo "Desde:"', estado: 'done' },
        { texto: 'Tablas: se pareja el redondeado de esquinas de todas las tablas con el de la barra de filtros, y se prolija el encabezado de columnas ordenables (el ícono de orden era más grande que el texto)', estado: 'done' },
        { texto: 'Tablas: se uniformó el grosor de letra de las columnas de texto en todos los listados (antes algunas columnas aparecían en negrita sin motivo); montos y badges de estado siguen resaltados', estado: 'done' },
        { texto: 'Tablas y barra de filtros: pequeña animación de aparición al terminar de cargar', estado: 'done' },
        { texto: 'Menú lateral: se sacaron los títulos que separaban los grupos de opciones, se agrandó un poco el texto de las opciones y se agregaron animaciones (entrada de items, hover, y al mostrar/ocultar con el botón del header)', estado: 'done' },
        { texto: 'Navegación: pequeña animación de transición al cambiar de página', estado: 'done' },
      ]
    },
    {
      modulo: 'Fixes Agosto 13/08/2026',
      icon: 'pi pi-check-circle',
      items: [
        { texto: 'Cuentas Corrientes: el PDF general muestra el nombre del proveedor filtrado (antes decía "Todos los proveedores") y ya no mezcla pagos de otros proveedores', estado: 'done' },
        { texto: 'Cuentas Corrientes: costos adicionales/ajustes sin proveedor ya no aparecen como deuda a proveedores (fila fantasma con proveedor NULL en el listado y en el KPI "por pagar" del dashboard)', estado: 'done' },
        { texto: 'Cuentas Corrientes: el PDF general de proveedor ya no superpone "Obra: [nombre]" con el título "Detalle de Obras"', estado: 'done' },
        { texto: 'Memoria descriptiva (obras-detail): se perdía el formato (viñetas, negrita, alineación) al guardar y volver a ver', estado: 'done' },
        { texto: 'Agendas: al abrir una tarea inexistente el backend devolvía 500 y la pantalla quedaba clavada — ahora devuelve 404', estado: 'done' },
        { texto: 'Sesión: se extiende de 15 minutos a 1 hora; al expirar y volver a loguear, redirige a la página donde estabas', estado: 'done' },
        { texto: 'Presupuesto de obra: pagar la comisión daba error (organizacion_id NULL); labels "Costos originales" / "Costos adicionales" / "Demasía de obra" separados y ordenados', estado: 'done' },
        { texto: 'Presupuesto de obra: "Total pagos" del detalle de movimientos incluía el pago de comisión, dando un saldo de proveedores distinto al del listado de cuentas corrientes', estado: 'done' },
        { texto: 'Alta de obra: crear cliente y crear proveedor son ahora una opción dentro del select correspondiente (antes botón aparte)', estado: 'done' },
        { texto: 'Movimientos: se agrega badge de color al tipo de transacción (cobro/pago) en el listado', estado: 'done' },
        { texto: 'Listado de obras: no se podía ordenar por columna (el modo de paginación por servidor ignoraba el criterio de orden)', estado: 'done' },
      ]
    },
    {
      modulo: 'Fixes Agosto 10/08/2026',
      icon: 'pi pi-check-circle',
      items: [
        { texto: 'Obras: fila de total con la sumatoria de presupuesto en el listado filtrado (todas las páginas, no solo la visible)', estado: 'done' },
        { texto: 'Facturas: modal de edición unificado con el de detalle (mismo ancho, mismos campos), mensajes de error visibles y bloqueo de guardado sin cambios', estado: 'done' },
        { texto: 'Facturas: no se podían crear ni editar — los mensajes de error quedaban invisibles y el gateway no reenviaba el plan al validar la funcionalidad', estado: 'done' },
        { texto: 'Modales: ya no se pueden arrastrar por la pantalla', estado: 'done' },
        { texto: 'Cuentas Corrientes: las obras COTIZADAS (cotización aún no confirmada) ya no impactan en el saldo de clientes ni proveedores', estado: 'done' },
        { texto: 'Cuentas Corrientes: nuevo filtro "Incluir obras sin deuda (saldo 0)" en el listado y en el PDF/Excel exportado', estado: 'done' },
      ]
    },
    {
      modulo: 'Fixes Pablo 28/07/2026',
      icon: 'pi pi-check-circle',
      items: [
        { texto: 'Verificar obras que muestran detalle de facturación pendiente sin estar marcadas para facturar (ej. Talar Center - Ingresos y rampas)', estado: 'done' },
        { texto: 'Cuentas Corrientes: al filtrar por proveedor, el filtro de obra ofrece solo las obras en las que participa', estado: 'done' },
        { texto: 'Verificar formato de texto al editar la memoria descriptiva de una obra', estado: 'done' },
        { texto: 'Habilitar impresión/exportación en todos los listados filtrados (ej. obras adjudicadas)', estado: 'done' },
        { texto: 'Módulo Facturas: poder revisar el PDF de una factura ya cargada', estado: 'done' },
        { texto: 'Botón "Impacta en Cta Cte" daba error: se quita', estado: 'done' },
        { texto: 'Restaurar opción COTIZADA en estados de obras', estado: 'done' },
        { texto: 'PDF de cuenta corriente (cliente + obra): respeta la obra seleccionada en vez de traer todas', estado: 'done' },
        { texto: 'Al seleccionar cliente, el filtro de obras muestra solo las obras de ese cliente', estado: 'done' },
      ]
    },
  ];

  get totalDone(): number {
    return this.grupos.reduce((acc, g) => acc + g.items.filter(i => i.estado === 'done').length, 0);
  }

  get totalItems(): number {
    return this.grupos.reduce((acc, g) => acc + g.items.length, 0);
  }

  contarDone(items: ChangeItem[]): number {
    return items.filter(i => i.estado === 'done').length;
  }

  constructor(private changelogService: ChangelogService) {}

  ngOnInit(): void {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      this.visible = true;
    }
    this.sub.add(
      this.changelogService.abrir$.subscribe(() => this.visible = true)
    );
  }

  cerrar(): void {
    localStorage.setItem(STORAGE_KEY, '1');
    this.visible = false;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
