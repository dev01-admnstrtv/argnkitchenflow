-- Criação das tabelas para o módulo de fichas técnicas

-- Tabela principal de fichas técnicas
CREATE TABLE public.fichas_tecnicas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    categoria text NOT NULL CHECK (categoria IN ('prato', 'bebida', 'sobremesa', 'entrada')),
    tempo_preparo integer, -- em minutos
    rendimento integer, -- porções
    dificuldade text CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
    custo_estimado numeric(10,2),
    observacoes text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Ingredientes das fichas técnicas
CREATE TABLE public.fichas_tecnicas_ingredientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_tecnica_id uuid NOT NULL REFERENCES public.fichas_tecnicas(id) ON DELETE CASCADE,
    produto_id uuid NOT NULL REFERENCES public.produtos(id),
    quantidade numeric(10,3) NOT NULL,
    unidade text NOT NULL,
    fator_correcao numeric(5,2) DEFAULT 1.0 NOT NULL,
    opcional boolean DEFAULT false,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Fotos das fichas técnicas
CREATE TABLE public.fichas_tecnicas_fotos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_tecnica_id uuid NOT NULL REFERENCES public.fichas_tecnicas(id) ON DELETE CASCADE,
    url text NOT NULL,
    descricao text,
    principal boolean DEFAULT false,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Modo de preparo
CREATE TABLE public.fichas_tecnicas_preparo (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_tecnica_id uuid NOT NULL REFERENCES public.fichas_tecnicas(id) ON DELETE CASCADE,
    passo integer NOT NULL,
    descricao text NOT NULL,
    tempo_estimado integer, -- em minutos
    temperatura integer, -- em graus Celsius
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Relacionamento com praças
CREATE TABLE public.fichas_tecnicas_pracas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_tecnica_id uuid NOT NULL REFERENCES public.fichas_tecnicas(id) ON DELETE CASCADE,
    praca_destino_id uuid NOT NULL REFERENCES public.pracas_destino(id) ON DELETE CASCADE,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(ficha_tecnica_id, praca_destino_id)
);

-- Índices para melhor performance
CREATE INDEX idx_fichas_tecnicas_categoria ON public.fichas_tecnicas(categoria);
CREATE INDEX idx_fichas_tecnicas_ativo ON public.fichas_tecnicas(ativo);
CREATE INDEX idx_fichas_tecnicas_ingredientes_ficha ON public.fichas_tecnicas_ingredientes(ficha_tecnica_id);
CREATE INDEX idx_fichas_tecnicas_ingredientes_produto ON public.fichas_tecnicas_ingredientes(produto_id);
CREATE INDEX idx_fichas_tecnicas_fotos_ficha ON public.fichas_tecnicas_fotos(ficha_tecnica_id);
CREATE INDEX idx_fichas_tecnicas_fotos_principal ON public.fichas_tecnicas_fotos(principal) WHERE principal = true;
CREATE INDEX idx_fichas_tecnicas_preparo_ficha ON public.fichas_tecnicas_preparo(ficha_tecnica_id);
CREATE INDEX idx_fichas_tecnicas_preparo_passo ON public.fichas_tecnicas_preparo(ficha_tecnica_id, passo);
CREATE INDEX idx_fichas_tecnicas_pracas_ficha ON public.fichas_tecnicas_pracas(ficha_tecnica_id);
CREATE INDEX idx_fichas_tecnicas_pracas_praca ON public.fichas_tecnicas_pracas(praca_destino_id);