package com.obras.audit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class AuditLogFilter extends OncePerRequestFilter {

    private static final String USER_HEADER = "X-User-Name";

    private final AuditLogService auditLogService;

    @Value("${spring.application.name:obras-service}")
    private String moduleName;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (!uri.startsWith("/api") || !isAuditableMethod(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
        try {
            filterChain.doFilter(request, responseWrapper);
        } finally {
            try {
                AuditLog log = buildAuditLog(request, responseWrapper);
                auditLogService.save(log);
            } catch (Exception ignored) {
                // Evita romper el flujo por fallos de auditoria
            }
            responseWrapper.copyBodyToResponse();
        }
    }

    private AuditLog buildAuditLog(HttpServletRequest request, ContentCachingResponseWrapper response) {
        String endpoint = request.getRequestURI();
        String tableName = resolveTableName(endpoint);
        String ip = resolveClientIp(request);

        String userHeader = trimToNull(request.getHeader(USER_HEADER));
        String userName = userHeader != null ? userHeader : ip;

        return AuditLog.builder()
                .modulo(moduleName)
                .tipoRequest(request.getMethod())
                .endpoint(endpoint)
                .tablaModificada(tableName)
                .codigoRespuesta(response.getStatus())
                .respuesta(readResponseBody(response))
                .fechaHora(Instant.now())
                .usuario(userName)
                .ip(ip)
                .build();
    }

    private boolean isAuditableMethod(String method) {
        if (method == null) {
            return false;
        }
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
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

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = trimToNull(request.getHeader("X-Forwarded-For"));
        if (forwarded != null) {
            int comma = forwarded.indexOf(',');
            return comma >= 0 ? forwarded.substring(0, comma).trim() : forwarded.trim();
        }
        return request.getRemoteAddr();
    }

    private String readResponseBody(ContentCachingResponseWrapper response) {
        byte[] content = response.getContentAsByteArray();
        if (content == null || content.length == 0) {
            return null;
        }
        String encoding = response.getCharacterEncoding();
        if (!StringUtils.hasText(encoding)) {
            encoding = StandardCharsets.UTF_8.name();
        }
        return new String(content, java.nio.charset.Charset.forName(encoding));
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
