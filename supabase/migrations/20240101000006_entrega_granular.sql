-- Migration para controle granular de entrega

-- Adicionar novos status para solicitações incluindo entrega
DO $$ 
BEGIN
    -- Verificar se a constraint já existe e remover
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%status%' AND table_name = 'solicitacoes') THEN
        ALTER TABLE solicitacoes DROP CONSTRAINT IF EXISTS solicitacoes_status_check;
    END IF;
    
    -- Adicionar nova constraint com status de entrega
    ALTER TABLE solicitacoes ADD CONSTRAINT solicitacoes_status_check 
    CHECK (status IN ('pendente', 'separando', 'separado', 'em_entrega', 'entregue', 'parcialmente_entregue', 'rejeitada', 'confirmada'));
END $$;

-- Adicionar campos de controle de entrega por item
ALTER TABLE itens_solicitacao 
ADD COLUMN IF NOT EXISTS status_entrega VARCHAR(20) DEFAULT 'aguardando' 
CHECK (status_entrega IN ('aguardando', 'em_entrega', 'entregue', 'nao_entregue'));

ALTER TABLE itens_solicitacao 
ADD COLUMN IF NOT EXISTS entregue_por_usuario_id UUID REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS iniciado_entrega_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS concluido_entrega_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observacoes_entrega TEXT;

-- Criar índices para otimizar consultas de entrega
CREATE INDEX IF NOT EXISTS idx_itens_solicitacao_status_entrega 
ON itens_solicitacao(status_entrega);

CREATE INDEX IF NOT EXISTS idx_itens_solicitacao_entregue_por 
ON itens_solicitacao(entregue_por_usuario_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_status_entrega 
ON solicitacoes(status) WHERE status IN ('separado', 'em_entrega', 'entregue', 'parcialmente_entregue');

-- Trigger para atualizar timestamps de entrega
CREATE OR REPLACE FUNCTION atualizar_timestamps_entrega()
RETURNS TRIGGER AS $$
BEGIN
    -- Se status mudou para 'em_entrega', marcar início
    IF (OLD.status_entrega IS NULL OR OLD.status_entrega != 'em_entrega') AND NEW.status_entrega = 'em_entrega' THEN
        NEW.iniciado_entrega_em = NOW();
    END IF;
    
    -- Se status mudou para 'entregue' ou 'nao_entregue', marcar conclusão
    IF (OLD.status_entrega IS NULL OR OLD.status_entrega NOT IN ('entregue', 'nao_entregue')) 
       AND NEW.status_entrega IN ('entregue', 'nao_entregue') THEN
        NEW.concluido_entrega_em = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para timestamps de entrega
DROP TRIGGER IF EXISTS trigger_timestamps_entrega ON itens_solicitacao;
CREATE TRIGGER trigger_timestamps_entrega
    BEFORE UPDATE ON itens_solicitacao
    FOR EACH ROW
    WHEN (OLD.status_entrega IS DISTINCT FROM NEW.status_entrega)
    EXECUTE FUNCTION atualizar_timestamps_entrega();

-- Trigger para atualizar status da solicitação baseado no progresso da entrega
CREATE OR REPLACE FUNCTION atualizar_status_solicitacao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    total_itens INTEGER;
    itens_entregues INTEGER;
    itens_nao_entregues INTEGER;
    itens_aguardando INTEGER;
    todos_separados BOOLEAN;
BEGIN
    -- Verificar se todos os itens foram separados primeiro
    SELECT COUNT(*) = COUNT(CASE WHEN status_separacao = 'separado' THEN 1 END)
    INTO todos_separados
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id;
    
    -- Só atualizar status de entrega se todos estiverem separados
    IF NOT todos_separados THEN
        RETURN NEW;
    END IF;
    
    -- Contar itens da solicitação
    SELECT COUNT(*) INTO total_itens
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id;
    
    -- Contar itens entregues
    SELECT COUNT(*) INTO itens_entregues
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id 
    AND status_entrega = 'entregue';
    
    -- Contar itens não entregues
    SELECT COUNT(*) INTO itens_nao_entregues
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id 
    AND status_entrega = 'nao_entregue';
    
    -- Contar itens aguardando entrega
    SELECT COUNT(*) INTO itens_aguardando
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id 
    AND status_entrega = 'aguardando';
    
    -- Atualizar status da solicitação baseado no progresso da entrega
    IF itens_entregues = total_itens THEN
        -- Todos os itens foram entregues
        UPDATE solicitacoes 
        SET status = 'entregue'
        WHERE id = NEW.solicitacao_id;
    ELSIF itens_aguardando = 0 AND (itens_entregues + itens_nao_entregues) = total_itens THEN
        -- Entrega finalizada, mas alguns itens não foram entregues
        UPDATE solicitacoes 
        SET status = 'parcialmente_entregue'
        WHERE id = NEW.solicitacao_id;
    ELSIF itens_aguardando < total_itens THEN
        -- Entrega em andamento
        UPDATE solicitacoes 
        SET status = 'em_entrega'
        WHERE id = NEW.solicitacao_id;
    ELSIF itens_aguardando = total_itens AND EXISTS (
        SELECT 1 FROM itens_solicitacao 
        WHERE solicitacao_id = NEW.solicitacao_id 
        AND status_separacao = 'separado'
    ) THEN
        -- Todos separados mas nenhum entregue ainda
        UPDATE solicitacoes 
        SET status = 'separado'
        WHERE id = NEW.solicitacao_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para atualizar status da solicitação na entrega
DROP TRIGGER IF EXISTS trigger_status_solicitacao_entrega ON itens_solicitacao;
CREATE TRIGGER trigger_status_solicitacao_entrega
    AFTER UPDATE ON itens_solicitacao
    FOR EACH ROW
    WHEN (OLD.status_entrega IS DISTINCT FROM NEW.status_entrega)
    EXECUTE FUNCTION atualizar_status_solicitacao_entrega();

-- Criar view para facilitar consultas do dashboard de entrega
CREATE OR REPLACE VIEW vw_entrega_dashboard AS
SELECT 
    s.id as solicitacao_id,
    s.created_at,
    s.prioridade,
    s.prioridade_calculada,
    s.status,
    s.observacoes,
    pd.nome as praca_destino,
    pd.tipo as tipo_praca,
    pd.responsavel as responsavel_praca,
    u.nome as solicitante,
    COUNT(i.id) as total_itens,
    COUNT(CASE WHEN i.status_entrega = 'entregue' THEN 1 END) as itens_entregues,
    COUNT(CASE WHEN i.status_entrega = 'nao_entregue' THEN 1 END) as itens_nao_entregues,
    COUNT(CASE WHEN i.status_entrega = 'aguardando' THEN 1 END) as itens_aguardando,
    COUNT(CASE WHEN i.status_entrega = 'em_entrega' THEN 1 END) as itens_em_entrega,
    MIN(i.iniciado_entrega_em) as iniciado_entrega_em,
    MAX(i.concluido_entrega_em) as concluido_entrega_em,
    ROUND(
        COALESCE(
            (COUNT(CASE WHEN i.status_entrega IN ('entregue', 'nao_entregue') THEN 1 END) * 100.0) / NULLIF(COUNT(i.id), 0),
            0
        ), 2
    ) as percentual_entregue,
    -- Calcular tempo desde separação
    EXTRACT(EPOCH FROM (NOW() - MAX(i.concluido_separacao_em))) / 60.0 as minutos_desde_separacao
FROM solicitacoes s
LEFT JOIN pracas_destino pd ON s.praca_destino_id = pd.id
LEFT JOIN usuarios u ON s.solicitante_id = u.id
LEFT JOIN itens_solicitacao i ON s.id = i.solicitacao_id
WHERE s.status IN ('separado', 'em_entrega', 'entregue', 'parcialmente_entregue')
GROUP BY s.id, s.created_at, s.prioridade, s.prioridade_calculada, s.status, s.observacoes, pd.nome, pd.tipo, pd.responsavel, u.nome
ORDER BY s.prioridade_calculada DESC, s.created_at ASC;

-- Criar view para detalhes de entrega de uma solicitação específica
CREATE OR REPLACE VIEW vw_entrega_detalhes AS
SELECT 
    i.id as item_id,
    i.solicitacao_id,
    i.produto_id,
    p.descricao as produto_descricao,
    p.grupo as produto_grupo,
    p.subgrupo as produto_subgrupo,
    i.quantidade_solicitada,
    i.quantidade_separada,
    i.status_separacao,
    i.status_entrega,
    i.observacoes as observacoes_item,
    i.observacoes_separacao,
    i.observacoes_entrega,
    i.iniciado_entrega_em,
    i.concluido_entrega_em,
    i.entregue_por_usuario_id,
    u.nome as entregue_por,
    -- Calcular tempo de entrega
    CASE 
        WHEN i.concluido_entrega_em IS NOT NULL AND i.iniciado_entrega_em IS NOT NULL THEN
            EXTRACT(EPOCH FROM (i.concluido_entrega_em - i.iniciado_entrega_em)) / 60.0
        ELSE NULL
    END as tempo_entrega_minutos
FROM itens_solicitacao i
LEFT JOIN produtos p ON i.produto_id = p.id
LEFT JOIN usuarios u ON i.entregue_por_usuario_id = u.id
WHERE i.status_separacao = 'separado' -- Só itens já separados
ORDER BY i.created_at ASC;

-- Atualizar solicitações existentes que estão "entregue" para "separado" se ainda não passaram pela entrega
UPDATE solicitacoes 
SET status = 'separado' 
WHERE status = 'entregue' 
AND NOT EXISTS (
    SELECT 1 FROM itens_solicitacao 
    WHERE solicitacao_id = solicitacoes.id 
    AND status_entrega IN ('entregue', 'nao_entregue')
);

-- Comentários explicativos
COMMENT ON COLUMN itens_solicitacao.status_entrega IS 'Status granular da entrega: aguardando, em_entrega, entregue, nao_entregue';
COMMENT ON COLUMN itens_solicitacao.iniciado_entrega_em IS 'Timestamp do início da entrega do item';
COMMENT ON COLUMN itens_solicitacao.concluido_entrega_em IS 'Timestamp da conclusão da entrega do item';
COMMENT ON COLUMN itens_solicitacao.entregue_por_usuario_id IS 'ID do usuário que entregou o item';
COMMENT ON COLUMN itens_solicitacao.observacoes_entrega IS 'Observações específicas do processo de entrega';
COMMENT ON VIEW vw_entrega_dashboard IS 'View para dashboard de entrega com estatísticas agregadas';
COMMENT ON VIEW vw_entrega_detalhes IS 'View para detalhes completos da entrega por item';

-- Função para verificar se solicitação está pronta para entrega
CREATE OR REPLACE FUNCTION solicitacao_pronta_para_entrega(solicitacao_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    todos_separados BOOLEAN;
BEGIN
    SELECT COUNT(*) = COUNT(CASE WHEN status_separacao = 'separado' THEN 1 END)
    INTO todos_separados
    FROM itens_solicitacao 
    WHERE itens_solicitacao.solicitacao_id = solicitacao_pronta_para_entrega.solicitacao_id;
    
    RETURN todos_separados;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de entrega
CREATE OR REPLACE FUNCTION obter_estatisticas_entrega()
RETURNS TABLE (
    solicitacoes_prontas INTEGER,
    solicitacoes_em_entrega INTEGER,
    solicitacoes_entregues_hoje INTEGER,
    itens_aguardando INTEGER,
    itens_em_entrega INTEGER,
    tempo_medio_entrega NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT COUNT(*) FROM solicitacoes WHERE status = 'separado'), 0)::INTEGER,
        COALESCE((SELECT COUNT(*) FROM solicitacoes WHERE status = 'em_entrega'), 0)::INTEGER,
        COALESCE((SELECT COUNT(*) FROM solicitacoes 
                 WHERE status IN ('entregue', 'parcialmente_entregue') 
                 AND DATE(updated_at) = CURRENT_DATE), 0)::INTEGER,
        COALESCE((SELECT COUNT(*) FROM itens_solicitacao 
                 WHERE status_entrega = 'aguardando' 
                 AND status_separacao = 'separado'), 0)::INTEGER,
        COALESCE((SELECT COUNT(*) FROM itens_solicitacao WHERE status_entrega = 'em_entrega'), 0)::INTEGER,
        COALESCE((SELECT AVG(EXTRACT(EPOCH FROM (concluido_entrega_em - iniciado_entrega_em)) / 60.0)
                 FROM itens_solicitacao 
                 WHERE concluido_entrega_em IS NOT NULL 
                 AND iniciado_entrega_em IS NOT NULL
                 AND DATE(concluido_entrega_em) = CURRENT_DATE), 0)::NUMERIC;
END;
$$ LANGUAGE plpgsql;