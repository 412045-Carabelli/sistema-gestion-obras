const SEP = '─────────────';

function fmtMoneda(valor) {
  if (valor == null) return '$0';
  return '$' + Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtFecha(valor) {
  if (!valor) return '-';
  try {
    return new Date(valor).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  } catch {
    return valor;
  }
}

function fmtMovObra(m) {
  // En CC Obra los movimientos son COBRO (verde)
  const emoji = '🟢';
  const label = m.asociadoId ? `Cobro #${m.asociadoId}` : (m.referencia || 'Cobro');
  return `${emoji} ${fmtFecha(m.fecha)}  ${label}\n     *+${fmtMoneda(m.monto)}*`;
}

function fmtMovProveedor(m) {
  if (m.tipo === 'PAGO') {
    return `🟢 ${fmtFecha(m.fecha)}  Pago #${m.asociadoId || '-'}\n     *+${fmtMoneda(m.monto)}*`;
  }
  // COSTO = deuda generada
  const concepto = m.concepto || m.obraNombre || 'Costo';
  return `🔴 ${fmtFecha(m.fecha)}  ${concepto}\n     *${fmtMoneda(m.monto)}*`;
}

// ── CC OBRA ──────────────────────────────────────────────────

function fmtCCObra(data, obraNombre) {
  if (!data) return 'Sin datos de cuenta corriente.';

  const lineas = [
    SEP,
    `🏗️ *${obraNombre || data.obraNombre || '-'}*`,
    `👤 ${data.clienteNombre || '-'}`,
    SEP,
    ``,
    `🔵 Presupuestado`,
    `     *${fmtMoneda(data.presupuestado)}*`,
    ``,
    `⚙️ Costos`,
    `     *${fmtMoneda(data.costoTotal)}*`,
    ``,
    `🟢 Cobrado`,
    `     *${fmtMoneda(data.pagosRecibidos)}*`,
    ``,
    `🔴 Saldo pendiente`,
    `     *${fmtMoneda(data.saldoPendiente)}*`,
  ];

  const movs = (data.movimientos || []).filter(m => m.tipo !== 'COSTO').slice(0, 5);
  if (movs.length > 0) {
    lineas.push(``, SEP, `📋 *Últimos cobros*`, ``);
    movs.forEach(m => lineas.push(fmtMovObra(m), ``));
  }

  return lineas.join('\n');
}

// ── CC CLIENTE ───────────────────────────────────────────────

function fmtCCCliente(data, clienteNombre) {
  if (!data) return 'Sin datos de cuenta corriente.';

  const lineas = [
    SEP,
    `👤 *${clienteNombre || data.clienteNombre || '-'}*`,
    SEP,
    ``,
    `⚙️ Total costos`,
    `     *${fmtMoneda(data.totalCostos)}*`,
    ``,
    `🟢 Total cobrado`,
    `     *${fmtMoneda(data.totalCobros)}*`,
    ``,
    `🔴 Saldo`,
    `     *${fmtMoneda(data.saldoFinal)}*`,
  ];

  if (data.movimientos && data.movimientos.length > 0) {
    lineas.push(``, SEP, `📋 *Últimos movimientos*`, ``);
    data.movimientos.slice(0, 5).forEach(m => {
      const esDeuda = m.tipo === 'COSTO' || m.tipo === 'DEUDA';
      const emoji = esDeuda ? '🔴' : '🟢';
      const label = m.obraNombre || m.tipo || '-';
      lineas.push(`${emoji} ${fmtFecha(m.fecha)}  ${label}\n     *${fmtMoneda(m.monto)}*`, ``);
    });
  }

  return lineas.join('\n');
}

// ── CC PROVEEDOR ─────────────────────────────────────────────

function fmtCCProveedor(data, proveedorNombre) {
  if (!data) return 'Sin datos de cuenta corriente.';

  const lineas = [
    SEP,
    `🔧 *${proveedorNombre || data.proveedorNombre || '-'}*`,
    SEP,
    ``,
    `🔴 Total costos`,
    `     *${fmtMoneda(data.costos)}*`,
    ``,
    `🟢 Total pagado`,
    `     *${fmtMoneda(data.pagos)}*`,
    ``,
    `⏳ Saldo a pagar`,
    `     *${fmtMoneda(data.saldo)}*`,
  ];

  if (data.movimientos && data.movimientos.length > 0) {
    lineas.push(``, SEP, `📋 *Últimos movimientos*`, ``);
    data.movimientos.slice(0, 5).forEach(m => {
      lineas.push(fmtMovProveedor(m), ``);
    });
  }

  return lineas.join('\n');
}

// ── CC PROVEEDOR / OBRA ──────────────────────────────────────

function fmtCCProveedorPorObra(data, proveedorNombre, obra) {
  if (!data) return 'Sin datos de cuenta corriente.';

  const movsFiltrados = (data.movimientos || []).filter(m => m.obraId === obra.id);
  let costos = 0;
  let pagos = 0;
  movsFiltrados.forEach(m => {
    if (m.tipo === 'COSTO') costos += m.monto || 0;
    if (m.tipo === 'PAGO')  pagos  += m.monto || 0;
  });
  const saldo = Math.max(0, costos - pagos);

  const lineas = [
    SEP,
    `🔧 *${proveedorNombre}*`,
    `🏗️ ${obra.nombre}`,
    SEP,
    ``,
    `🔴 Costos en obra`,
    `     *${fmtMoneda(costos)}*`,
    ``,
    `🟢 Pagado`,
    `     *${fmtMoneda(pagos)}*`,
    ``,
    `⏳ Saldo`,
    `     *${fmtMoneda(saldo)}*`,
  ];

  const ultimos = movsFiltrados.slice(-5);
  if (ultimos.length > 0) {
    lineas.push(``, SEP, `📋 *Últimos movimientos*`, ``);
    ultimos.forEach(m => lineas.push(fmtMovProveedor(m), ``));
  }

  return lineas.join('\n');
}

// ── TAREAS ───────────────────────────────────────────────────

function fmtTareasProximas(data, dias) {
  const obras   = data.tareasObras   || [];
  const agendas = data.tareasAgendas || [];

  if (obras.length === 0 && agendas.length === 0) {
    return `✅ Sin tareas por vencer en los próximos ${dias} días.`;
  }

  const lineas = [
    SEP,
    `⚠️ *Tareas — próximos ${dias} días*`,
    SEP,
    ``,
  ];

  if (obras.length > 0) {
    lineas.push(`📋 *Tareas de obras (${obras.length})*`, ``);
    obras.forEach(t => {
      const vence = t.fecha_fin || t.fechaFin;
      const estado = t.estado_tarea || t.estadoTarea || '-';
      lineas.push(
        `🔸 *${t.nombre || t.titulo || '-'}*`,
        `     Vence: ${fmtFecha(vence)}   ${estado}`,
        ``
      );
    });
  }

  if (agendas.length > 0) {
    lineas.push(`📅 *Agenda (${agendas.length})*`, ``);
    agendas.forEach(t => {
      lineas.push(
        `🔸 *${t.titulo || '-'}*`,
        `     Vence: ${fmtFecha(t.fechaVencimiento)}   ${t.estado || '-'}`,
        t.obraNombre ? `     🏗️ ${t.obraNombre}` : null,
        ``
      );
    });
  }

  return lineas.filter(l => l !== null).join('\n');
}

module.exports = { fmtCCObra, fmtCCCliente, fmtCCProveedor, fmtCCProveedorPorObra, fmtTareasProximas };
