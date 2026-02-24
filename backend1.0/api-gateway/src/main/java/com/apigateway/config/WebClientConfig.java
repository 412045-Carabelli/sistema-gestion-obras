package com.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;

@Configuration
public class WebClientConfig {
    private static final String USER_HEADER = "X-User-Name";
    private static final String CTX_USER_HEADER = "ctx_user_header";

    @Bean
    public WebFilter userHeaderFilter() {
        return (exchange, chain) -> {
            String userHeader = exchange.getRequest().getHeaders().getFirst(USER_HEADER);
            if (userHeader == null || userHeader.isBlank()) {
                return chain.filter(exchange);
            }
            return chain.filter(exchange)
                    .contextWrite(ctx -> ctx.put(CTX_USER_HEADER, userHeader));
        };
    }

    @Bean
    public WebClient.Builder webClientBuilder() {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(20 * 1024 * 1024))
                .build();
        return WebClient.builder()
                .exchangeStrategies(strategies)
                .filter((request, next) ->
                        Mono.deferContextual(ctx -> next.exchange(withUserHeader(request, ctx)))
                );
    }

    private ClientRequest withUserHeader(ClientRequest request, ContextView ctx) {
        if (!ctx.hasKey(CTX_USER_HEADER)) {
            return request;
        }
        String value = ctx.get(CTX_USER_HEADER);
        return ClientRequest.from(request)
                .header(USER_HEADER, value)
                .build();
    }
}
