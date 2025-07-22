-- Migração para refatorar estrutura de produtos e criar tabela agrupamentos
-- Remove colunas 'grupo' e 'subgrupo' da tabela produtos
-- Cria nova tabela 'agrupamentos' com relacionamento

-- 1. Criar tabela agrupamentos
CREATE TABLE public.agrupamentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo text NOT NULL,
    subgrupo text NOT NULL,
    tipo text NOT NULL CHECK (tipo IN ('insumo', 'produzido', 'produto')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(grupo, subgrupo, tipo)
);

-- 2. Migrar dados existentes da tabela produtos para agrupamentos
INSERT INTO public.agrupamentos (grupo, subgrupo, tipo)
SELECT DISTINCT 
    produtos.grupo,
    produtos.subgrupo,
    CASE 
        WHEN produtos.tipo = 'insumo' THEN 'insumo'
        WHEN produtos.tipo = 'produzido' THEN 'produzido'
        WHEN produtos.tipo = 'produto' THEN 'produto'
    END as tipo
FROM public.produtos
WHERE produtos.grupo IS NOT NULL 
  AND produtos.subgrupo IS NOT NULL
ON CONFLICT (grupo, subgrupo, tipo) DO NOTHING;

-- 3. Adicionar coluna agrupamento_id na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN agrupamento_id uuid REFERENCES public.agrupamentos(id);

-- 4. Atualizar produtos com o agrupamento_id correto
UPDATE public.produtos 
SET agrupamento_id = agrupamentos.id
FROM public.agrupamentos
WHERE produtos.grupo = agrupamentos.grupo 
  AND produtos.subgrupo = agrupamentos.subgrupo 
  AND (
    (produtos.tipo = 'insumo' AND agrupamentos.tipo = 'insumo') OR
    (produtos.tipo = 'produzido' AND agrupamentos.tipo = 'produzido') OR
    (produtos.tipo = 'produto' AND agrupamentos.tipo = 'produto') 
  );

-- 5. Tornar agrupamento_id obrigatório
ALTER TABLE public.produtos 
ALTER COLUMN agrupamento_id SET NOT NULL;

-- 6. Remover colunas antigas
ALTER TABLE public.produtos 
DROP COLUMN grupo,
DROP COLUMN subgrupo;

-- 7. Criar índices para performance
CREATE INDEX idx_agrupamentos_grupo ON public.agrupamentos(grupo);
CREATE INDEX idx_agrupamentos_subgrupo ON public.agrupamentos(subgrupo);
CREATE INDEX idx_agrupamentos_tipo ON public.agrupamentos(tipo);
CREATE INDEX idx_produtos_agrupamento_id ON public.produtos(agrupamento_id);

-- 8. Trigger para updated_at na tabela agrupamentos
CREATE TRIGGER update_agrupamentos_updated_at 
    BEFORE UPDATE ON public.agrupamentos 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Comentários para documentação
COMMENT ON TABLE public.agrupamentos IS 'Tabela para agrupar produtos por categoria e tipo';
COMMENT ON COLUMN public.agrupamentos.grupo IS 'Grupo principal do produto (ex: Carnes, Bebidas, etc.)';
COMMENT ON COLUMN public.agrupamentos.subgrupo IS 'Subgrupo específico (ex: Carnes Vermelhas, Refrigerantes, etc.)';
COMMENT ON COLUMN public.agrupamentos.tipo IS 'Tipo de agrupamento: Insumo ou Venda';
COMMENT ON COLUMN public.produtos.agrupamento_id IS 'Referência para o agrupamento do produto';