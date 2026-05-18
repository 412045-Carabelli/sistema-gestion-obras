package com.auth.repository;

import com.auth.entity.AuditAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditAuthRepository extends JpaRepository<AuditAuth, Long> {
}
