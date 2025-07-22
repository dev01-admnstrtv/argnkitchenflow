-- Correção do fluxo de separação para não ir diretamente para 'entregue'

-- Substituir a função que atualiza status da solicitação baseado na separação
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
    IF (itens_separados + itens_em_falta) = total_itens THEN
        -- Todos os itens foram processados (separados ou em falta)
        UPDATE solicitacoes 
        SET status = 'separado'
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

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_status_solicitacao_separacao ON itens_solicitacao;
CREATE TRIGGER trigger_status_solicitacao_separacao
    AFTER UPDATE ON itens_solicitacao
    FOR EACH ROW
    WHEN (OLD.status_separacao != NEW.status_separacao)
    EXECUTE FUNCTION atualizar_status_solicitacao_separacao();

-- Função para atualizar status da solicitação baseado na entrega
CREATE OR REPLACE FUNCTION atualizar_status_solicitacao_entrega()
RETURNS TRIGGER AS $$
DECLARE
    total_itens INTEGER;
    itens_entregues INTEGER;
    itens_nao_entregues INTEGER;
    itens_aguardando_entrega INTEGER;
BEGIN
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
    SELECT COUNT(*) INTO itens_aguardando_entrega
    FROM itens_solicitacao 
    WHERE solicitacao_id = NEW.solicitacao_id 
    AND status_entrega = 'aguardando';
    
    -- Atualizar status da solicitação baseado no progresso da entrega
    IF (itens_entregues + itens_nao_entregues) = total_itens THEN
        -- Todos os itens foram processados na entrega
        IF itens_entregues = total_itens THEN
            -- Todos entregues
            UPDATE solicitacoes 
            SET status = 'entregue'
            WHERE id = NEW.solicitacao_id;
        ELSE
            -- Entrega parcial
            UPDATE solicitacoes 
            SET status = 'parcialmente_entregue'
            WHERE id = NEW.solicitacao_id;
        END IF;
    ELSIF itens_aguardando_entrega < total_itens THEN
        -- Entrega em andamento
        UPDATE solicitacoes 
        SET status = 'em_entrega'
        WHERE id = NEW.solicitacao_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para entrega
DROP TRIGGER IF EXISTS trigger_status_solicitacao_entrega ON itens_solicitacao;
CREATE TRIGGER trigger_status_solicitacao_entrega
    AFTER UPDATE ON itens_solicitacao
    FOR EACH ROW
    WHEN (OLD.status_entrega IS DISTINCT FROM NEW.status_entrega)
    EXECUTE FUNCTION atualizar_status_solicitacao_entrega();

-- Comentários explicativos
COMMENT ON FUNCTION atualizar_status_solicitacao_separacao() IS 'Atualiza status da solicitação para separando/separado baseado no progresso da separação';
COMMENT ON FUNCTION atualizar_status_solicitacao_entrega() IS 'Atualiza status da solicitação para em_entrega/entregue/parcialmente_entregue baseado no progresso da entrega';