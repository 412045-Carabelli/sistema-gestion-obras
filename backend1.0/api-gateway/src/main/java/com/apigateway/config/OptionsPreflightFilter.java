package com.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;

@Configuration
public class OptionsPreflightFilter {

    @Bean
    public WebFilter corsResponseHeaderFilter() {
        return (exchange, chain) -> {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequest().getMethod().name())) {
                var response = exchange.getResponse();
                response.setStatusCode(HttpStatus.OK);
                response.getHeaders().add("Access-Control-Allow-Origin", "https://sistema-gestion-obras.netlify.app");
                response.getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                response.getHeaders().add("Access-Control-Allow-Headers", "*");
                response.getHeaders().add("Access-Control-Allow-Credentials", "true");
                return response.setComplete();
            }
            return chain.filter(exchange);
        };
    }
}
