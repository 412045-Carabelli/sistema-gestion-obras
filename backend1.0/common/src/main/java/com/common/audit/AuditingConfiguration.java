package com.common.audit;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Auto-configuration that enables Spring Data JPA auditing across every
 * microservice importing the common module.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class AuditingConfiguration {

    /**
     * Provides the default auditor resolution strategy.
     *
     * @return the {@link AuditorAware} implementation used by Spring Data
     */
    @Bean
    public AuditorAware<String> auditorAware() {
        return new DefaultAuditorAware();
    }
}
