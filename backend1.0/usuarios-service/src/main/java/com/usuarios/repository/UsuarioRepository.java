package com.usuarios.repository;

import com.usuarios.entity.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository abstraction for persisting {@link Usuario} entities.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Fetches a user by email.
     *
     * @param email unique email identifier
     * @return optional user entity
     */
    Optional<Usuario> findByEmail(String email);
}
