package com.documentos.strategy;

import com.documentos.enums.Producto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class DocumentoDestinoStrategyResolver {

  private final Map<Producto, DocumentoDestinoStrategy> strategiesPorProducto;

  public DocumentoDestinoStrategyResolver(List<DocumentoDestinoStrategy> strategies) {
    this.strategiesPorProducto = strategies.stream()
        .collect(Collectors.toMap(DocumentoDestinoStrategy::producto, Function.identity()));
  }

  public DocumentoDestinoStrategy resolver(Producto producto) {
    DocumentoDestinoStrategy strategy = strategiesPorProducto.get(producto);
    if (strategy == null) {
      throw new IllegalStateException("Sin estrategia de almacenamiento para producto: " + producto);
    }
    return strategy;
  }
}
