package com.transacciones.service;

import com.transacciones.dto.ObraResumenDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ObraCostoClientTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ObraCostoClient client;

    @Test
    void obtener_obra_null_id_retorna_null() {
        assertNull(client.obtenerObra(null));
    }

    @Test
    void obtener_obra_ok() {
        ReflectionTestUtils.setField(client, "obrasServiceUrl", "http://obras");
        ObraResumenDto dto = new ObraResumenDto();
        dto.setId(1L);
        when(restTemplate.getForObject("http://obras/1", ObraResumenDto.class)).thenReturn(dto);

        ObraResumenDto result = client.obtenerObra(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }
}
