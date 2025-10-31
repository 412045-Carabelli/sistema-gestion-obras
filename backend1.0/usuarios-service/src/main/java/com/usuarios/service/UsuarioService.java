package com.usuarios.service;

import com.usuarios.dto.UsuarioRequest;
import com.usuarios.dto.UsuarioResponse;
import java.util.List;

/**
 * Contract for the user management operations.
 */
public interface UsuarioService {

    /**
     * Retrieves all stored users.
     *
     * @return list of {@link UsuarioResponse}
     */
    List<UsuarioResponse> findAll();

    /**
     * Looks up a specific user.
     *
     * @param id identifier to look for
     * @return user response payload
     */
    UsuarioResponse findById(Long id);

    /**
     * Persists a new user.
     *
     * @param request data to persist
     * @return the persisted user payload
     */
    UsuarioResponse create(UsuarioRequest request);

    /**
     * Updates an existing user.
     *
     * @param id      identifier of the entity to update
     * @param request new data
     * @return updated user response
     */
    UsuarioResponse update(Long id, UsuarioRequest request);

    /**
     * Removes a user from the store.
     *
     * @param id identifier to delete
     */
    void delete(Long id);
}
