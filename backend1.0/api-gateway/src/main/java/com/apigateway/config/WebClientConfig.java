package com.apigateway.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;
import reactor.util.context.ContextView;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {
    private static final String USER_HEADER = "X-User-Name";
    private static final String CTX_USER_HEADER = "ctx_user_header";

    @Value("${app.webclient.connect-timeout-ms:5000}")
    private int connectTimeoutMs;

    @Value("${app.webclient.response-timeout-ms:10000}")
    private int responseTimeoutMs;

    @Value("${app.webclient.read-timeout-ms:10000}")
    private int readTimeoutMs;

    @Value("${app.webclient.write-timeout-ms:10000}")
    private int writeTimeoutMs;

    @Value("${app.webclient.max-connections:200}")
    private int maxConnections;

    @Value("${app.webclient.pending-acquire-timeout-ms:5000}")
    private int pendingAcquireTimeoutMs;

    @Value("${app.webclient.max-idle-time-ms:20000}")
    private int maxIdleTimeMs;

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

        ConnectionProvider provider = ConnectionProvider.builder("gateway-pool")
                .maxConnections(maxConnections)
                .pendingAcquireTimeout(Duration.ofMillis(pendingAcquireTimeoutMs))
                .maxIdleTime(Duration.ofMillis(maxIdleTimeMs))
                .build();

        HttpClient httpClient = HttpClient.create(provider)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeoutMs)
                .responseTimeout(Duration.ofMillis(responseTimeoutMs))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(readTimeoutMs, TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(writeTimeoutMs, TimeUnit.MILLISECONDS)));

        return WebClient.builder()
                .exchangeStrategies(strategies)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
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
