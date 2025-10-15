package com.transacciones.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tipo_transaccion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoTransaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false)
    private String nombre; // cobro | pago
}
