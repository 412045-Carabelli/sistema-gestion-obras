package com.auth.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limit en /auth/login: máx 5 intentos por minuto por IP.
 * Ventana deslizante: descarta timestamps > 60 segundos.
 */
@Component
@Slf4j
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/auth/login";
    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final long WINDOW_MS = 60_000L;

    private final Map<String, Deque<Long>> intentosPorIp = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !LOGIN_PATH.equals(request.getRequestURI())
            || !"POST".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String ip = obtenerIp(request);
        long ahora = System.currentTimeMillis();

        Deque<Long> timestamps = intentosPorIp.computeIfAbsent(ip, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // Limpiar intentos fuera de la ventana
            while (!timestamps.isEmpty() && ahora - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
                long restante = WINDOW_MS - (ahora - timestamps.peekFirst());
                log.warn("Rate limit excedido para IP={}, intentos={}, restante={}ms", ip, timestamps.size(), restante);
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setHeader("Retry-After", String.valueOf(restante / 1000 + 1));
                response.getWriter().write(
                    "{\"message\":\"Demasiados intentos de login. Intentá de nuevo en " +
                    (restante / 1000 + 1) + " segundos.\",\"status\":429}"
                );
                return;
            }

            timestamps.addLast(ahora);
        }

        chain.doFilter(request, response);
    }

    private String obtenerIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String xri = request.getHeader("X-Real-IP");
        if (xri != null && !xri.isBlank()) return xri;
        return request.getRemoteAddr();
    }
}
