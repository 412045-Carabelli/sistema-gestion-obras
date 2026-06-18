package com.apigateway.config;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
public class OrganizacionPropagationFilter implements WebFilter {

    public static final String ORGANIZACION_ID_KEY = "X-Organizacion-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String orgId = exchange.getRequest().getHeaders().getFirst(ORGANIZACION_ID_KEY);
        if (orgId != null && !orgId.isBlank()) {
            return chain.filter(exchange)
                    .contextWrite(ctx -> ctx.put(ORGANIZACION_ID_KEY, orgId));
        }
        return chain.filter(exchange);
    }
}
