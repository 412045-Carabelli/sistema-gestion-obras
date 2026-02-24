package com.documentos.audit;

import lombok.RequiredArgsConstructor;
import org.reactivestreams.Publisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class AuditLogWebFilter implements WebFilter {

    private static final String USER_HEADER = "X-User-Name";

    private final AuditLogService auditLogService;

    @Value("${spring.application.name:documentos-service}")
    private String moduleName;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String uri = exchange.getRequest().getURI().getPath();
        if (!uri.startsWith("/api") || !isAuditableMethod(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        AtomicReference<String> bodyRef = new AtomicReference<>("");
        ServerHttpResponse originalResponse = exchange.getResponse();
        ServerHttpResponseDecorator decorated = new ServerHttpResponseDecorator(originalResponse) {
            @Override
            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                if (body instanceof Flux<? extends DataBuffer> flux) {
                    Charset charset = getCharsetOrDefault();
                    Flux<DataBuffer> mapped = flux.map(dataBuffer -> {
                        byte[] content = new byte[dataBuffer.readableByteCount()];
                        dataBuffer.read(content);
                        DataBufferUtils.release(dataBuffer);
                        String chunk = new String(content, charset);
                        bodyRef.updateAndGet(prev -> prev + chunk);
                        return bufferFactory().wrap(content);
                    });
                    return super.writeWith(mapped);
                }
                return super.writeWith(body);
            }
        };

        return chain.filter(exchange.mutate().response(decorated).build())
                .doFinally(signalType -> saveAudit(exchange, decorated, bodyRef.get()));
    }

    private void saveAudit(ServerWebExchange exchange, ServerHttpResponse response, String responseBody) {
        try {
            String endpoint = exchange.getRequest().getURI().getPath();
            String tableName = resolveTableName(endpoint);
            String ip = resolveClientIp(exchange);
            String userHeader = trimToNull(exchange.getRequest().getHeaders().getFirst(USER_HEADER));
            String userName = userHeader != null ? userHeader : ip;

            Integer status = response.getStatusCode() != null ? response.getStatusCode().value() : 200;
            String body = StringUtils.hasText(responseBody) ? responseBody : null;

            String methodValue = exchange.getRequest().getMethod() != null
                    ? exchange.getRequest().getMethod().name()
                    : null;

            AuditLog log = AuditLog.builder()
                    .modulo(moduleName)
                    .tipoRequest(methodValue)
                    .endpoint(endpoint)
                    .tablaModificada(tableName)
                    .codigoRespuesta(status)
                    .respuesta(body)
                    .fechaHora(Instant.now())
                    .usuario(userName)
                    .ip(ip)
                    .build();

            auditLogService.save(log);
        } catch (Exception ignored) {
        }
    }

    private String resolveTableName(String uri) {
        String path = uri;
        if (path.startsWith("/api/")) {
            path = path.substring(5);
        } else if (path.startsWith("/")) {
            path = path.substring(1);
        }
        if (path.isEmpty()) {
            return null;
        }
        int slashIndex = path.indexOf('/');
        return slashIndex >= 0 ? path.substring(0, slashIndex) : path;
    }

    private String resolveClientIp(ServerWebExchange exchange) {
        String forwarded = trimToNull(exchange.getRequest().getHeaders().getFirst("X-Forwarded-For"));
        if (forwarded != null) {
            int comma = forwarded.indexOf(',');
            return comma >= 0 ? forwarded.substring(0, comma).trim() : forwarded.trim();
        }
        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        return remote != null ? remote.getAddress().getHostAddress() : "unknown";
    }

    private Charset getCharsetOrDefault() {
        return StandardCharsets.UTF_8;
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private boolean isAuditableMethod(HttpMethod method) {
        if (method == null) {
            return false;
        }
        return HttpMethod.POST.equals(method)
                || HttpMethod.PUT.equals(method)
                || HttpMethod.PATCH.equals(method)
                || HttpMethod.DELETE.equals(method);
    }
}
