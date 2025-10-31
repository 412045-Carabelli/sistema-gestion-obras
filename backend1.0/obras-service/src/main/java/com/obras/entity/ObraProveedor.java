package com.obras.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name="obra_proveedor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ObraProveedor.PK.class)
public class ObraProveedor {
    @Id
    private Long idObra;
    @Id private Long idProveedor;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class PK implements Serializable {
        private Long idObra; private Long idProveedor;
    }
}
