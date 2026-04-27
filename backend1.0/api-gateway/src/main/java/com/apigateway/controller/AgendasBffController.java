package com.apigateway.controller;

// NOTA: Este controlador está deshabilitado porque el Spring Cloud Gateway
// está reenviando /bff/agendas/** a http://agendas-service:8085
// Si necesitas usar este controlador, comenta la ruta del gateway en application-prod.properties
public class AgendasBffController {
    // Controlador vacío - no se utiliza
}
