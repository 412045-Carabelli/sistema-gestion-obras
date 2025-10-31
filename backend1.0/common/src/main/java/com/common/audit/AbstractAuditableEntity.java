package com.common.audit;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.io.Serial;
import java.io.Serializable;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Base abstract entity that centralises the auditing attributes shared across the
 * domain model. All auditable entities should extend this class in order to
 * automatically persist creation and modification metadata.
 */
@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AbstractAuditableEntity implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** Timestamp that captures when the entity was first created. */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /** Timestamp that captures the last time the entity was modified. */
    @LastModifiedDate
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    /** Identifier of the actor that created the entity. */
    @CreatedBy
    @Column(name = "created_by", length = 100)
    private String createdBy;

    /** Identifier of the actor that performed the last modification. */
    @LastModifiedBy
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
