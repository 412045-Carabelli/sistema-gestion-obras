package com.apigateway.controller;

import com.apigateway.testutil.StubExchangeFunction;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ReportesBffControllerTest {

    @Test
    void reportes_ok_y_validaciones() {
        String baseUrl = "http://reportes";
        StubExchangeFunction stub = new StubExchangeFunction();
        stub.stub(HttpMethod.POST, baseUrl + "/financieros/ingresos-egresos", HttpStatus.OK, Map.of("total", 1));
        stub.stub(HttpMethod.GET, baseUrl + "/financieros/estado-obra/1", HttpStatus.OK, Map.of("obraId", 1));
        stub.stub(HttpMethod.POST, baseUrl + "/financieros/flujo-caja", HttpStatus.OK, Map.of("total", 2));
        stub.stub(HttpMethod.POST, baseUrl + "/financieros/pendientes", HttpStatus.OK, Map.of("total", 3));
        stub.stub(HttpMethod.GET, baseUrl + "/cuenta-corriente/obra/1", HttpStatus.OK, Map.of("obraId", 1));
        stub.stub(HttpMethod.GET, baseUrl + "/cuenta-corriente/proveedor/10", HttpStatus.OK, Map.of("proveedorId", 10));
        stub.stub(HttpMethod.GET, baseUrl + "/comisiones/obra/1", HttpStatus.OK, Map.of("obraId", 1));
        stub.stub(HttpMethod.GET, baseUrl + "/comisiones/general", HttpStatus.OK, Map.of("total", 4));
        stub.stub(HttpMethod.POST, baseUrl + "/operativos/estado-obras", HttpStatus.OK, Map.of("total", 5));
        stub.stub(HttpMethod.POST, baseUrl + "/operativos/avance-tareas", HttpStatus.OK, Map.of("total", 6));
        stub.stub(HttpMethod.POST, baseUrl + "/operativos/costos-categoria", HttpStatus.OK, Map.of("total", 7));
        stub.stub(HttpMethod.GET, baseUrl + "/generales/resumen", HttpStatus.OK, Map.of("total", 8));
        stub.stub(HttpMethod.POST, baseUrl + "/generales/ranking-clientes", HttpStatus.OK, Map.of("total", 9));
        stub.stub(HttpMethod.POST, baseUrl + "/generales/ranking-proveedores", HttpStatus.OK, Map.of("total", 10));
        stub.stub(HttpMethod.GET, baseUrl + "/obras/notas", HttpStatus.OK, List.of(Map.of("id", 1)));
        stub.stub(HttpMethod.GET, baseUrl + "/obras/1/notas", HttpStatus.OK, Map.of("id", 1));

        ReportesBffController controller = new ReportesBffController(WebClient.builder().exchangeFunction(stub));
        ReflectionTestUtils.setField(controller, "reportesServiceUrl", baseUrl);

        ResponseEntity<Object> ingresos = controller.ingresosEgresos(Map.of()).block();
        ResponseEntity<Object> estado = controller.estadoFinanciero(1L).block();
        ResponseEntity<Object> flujo = controller.flujoCaja(Map.of()).block();
        ResponseEntity<Object> pendientes = controller.pendientes(Map.of()).block();
        ResponseEntity<Object> ctaObra = controller.cuentaCorrienteObra(Map.of("obraId", 1)).block();
        ResponseEntity<Object> ctaProv = controller.cuentaCorrienteProveedor(Map.of("proveedorId", 10)).block();
        ResponseEntity<Object> comisionesObra = controller.comisiones(Map.of("obraId", 1)).block();
        ResponseEntity<Object> comisionesGen = controller.comisiones(Map.of()).block();
        ResponseEntity<Object> estadoObras = controller.estadoObras(Map.of()).block();
        ResponseEntity<Object> avance = controller.avanceTareas(Map.of()).block();
        ResponseEntity<Object> costos = controller.costosPorCategoria(Map.of()).block();
        ResponseEntity<Object> resumen = controller.resumenGeneral().block();
        ResponseEntity<Object> rankingClientes = controller.rankingClientes(Map.of()).block();
        ResponseEntity<Object> rankingProveedores = controller.rankingProveedores(Map.of()).block();
        ResponseEntity<List<Object>> notas = controller.notasGenerales().block();
        ResponseEntity<Object> nota = controller.notasPorObra(1L).block();

        assertThat(ingresos.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(estado.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(flujo.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pendientes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(ctaObra.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(ctaProv.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(comisionesObra.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(comisionesGen.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(estadoObras.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(avance.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(costos.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resumen.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rankingClientes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rankingProveedores.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(notas.getBody()).hasSize(1);
        assertThat(nota.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Object> badObra = controller.cuentaCorrienteObra(Map.of()).block();
        ResponseEntity<Object> badProv = controller.cuentaCorrienteProveedor(Map.of()).block();

        assertThat(badObra.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(badProv.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
