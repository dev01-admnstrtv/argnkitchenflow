-- Atualização da tabela pracas_destino com novos campos

ALTER TABLE public.pracas_destino 
ADD COLUMN IF NOT EXISTS responsavel text,
ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'geral' CHECK (tipo IN ('cozinha', 'salao', 'bar', 'estoque', 'limpeza', 'escritorio', 'geral')),
ADD COLUMN IF NOT EXISTS capacidade_maxima integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS limite_produtos integer DEFAULT NULL;

-- Atualizar dados existentes com tipo padrão
UPDATE public.pracas_destino 
SET tipo = CASE 
    WHEN nome ILIKE '%cozinha%' THEN 'cozinha'
    WHEN nome ILIKE '%salão%' OR nome ILIKE '%salao%' THEN 'salao'
    WHEN nome ILIKE '%bar%' THEN 'bar'
    WHEN nome ILIKE '%estoque%' THEN 'estoque'
    WHEN nome ILIKE '%limpeza%' THEN 'limpeza'
    WHEN nome ILIKE '%escritório%' OR nome ILIKE '%escritorio%' THEN 'escritorio'
    ELSE 'geral'
END
WHERE tipo = 'geral';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pracas_destino_tipo ON public.pracas_destino(tipo);
CREATE INDEX IF NOT EXISTS idx_pracas_destino_ativo ON public.pracas_destino(ativo);
CREATE INDEX IF NOT EXISTS idx_pracas_destino_responsavel ON public.pracas_destino(responsavel);