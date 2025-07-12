-- ========================================
-- CRIAÇÃO DAS TABELAS DE INVENTÁRIO
-- ========================================

-- Tabela principal de inventários
CREATE TABLE public.inventarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_inventario text UNIQUE NOT NULL,
    praca_id uuid NOT NULL REFERENCES public.pracas_destino(id),
    data_contagem date NOT NULL,
    responsavel text NOT NULL,
    status text NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizado')),
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    finalizado_at timestamp with time zone
);

-- Tabela de itens do inventário
CREATE TABLE public.inventario_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id uuid NOT NULL REFERENCES public.inventarios(id) ON DELETE CASCADE,
    produto_id uuid NOT NULL REFERENCES public.produtos(id),
    quantidade numeric(10,3) NOT NULL DEFAULT 0,
    quantidade_em_uso numeric(10,3) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(inventario_id, produto_id)
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para inventários
CREATE INDEX idx_inventarios_praca_id ON public.inventarios(praca_id);
CREATE INDEX idx_inventarios_status ON public.inventarios(status);
CREATE INDEX idx_inventarios_data_contagem ON public.inventarios(data_contagem);
CREATE INDEX idx_inventarios_numero ON public.inventarios(numero_inventario);

-- Índices para inventario_itens
CREATE INDEX idx_inventario_itens_inventario_id ON public.inventario_itens(inventario_id);
CREATE INDEX idx_inventario_itens_produto_id ON public.inventario_itens(produto_id);

-- ========================================
-- VIEWS PARA CONSULTAS OTIMIZADAS
-- ========================================

-- View completa de inventários com informações da praça
CREATE OR REPLACE VIEW public.vw_inventarios_completos AS
SELECT 
    i.id,
    i.numero_inventario,
    i.praca_id,
    p.nome as praca_nome,
    i.data_contagem,
    i.responsavel,
    i.status,
    i.observacoes,
    i.created_at,
    i.updated_at,
    i.finalizado_at,
    COUNT(ii.id) as total_itens,
    COALESCE(SUM(ii.quantidade), 0) as quantidade_total,
    COALESCE(SUM(ii.quantidade_em_uso), 0) as quantidade_em_uso_total
FROM public.inventarios i
LEFT JOIN public.pracas_destino p ON i.praca_id = p.id
LEFT JOIN public.inventario_itens ii ON i.id = ii.inventario_id
GROUP BY 
    i.id, i.numero_inventario, i.praca_id, p.nome, 
    i.data_contagem, i.responsavel, i.status, i.observacoes,
    i.created_at, i.updated_at, i.finalizado_at;

-- View completa de itens de inventário com informações do produto
CREATE OR REPLACE VIEW public.vw_inventario_itens_completos AS
SELECT 
    ii.id,
    ii.inventario_id,
    ii.produto_id,
    p.produto_id as codigo_produto,
    p.descricao as produto_descricao,
    p.grupo as produto_grupo,
    p.subgrupo as produto_subgrupo,
    p.tipo as produto_tipo,
    p.custo as produto_custo,
    ii.quantidade,
    ii.quantidade_em_uso,
    ii.created_at,
    ii.updated_at,
    inv.numero_inventario,
    inv.status as inventario_status
FROM public.inventario_itens ii
INNER JOIN public.produtos p ON ii.produto_id = p.id
INNER JOIN public.inventarios inv ON ii.inventario_id = inv.id;

-- ========================================
-- TRIGGERS PARA AUDITORIA
-- ========================================

-- Trigger para atualizar updated_at em inventarios
CREATE OR REPLACE FUNCTION public.update_inventarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- Se o status mudou para 'finalizado', registrar a data
    IF NEW.status = 'finalizado' AND OLD.status != 'finalizado' THEN
        NEW.finalizado_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventarios_updated_at
    BEFORE UPDATE ON public.inventarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventarios_updated_at();

-- Trigger para atualizar updated_at em inventario_itens
CREATE OR REPLACE FUNCTION public.update_inventario_itens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventario_itens_updated_at
    BEFORE UPDATE ON public.inventario_itens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventario_itens_updated_at();

-- ========================================
-- FUNÇÃO PARA GERAR NÚMERO DO INVENTÁRIO
-- ========================================

CREATE OR REPLACE FUNCTION public.gerar_numero_inventario()
RETURNS text AS $$
DECLARE
    ultimo_numero text;
    proximo_numero integer;
    ano_atual text;
BEGIN
    ano_atual := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Buscar o último número do inventário do ano atual
    SELECT numero_inventario INTO ultimo_numero
    FROM public.inventarios
    WHERE numero_inventario LIKE 'INV-' || ano_atual || '-%'
    ORDER BY numero_inventario DESC
    LIMIT 1;
    
    -- Se não há inventários no ano atual, começar com 1
    IF ultimo_numero IS NULL THEN
        proximo_numero := 1;
    ELSE
        -- Extrair o número sequencial e incrementar
        proximo_numero := CAST(SPLIT_PART(ultimo_numero, '-', 3) AS integer) + 1;
    END IF;
    
    -- Retornar o número formatado: INV-YYYY-NNNN
    RETURN 'INV-' || ano_atual || '-' || LPAD(proximo_numero::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- POLÍTICAS RLS (Row Level Security)
-- ========================================
-- Nota: Desabilitando RLS conforme solicitado no escopo do projeto

-- ========================================
-- COMENTÁRIOS NAS TABELAS
-- ========================================

COMMENT ON TABLE public.inventarios IS 'Tabela principal dos inventários realizados nas praças';
COMMENT ON COLUMN public.inventarios.numero_inventario IS 'Número único do inventário no formato INV-YYYY-NNNN';
COMMENT ON COLUMN public.inventarios.praca_id IS 'Referência para a praça onde foi realizado o inventário';
COMMENT ON COLUMN public.inventarios.data_contagem IS 'Data em que foi realizada a contagem física';
COMMENT ON COLUMN public.inventarios.responsavel IS 'Nome da pessoa responsável pela contagem';
COMMENT ON COLUMN public.inventarios.status IS 'Status do inventário: em_andamento ou finalizado';

COMMENT ON TABLE public.inventario_itens IS 'Itens contados em cada inventário';
COMMENT ON COLUMN public.inventario_itens.quantidade IS 'Quantidade total encontrada do produto';
COMMENT ON COLUMN public.inventario_itens.quantidade_em_uso IS 'Quantidade do produto que está em uso/consumo';