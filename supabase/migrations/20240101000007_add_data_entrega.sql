-- Adicionar coluna data_entrega na tabela solicitacoes
ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS data_entrega DATE;

-- Criar índice para melhor performance nas consultas por data de entrega
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data_entrega ON solicitacoes(data_entrega);

-- Atualizar comentários da tabela
COMMENT ON COLUMN solicitacoes.data_entrega IS 'Data desejada para entrega da solicitação';