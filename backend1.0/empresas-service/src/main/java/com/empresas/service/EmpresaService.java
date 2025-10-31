package com.empresas.service;

import com.empresas.dto.EmpresaRequest;
import com.empresas.dto.EmpresaResponse;
import java.util.List;

/**
 * Contract that encapsulates the operations available for companies.
 */
public interface EmpresaService {

    /**
     * Lists all companies in the catalog.
     *
     * @return list of responses
     */
    List<EmpresaResponse> findAll();

    /**
     * Finds companies belonging to a user.
     *
     * @param usuarioId user identifier
     * @return list of responses
     */
    List<EmpresaResponse> findByUsuario(Long usuarioId);

    /**
     * Retrieves the details of a company by id.
     *
     * @param id identifier
     * @return response payload
     */
    EmpresaResponse findById(Long id);

    /**
     * Creates a new company.
     *
     * @param request payload
     * @return persisted response
     */
    EmpresaResponse create(EmpresaRequest request);

    /**
     * Updates a company.
     *
     * @param id identifier
     * @param request payload
     * @return updated response
     */
    EmpresaResponse update(Long id, EmpresaRequest request);

    /**
     * Deletes a company by id.
     *
     * @param id identifier
     */
    void delete(Long id);
}
