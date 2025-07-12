-- Adicionando novos status para controle granular de separação
ALTER TABLE itens_solicitacao 
ADD COLUMN IF NOT EXISTS status_separacao VARCHAR(20) DEFAULT 'aguardando' CHECK (status_separacao IN ('aguardando', 'separando', 'separado', 'em_falta', 'cancelado'));

-- Adicionando campo para controle de tempo de separação
ALTER TABLE itens_solicitacao 
ADD COLUMN IF NOT EXISTS iniciado_separacao_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS concluido_separacao_em TIMESTAMP WITH TIME ZONE;

-- Adicionando campo para responsável pela separação
ALTER TABLE itens_solicitacao 
ADD COLUMN IF NOT EXISTS separado_por_usuario_id UUID REFERENCES usuarios(id);

-- Adicionando campo para observações específicas da separação
ALTER TABLE itens_solicitacao 
ADD COLUMN IF NOT EXISTS observacoes_separacao TEXT;

-- Adicionando campo para prioridade calculada (urgência + praça)
ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS prioridade_calculada INTEGER DEFAULT 0;

-- Criando índices para otimizar consultas de separação
CREATE INDEX IF NOT EXISTS idx_itens_solicitacao_status_separacao 
ON itens_solicitacao(status_separacao);

CREATE INDEX IF NOT EXISTS idx_itens_solicitacao_separado_por 
ON itens_solicitacao(separado_por_usuario_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_prioridade_calculada 
ON solicitacoes(prioridade_calculada DESC);

-- Criando função para calcular prioridade baseada em urgência + praça
CREATE OR REPLACE FUNCTION calcular_prioridade_separacao(
    p_prioridade VARCHAR(20),
    p_tipo_praca VARCHAR(20)
) RETURNS INTEGER AS $$
BEGIN
    -- Pontuação base por prioridade
    CASE p_prioridade
        WHEN 'urgente' THEN 100
        WHEN 'alta' THEN 80
        WHEN 'normal' THEN 50
        WHEN 'baixa' THEN 20
        ELSE 0
    END +
    -- Pontuação adicional por tipo de praça
    CASE p_tipo_praca
        WHEN 'cozinha' THEN 20
        WHEN 'salao' THEN 15
        WHEN 'bar' THEN 10
        WHEN 'estoque' THEN 5
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar prioridade calculada automaticamente
CREATE OR REPLACE FUNCTION atualizar_prioridade_calculada()
RETURNS TRIGGER AS $$
BEGIN
    -- Buscar tipo da praça de destino
    SELECT calcular_prioridade_separacao(
        NEW.prioridade,
        (SELECT tipo FROM pracas_destino WHERE id = NEW.praca_destino_id)
    ) INTO NEW.prioridade_calculada;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas operações de insert e update
DROP TRIGGER IF EXISTS trigger_prioridade_calculada ON solicitacoes;
CREATE TRIGGER trigger_prioridade_calculada
    BEFORE INSERT OR UPDATE ON solicitacoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_prioridade_calculada();

-- Atualizar prioridades das solicitações existentes
UPDATE solicitacoes 
SET prioridade_calculada = calcular_prioridade_separacao(
    prioridade,
    (SELECT tipo FROM pracas_destino WHERE id = solicitacoes.praca_destino_id)
);

-- Trigger para atualizar timestamps de separação
CREATE OR REPLACE FUNCTION atualizar_timestamps_separacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Se status mudou para 'separando', marcar início
    IF OLD.status_separacao != 'separando' AND NEW.status_separacao = 'separando' THEN
        NEW.iniciado_separacao_em = NOW();
    END IF;
    
    -- Se status mudou para 'separado' ou 'em_falta', marcar conclusão
    IF OLD.status_separacao NOT IN ('separado', 'em_falta') AND NEW.status_separacao IN ('separado', 'em_falta') THEN
        NEW.concluido_separacao_em = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para timestamps
DROP TRIGGER IF EXISTS trigger_timestamps_separacao ON itens_solicitacao;
CREATE TRIGGER trigger_timestamps_separacao
    BEFORE UPDATE ON itens_solicitacao
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamps_separacao();

-- Trigger para atualizar status da solicitação baseado nos itens
CREATE OR REPLACE FUNCTION atualizar_status_solicitacao_separacao()
RETURNS TRIGGER AS $$
DECLARE
    total_itens INTEGER;
    itens_separados INTEGER;
    itens_em_falta INTEGER;
    itens_aguardando INTEGER;
BEGIN
    -- Contar itens da solicitação
    SELECT COUNT(*) INTO total_itens
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id;
    
    -- Contar itens separados
    SELECT COUNT(*) INTO itens_separados
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id 
    AND status_separacao = 'separado';
    
    -- Contar itens em falta
    SELECT COUNT(*) INTO itens_em_falta
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id 
    AND status_separacao = 'em_falta';
    
    -- Contar itens aguardando
    SELECT COUNT(*) INTO itens_aguardando
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id 
    AND status_separacao = 'aguardando';
    
    -- Atualizar status da solicitação baseado no progresso
    IF itens_separados = total_itens THEN
        -- Todos os itens foram separados
        UPDATE solicitacoes 
        SET status = 'entregue'
        WHERE id = NEW.solicitacao_id;
    ELSIF itens_aguardando = 0 THEN
        -- Não há mais itens aguardando, separação concluída (com ou sem faltas)
        UPDATE solicitacoes 
        SET status = 'entregue'
        WHERE id = NEW.solicitacao_id;
    ELSIF itens_aguardando < total_itens THEN
        -- Separação em andamento
        UPDATE solicitacoes 
        SET status = 'separando'
        WHERE id = NEW.solicitacao_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger para atualizar status da solicitação
DROP TRIGGER IF EXISTS trigger_status_solicitacao_separacao ON itens_solicitacao;
CREATE TRIGGER trigger_status_solicitacao_separacao
    AFTER UPDATE ON itens_solicitacao
    FOR EACH ROW
    WHEN (OLD.status_separacao != NEW.status_separacao)
    EXECUTE FUNCTION atualizar_status_solicitacao_separacao();

-- Criar view para facilitar consultas do dashboard de separação
CREATE OR REPLACE VIEW vw_separacao_dashboard AS
SELECT 
    s.id as solicitacao_id,
    s.created_at,
    s.prioridade,
    s.prioridade_calculada,
    s.status,
    s.observacoes,
    pd.nome as praca_destino,
    pd.tipo as tipo_praca,
    u.nome as solicitante,
    COUNT(i.id) as total_itens,
    COUNT(CASE WHEN i.status_separacao = 'separado' THEN 1 END) as itens_separados,
    COUNT(CASE WHEN i.status_separacao = 'em_falta' THEN 1 END) as itens_em_falta,
    COUNT(CASE WHEN i.status_separacao = 'aguardando' THEN 1 END) as itens_aguardando,
    COUNT(CASE WHEN i.status_separacao = 'separando' THEN 1 END) as itens_separando,
    MIN(i.iniciado_separacao_em) as iniciado_em,
    MAX(i.concluido_separacao_em) as concluido_em,
    ROUND(
        (COUNT(CASE WHEN i.status_separacao IN ('separado', 'em_falta') THEN 1 END) * 100.0) / COUNT(i.id),
        2
    ) as percentual_concluido
FROM solicitacoes s
LEFT JOIN pracas_destino pd ON s.praca_destino_id = pd.id
LEFT JOIN usuarios u ON s.solicitante_id = u.id
LEFT JOIN itens_solicitacao i ON s.id = i.solicitacao_id
WHERE s.status IN ('pendente', 'separando')
GROUP BY s.id, s.created_at, s.prioridade, s.prioridade_calculada, s.status, s.observacoes, pd.nome, pd.tipo, u.nome
ORDER BY s.prioridade_calculada DESC, s.created_at ASC;

-- Criar view para detalhes de separação de uma solicitação específica
CREATE OR REPLACE VIEW vw_separacao_detalhes AS
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
    i.observacoes as observacoes_item,
    i.observacoes_separacao,
    i.iniciado_separacao_em,
    i.concluido_separacao_em,
    i.separado_por_usuario_id,
    u.nome as separado_por,
    -- Calcular tempo de separação
    CASE 
        WHEN i.concluido_separacao_em IS NOT NULL AND i.iniciado_separacao_em IS NOT NULL THEN
            EXTRACT(EPOCH FROM (i.concluido_separacao_em - i.iniciado_separacao_em)) / 60.0
        ELSE NULL
    END as tempo_separacao_minutos
FROM itens_solicitacao i
LEFT JOIN produtos p ON i.produto_id = p.id
LEFT JOIN usuarios u ON i.separado_por_usuario_id = u.id
ORDER BY i.created_at ASC;

-- Inserir dados de exemplo para teste (opcional)
/*
INSERT INTO usuarios (id, nome, email, perfil) VALUES 
('11111111-1111-1111-1111-111111111111', 'João Conferente', 'joao@aragon.com', 'conferente')
ON CONFLICT (id) DO NOTHING;
*/

-- Comentários explicativos
COMMENT ON COLUMN itens_solicitacao.status_separacao IS 'Status granular da separação: aguardando, separando, separado, em_falta, cancelado';
COMMENT ON COLUMN itens_solicitacao.iniciado_separacao_em IS 'Timestamp do início da separação do item';
COMMENT ON COLUMN itens_solicitacao.concluido_separacao_em IS 'Timestamp da conclusão da separação do item';
COMMENT ON COLUMN itens_solicitacao.separado_por_usuario_id IS 'ID do usuário que separou o item';
COMMENT ON COLUMN itens_solicitacao.observacoes_separacao IS 'Observações específicas do processo de separação';
COMMENT ON COLUMN solicitacoes.prioridade_calculada IS 'Prioridade numérica calculada baseada em urgência + tipo de praça';
COMMENT ON VIEW vw_separacao_dashboard IS 'View para dashboard de separação com estatísticas agregadas';
COMMENT ON VIEW vw_separacao_detalhes IS 'View para detalhes completos da separação por item';