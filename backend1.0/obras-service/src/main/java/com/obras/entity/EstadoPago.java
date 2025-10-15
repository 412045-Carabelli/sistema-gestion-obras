package com.obras.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="estado_pago")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EstadoPago {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY) private Long id;
    @Column(unique=true, nullable=false) private String estado; // p.ej. pendiente|pagado|vencido
}

