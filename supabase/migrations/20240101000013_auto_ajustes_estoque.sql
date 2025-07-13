-- Automatizar aplicação de ajustes de estoque quando solicitação for entregue

-- Função para aplicar ajustes de estoque automaticamente
CREATE OR REPLACE FUNCTION aplicar_ajustes_estoque_automatico()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    praca_nome TEXT;
BEGIN
    -- Verificar se o status mudou para 'entregue'
    IF OLD.status != 'entregue' AND NEW.status = 'entregue' THEN
        
        -- Buscar nome da praça de destino
        SELECT nome INTO praca_nome 
        FROM pracas_destino 
        WHERE id = NEW.praca_destino_id;
        
        -- Verificar se já existem movimentações para esta solicitação (evitar duplicatas)
        IF NOT EXISTS (
            SELECT 1 FROM movimento_estoque 
            WHERE solicitacao_id = NEW.id
        ) THEN
            -- Criar movimentações para todos os itens separados
            FOR item_record IN 
                SELECT 
                    produto_id,
                    quantidade_separada,
                    observacoes_separacao
                FROM itens_solicitacao 
                WHERE solicitacao_id = NEW.id 
                AND status_separacao = 'separado'
                AND quantidade_separada > 0
            LOOP
                INSERT INTO movimento_estoque (
                    produto_id,
                    tipo_movimento,
                    quantidade,
                    solicitacao_id,
                    observacoes
                ) VALUES (
                    item_record.produto_id,
                    CASE WHEN NEW.tipo = 'entrada' THEN 'entrada' ELSE 'saida' END,
                    item_record.quantidade_separada,
                    NEW.id,
                    CONCAT(
                        'Separação de solicitação - ', 
                        COALESCE(praca_nome, 'N/A'),
                        CASE 
                            WHEN item_record.observacoes_separacao IS NOT NULL 
                            AND item_record.observacoes_separacao != '' 
                            THEN CONCAT(' | ', item_record.observacoes_separacao)
                            ELSE ''
                        END
                    )
                );
            END LOOP;
            
            -- Atualizar status para confirmada após aplicar ajustes
            UPDATE solicitacoes 
            SET status = 'confirmada'
            WHERE id = NEW.id;
            
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar automaticamente
DROP TRIGGER IF EXISTS trigger_aplicar_ajustes_estoque_automatico ON solicitacoes;
CREATE TRIGGER trigger_aplicar_ajustes_estoque_automatico
    AFTER UPDATE ON solicitacoes
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'entregue')
    EXECUTE FUNCTION aplicar_ajustes_estoque_automatico();

-- Comentário explicativo
COMMENT ON FUNCTION aplicar_ajustes_estoque_automatico() IS 'Aplica automaticamente ajustes de estoque quando solicitação é marcada como entregue, evitando duplicatas';
COMMENT ON TRIGGER trigger_aplicar_ajustes_estoque_automatico ON solicitacoes IS 'Trigger que executa aplicação automática de ajustes de estoque quando status muda para entregue';