package com.common.audit;

import java.util.Optional;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Default {@link AuditorAware} implementation that resolves the current auditor
 * from the Spring Security context. When no authenticated user is available the
 * auditor defaults to the {@code system} technical account.
 */
public class DefaultAuditorAware implements AuditorAware<String> {

    /**
     * Resolves the identifier of the currently authenticated principal.
     *
     * @return the identifier of the authenticated user or {@code system} when unauthenticated
     */
    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.of("system");
        }
        return Optional.ofNullable(authentication.getName()).filter(name -> !name.isBlank()).or(() -> Optional.of("system"));
    }
}
