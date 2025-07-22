-- Aplicar correções para dados existentes da separação

-- Primeiro, vamos verificar se a migration anterior foi aplicada
-- Se não foi, aplicar os campos novos manualmente

-- Adicionar campos caso não existam
DO $$ 
BEGIN
    -- Adicionar campos de separação se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'itens_solicitacao' AND column_name = 'status_separacao') THEN
        ALTER TABLE itens_solicitacao 
        ADD COLUMN status_separacao VARCHAR(20) DEFAULT 'aguardando' CHECK (status_separacao IN ('aguardando', 'separando', 'separado', 'em_falta', 'cancelado'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'itens_solicitacao' AND column_name = 'iniciado_separacao_em') THEN
        ALTER TABLE itens_solicitacao 
        ADD COLUMN iniciado_separacao_em TIMESTAMP WITH TIME ZONE,
        ADD COLUMN concluido_separacao_em TIMESTAMP WITH TIME ZONE,
        ADD COLUMN separado_por_usuario_id UUID REFERENCES usuarios(id),
        ADD COLUMN observacoes_separacao TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'solicitacoes' AND column_name = 'prioridade_calculada') THEN
        ALTER TABLE solicitacoes 
        ADD COLUMN prioridade_calculada INTEGER DEFAULT 0;
    END IF;
END $$;

-- Criar função para calcular prioridade se não existir
CREATE OR REPLACE FUNCTION calcular_prioridade_separacao(
    p_prioridade VARCHAR(20),
    p_tipo_praca VARCHAR(20)
) RETURNS INTEGER AS $$
BEGIN
    RETURN (
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
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Atualizar dados existentes
-- 1. Definir status_separacao para todos os itens de solicitações pendentes
UPDATE itens_solicitacao 
SET status_separacao = 'aguardando' 
WHERE status_separacao IS NULL 
AND solicitacao_id IN (
    SELECT id FROM solicitacoes WHERE status = 'pendente'
);

-- 2. Calcular prioridade para todas as solicitações existentes
UPDATE solicitacoes 
SET prioridade_calculada = calcular_prioridade_separacao(
    prioridade,
    COALESCE((SELECT tipo FROM pracas_destino WHERE id = solicitacoes.praca_destino_id), 'geral')
)
WHERE prioridade_calculada = 0 OR prioridade_calculada IS NULL;

-- 3. Criar/recriar view de dashboard de separação
CREATE OR REPLACE VIEW vw_separacao_dashboard AS
SELECT 
    s.id as solicitacao_id,
    s.created_at,
    s.prioridade,
    s.prioridade_calculada,
    s.status,
    s.observacoes,
    COALESCE(pd.nome, 'N/A') as praca_destino,
    COALESCE(pd.tipo, 'geral') as tipo_praca,
    COALESCE(u.nome, 'N/A') as solicitante,
    COUNT(i.id) as total_itens,
    COUNT(CASE WHEN i.status_separacao = 'separado' THEN 1 END) as itens_separados,
    COUNT(CASE WHEN i.status_separacao = 'em_falta' THEN 1 END) as itens_em_falta,
    COUNT(CASE WHEN i.status_separacao = 'aguardando' THEN 1 END) as itens_aguardando,
    COUNT(CASE WHEN i.status_separacao = 'separando' THEN 1 END) as itens_separando,
    MIN(i.iniciado_separacao_em) as iniciado_em,
    MAX(i.concluido_separacao_em) as concluido_em,
    ROUND(
        COALESCE(
            (COUNT(CASE WHEN i.status_separacao IN ('separado', 'em_falta') THEN 1 END) * 100.0) / NULLIF(COUNT(i.id), 0),
            0
        ), 2
    ) as percentual_concluido
FROM solicitacoes s
LEFT JOIN pracas_destino pd ON s.praca_destino_id = pd.id
LEFT JOIN usuarios u ON s.solicitante_id = u.id
LEFT JOIN itens_solicitacao i ON s.id = i.solicitacao_id
WHERE s.status IN ('pendente', 'separando')
GROUP BY s.id, s.created_at, s.prioridade, s.prioridade_calculada, s.status, s.observacoes, pd.nome, pd.tipo, u.nome
ORDER BY s.prioridade_calculada DESC, s.created_at ASC;

-- 4. Criar/recriar view de detalhes de separação
CREATE OR REPLACE VIEW vw_separacao_detalhes AS
SELECT 
    i.id as item_id,
    i.solicitacao_id,
    i.produto_id,
    COALESCE(p.descricao, 'N/A') as produto_descricao,
    COALESCE(p.grupo, 'N/A') as produto_grupo,
    COALESCE(p.subgrupo, 'N/A') as produto_subgrupo,
    i.quantidade_solicitada,
    COALESCE(i.quantidade_separada, 0) as quantidade_separada,
    COALESCE(i.status_separacao, 'aguardando') as status_separacao,
    i.observacoes as observacoes_item,
    i.observacoes_separacao,
    i.iniciado_separacao_em,
    i.concluido_separacao_em,
    i.separado_por_usuario_id,
    COALESCE(u.nome, 'N/A') as separado_por,
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

-- 5. Criar triggers para manter dados sincronizados
-- Trigger para atualizar prioridade calculada automaticamente
CREATE OR REPLACE FUNCTION atualizar_prioridade_calculada()
RETURNS TRIGGER AS $$
BEGIN
    -- Buscar tipo da praça de destino
    NEW.prioridade_calculada := calcular_prioridade_separacao(
        NEW.prioridade,
        COALESCE((SELECT tipo FROM pracas_destino WHERE id = NEW.praca_destino_id), 'geral')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas operações de insert e update
DROP TRIGGER IF EXISTS trigger_prioridade_calculada ON solicitacoes;
CREATE TRIGGER trigger_prioridade_calculada
    BEFORE INSERT OR UPDATE ON solicitacoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_prioridade_calculada();

-- Trigger para atualizar timestamps de separação
CREATE OR REPLACE FUNCTION atualizar_timestamps_separacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Se status mudou para 'separando', marcar início
    IF (OLD.status_separacao IS NULL OR OLD.status_separacao != 'separando') AND NEW.status_separacao = 'separando' THEN
        NEW.iniciado_separacao_em = NOW();
    END IF;
    
    -- Se status mudou para 'separado' ou 'em_falta', marcar conclusão
    IF (OLD.status_separacao IS NULL OR OLD.status_separacao NOT IN ('separado', 'em_falta')) AND NEW.status_separacao IN ('separado', 'em_falta') THEN
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
    WHEN (OLD.status_separacao IS DISTINCT FROM NEW.status_separacao)
    EXECUTE FUNCTION atualizar_status_solicitacao_separacao();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_itens_solicitacao_status_separacao 
ON itens_solicitacao(status_separacao);

CREATE INDEX IF NOT EXISTS idx_itens_solicitacao_separado_por 
ON itens_solicitacao(separado_por_usuario_id);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_prioridade_calculada 
ON solicitacoes(prioridade_calculada DESC);

-- Comentários explicativos
COMMENT ON COLUMN itens_solicitacao.status_separacao IS 'Status granular da separação: aguardando, separando, separado, em_falta, cancelado';
COMMENT ON COLUMN itens_solicitacao.iniciado_separacao_em IS 'Timestamp do início da separação do item';
COMMENT ON COLUMN itens_solicitacao.concluido_separacao_em IS 'Timestamp da conclusão da separação do item';
COMMENT ON COLUMN itens_solicitacao.separado_por_usuario_id IS 'ID do usuário que separou o item';
COMMENT ON COLUMN itens_solicitacao.observacoes_separacao IS 'Observações específicas do processo de separação';
COMMENT ON COLUMN solicitacoes.prioridade_calculada IS 'Prioridade numérica calculada baseada em urgência + tipo de praça';
COMMENT ON VIEW vw_separacao_dashboard IS 'View para dashboard de separação com estatísticas agregadas';
COMMENT ON VIEW vw_separacao_detalhes IS 'View para detalhes completos da separação por item';

-- Verificar se há dados para testar
-- Se não houver dados, criar alguns dados de exemplo
DO $$
BEGIN
    -- Verificar se existem solicitações
    IF NOT EXISTS (SELECT 1 FROM solicitacoes LIMIT 1) THEN
        -- Criar dados de exemplo apenas se não existirem
        INSERT INTO usuarios (id, nome, email, perfil) VALUES 
        ('0f4a00bb-a9fd-4e00-ad29-f6e2bf1b4d47', 'João Silva', 'joao@aragon.com', 'solicitante'),
        ('11111111-1111-1111-1111-111111111111', 'Maria Santos', 'maria@aragon.com', 'conferente')
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO pracas_destino (id, nome, tipo, responsavel) VALUES 
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cozinha Principal', 'cozinha', 'Chef Carlos'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Salão VIP', 'salao', 'Garçom Pedro')
        ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO produtos (id, descricao, grupo, subgrupo, tipo, custo) VALUES 
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tomate', 'Hortifruti', 'Verduras', 'perecivel', 3.50),
        ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cebola', 'Hortifruti', 'Verduras', 'perecivel', 2.00)
        ON CONFLICT (id) DO NOTHING;
        
        -- Criar solicitação de exemplo
        INSERT INTO solicitacoes (id, solicitante_id, praca_destino_id, prioridade, observacoes) VALUES 
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '0f4a00bb-a9fd-4e00-ad29-f6e2bf1b4d47', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alta', 'Solicitação de teste')
        ON CONFLICT (id) DO NOTHING;
        
        -- Criar itens da solicitação
        INSERT INTO itens_solicitacao (solicitacao_id, produto_id, quantidade_solicitada) VALUES 
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10),
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Atualizar novamente após possível criação de dados
UPDATE itens_solicitacao 
SET status_separacao = 'aguardando' 
WHERE status_separacao IS NULL 
AND solicitacao_id IN (
    SELECT id FROM solicitacoes WHERE status = 'pendente'
);

-- Recalcular prioridades
UPDATE solicitacoes 
SET prioridade_calculada = calcular_prioridade_separacao(
    prioridade,
    COALESCE((SELECT tipo FROM pracas_destino WHERE id = solicitacoes.praca_destino_id), 'geral')
);