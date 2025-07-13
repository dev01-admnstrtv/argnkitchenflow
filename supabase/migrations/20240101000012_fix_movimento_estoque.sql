-- Adicionar colunas ausentes na tabela movimento_estoque

-- Adicionar coluna motivo
ALTER TABLE movimento_estoque 
ADD COLUMN IF NOT EXISTS motivo TEXT;

-- Adicionar outras colunas que podem estar sendo usadas
ALTER TABLE movimento_estoque 
ADD COLUMN IF NOT EXISTS tipo TEXT;

ALTER TABLE movimento_estoque 
ADD COLUMN IF NOT EXISTS referencia_id UUID;

ALTER TABLE movimento_estoque 
ADD COLUMN IF NOT EXISTS referencia_tipo TEXT;

ALTER TABLE movimento_estoque 
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_movimento_estoque_referencia_id 
ON movimento_estoque(referencia_id);

CREATE INDEX IF NOT EXISTS idx_movimento_estoque_referencia_tipo 
ON movimento_estoque(referencia_tipo);

CREATE INDEX IF NOT EXISTS idx_movimento_estoque_usuario_id 
ON movimento_estoque(usuario_id);

-- Comentários explicativos
COMMENT ON COLUMN movimento_estoque.motivo IS 'Motivo ou descrição da movimentação de estoque';
COMMENT ON COLUMN movimento_estoque.tipo IS 'Tipo simplificado da movimentação (entrada/saida)';
COMMENT ON COLUMN movimento_estoque.referencia_id IS 'ID da entidade que originou a movimentação (solicitação, inventário, etc.)';
COMMENT ON COLUMN movimento_estoque.referencia_tipo IS 'Tipo da entidade que originou a movimentação';
COMMENT ON COLUMN movimento_estoque.usuario_id IS 'Usuário responsável pela movimentação';