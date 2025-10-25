import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClientesService } from '../../../services/clientes/clientes.service';
import {ObrasService} from '../../../services/obras/obras.service';
import {EstadoObraService} from '../../../services/estado-obra/estado-obra.service';

export const obrasListResolver: ResolveFn<any> = () => {
  const obrasService = inject(ObrasService);
  const clientesService = inject(ClientesService);
  const estadoObraService = inject(EstadoObraService);

  return forkJoin({
    obras: obrasService.getObras(),
    clientes: clientesService.getClientes(),
    estados: estadoObraService.getEstados()
  });
};
