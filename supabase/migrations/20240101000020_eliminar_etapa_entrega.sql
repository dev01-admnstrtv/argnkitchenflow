-- Migração para eliminar a etapa de entrega do fluxo
-- O fluxo será: pendente → separando → separado → entregue/confirmada

-- 1. Remover dependências primeiro
-- Remover triggers de entrega
DROP TRIGGER IF EXISTS trigger_timestamps_entrega ON itens_solicitacao;
DROP TRIGGER IF EXISTS trigger_status_solicitacao_entrega ON itens_solicitacao;

-- 2. Remover views de entrega
DROP VIEW IF EXISTS vw_entrega_dashboard;
DROP VIEW IF EXISTS vw_entrega_detalhes;

-- 3. Remover funções de entrega
DROP FUNCTION IF EXISTS buscar_solicitacoes_para_entrega();
DROP FUNCTION IF EXISTS iniciar_entrega_solicitacao(uuid);
DROP FUNCTION IF EXISTS confirmar_entrega_item(uuid, text);
DROP FUNCTION IF EXISTS finalizar_entrega_solicitacao(uuid);
DROP FUNCTION IF EXISTS atualizar_timestamps_entrega();
DROP FUNCTION IF EXISTS atualizar_status_solicitacao_entrega();

-- 4. Atualizar todas as solicitações que estão em estados de entrega para 'entregue'
UPDATE solicitacoes 
SET status = 'entregue' 
WHERE status IN ('em_entrega', 'parcialmente_entregue');

-- 5. Atualizar enum de status das solicitações (remover estados intermediários de entrega)
ALTER TABLE solicitacoes 
DROP CONSTRAINT IF EXISTS solicitacoes_status_check;

ALTER TABLE solicitacoes 
ADD CONSTRAINT solicitacoes_status_check 
CHECK (status IN ('pendente', 'separando', 'separado', 'entregue', 'rejeitada', 'confirmada'));

-- 6. Agora remover campos de entrega da tabela itens_solicitacao
ALTER TABLE itens_solicitacao 
DROP COLUMN IF EXISTS status_entrega CASCADE,
DROP COLUMN IF EXISTS iniciado_entrega_em CASCADE,
DROP COLUMN IF EXISTS concluido_entrega_em CASCADE,
DROP COLUMN IF EXISTS entregador_id CASCADE;

-- 6. Atualizar trigger de separação para finalizar diretamente após separação completa
CREATE OR REPLACE FUNCTION atualizar_status_solicitacao_pos_separacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se todos os itens foram processados (separados, em_falta ou cancelados)
    IF NOT EXISTS (
        SELECT 1 FROM itens_solicitacao 
        WHERE solicitacao_id = NEW.solicitacao_id 
        AND status_separacao = 'aguardando'
    ) THEN
        -- Verificar se há itens separados com sucesso
        IF EXISTS (
            SELECT 1 FROM itens_solicitacao 
            WHERE solicitacao_id = NEW.solicitacao_id 
            AND status_separacao = 'separado'
        ) THEN
            -- Atualizar status da solicitação para 'entregue' (finalizada)
            UPDATE solicitacoes 
            SET status = 'entregue', 
                updated_at = NOW()
            WHERE id = NEW.solicitacao_id;
        ELSE
            -- Se não há itens separados, marcar como rejeitada
            UPDATE solicitacoes 
            SET status = 'rejeitada', 
                updated_at = NOW()
            WHERE id = NEW.solicitacao_id;
        END IF;
    ELSE
        -- Se ainda há itens aguardando, manter como separando
        UPDATE solicitacoes 
        SET status = 'separando', 
            updated_at = NOW()
        WHERE id = NEW.solicitacao_id 
        AND status != 'separando';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Recriar trigger
DROP TRIGGER IF EXISTS trigger_atualizar_status_solicitacao_pos_separacao ON itens_solicitacao;
CREATE TRIGGER trigger_atualizar_status_solicitacao_pos_separacao
    AFTER UPDATE OF status_separacao ON itens_solicitacao
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_status_solicitacao_pos_separacao();

-- 8. Atualizar comentários
COMMENT ON COLUMN solicitacoes.status IS 'Status da solicitação: pendente, separando, separado, entregue, rejeitada, confirmada';
COMMENT ON TABLE solicitacoes IS 'Solicitações de produtos - fluxo simplificado sem etapa de entrega separada';