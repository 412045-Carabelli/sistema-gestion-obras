package com.auth.repository;

import com.auth.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByOrganizacionIdAndActivoTrue(Long organizacionId);

    Optional<PushSubscription> findByUsuarioIdAndEndpoint(Long usuarioId, String endpoint);

    List<PushSubscription> findByUsuarioIdAndActivoTrue(Long usuarioId);
}
