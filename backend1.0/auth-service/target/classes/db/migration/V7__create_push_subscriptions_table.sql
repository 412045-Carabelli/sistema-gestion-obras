CREATE TABLE push_subscriptions (
  id BIGINT NOT NULL PRIMARY KEY IDENTITY(1,1),
  usuario_id BIGINT NOT NULL,
  organizacion_id BIGINT NOT NULL,
  endpoint NVARCHAR(MAX) NOT NULL,
  p256dh NVARCHAR(500) NOT NULL,
  auth_key NVARCHAR(500) NOT NULL,
  activo BIT NOT NULL DEFAULT 1,
  creado_en DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_push_sub_org ON push_subscriptions(organizacion_id, activo);
CREATE INDEX idx_push_sub_usuario ON push_subscriptions(usuario_id);
