package com.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(20 * 1024 * 1024))
                .build();
        return WebClient.builder()
                .exchangeStrategies(strategies)
                .filter(organizacionIdPropagationFilter());
    }

    private ExchangeFilterFunction organizacionIdPropagationFilter() {
        return (request, next) -> Mono.deferContextual(ctx -> {
            String orgId = ctx.getOrDefault(OrganizacionPropagationFilter.ORGANIZACION_ID_KEY, null);
            if (orgId != null) {
                ClientRequest enriched = ClientRequest.from(request)
                        .header(OrganizacionPropagationFilter.ORGANIZACION_ID_KEY, orgId)
                        .build();
                return next.exchange(enriched);
            }
            return next.exchange(request);
        });
    }
}
