-- Criação das tabelas principais do sistema

-- Tabela de usuários
CREATE TABLE public.usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    nome text NOT NULL,
    perfil text NOT NULL CHECK (perfil IN ('solicitante', 'conferente', 'entregador', 'admin')),
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de praças de destino (compartilhada com outros módulos)
CREATE TABLE public.pracas_destino (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de produtos (compartilhada com outros módulos)
CREATE TABLE public.produtos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id text UNIQUE NOT NULL,
    descricao text NOT NULL,
    grupo text NOT NULL,
    subgrupo text NOT NULL,
    custo numeric(10,2) NOT NULL DEFAULT 0,
    tipo text NOT NULL CHECK (tipo IN ('insumo', 'produzido', 'produto')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de solicitações
CREATE TABLE public.solicitacoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitante_id uuid NOT NULL REFERENCES public.usuarios(id),
    praca_destino_id uuid NOT NULL REFERENCES public.pracas_destino(id),
    status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'rejeitada', 'separando', 'entregue', 'confirmada')),
    prioridade text NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
    observacoes text,
    data_solicitacao timestamp with time zone DEFAULT now(),
    janela_entrega text NOT NULL CHECK (janela_entrega IN ('manha', 'tarde')),
    tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    loja text NOT NULL DEFAULT 'Aragon',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de itens da solicitação
CREATE TABLE public.itens_solicitacao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
    produto_id uuid NOT NULL REFERENCES public.produtos(id),
    quantidade_solicitada numeric(10,2) NOT NULL,
    quantidade_separada numeric(10,2) DEFAULT 0,
    status text NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'separado', 'entregue', 'em_falta')),
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de movimento de estoque (compartilhada com outros módulos)
CREATE TABLE public.movimento_estoque (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id uuid NOT NULL REFERENCES public.produtos(id),
    tipo_movimento text NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
    quantidade numeric(10,2) NOT NULL,
    solicitacao_id uuid REFERENCES public.solicitacoes(id),
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_solicitacoes_solicitante_id ON public.solicitacoes(solicitante_id);
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes(status);
CREATE INDEX idx_solicitacoes_data_solicitacao ON public.solicitacoes(data_solicitacao);
CREATE INDEX idx_solicitacoes_praca_destino_id ON public.solicitacoes(praca_destino_id);
CREATE INDEX idx_itens_solicitacao_solicitacao_id ON public.itens_solicitacao(solicitacao_id);
CREATE INDEX idx_itens_solicitacao_produto_id ON public.itens_solicitacao(produto_id);
CREATE INDEX idx_movimento_estoque_produto_id ON public.movimento_estoque(produto_id);
CREATE INDEX idx_movimento_estoque_solicitacao_id ON public.movimento_estoque(solicitacao_id);
CREATE INDEX idx_produtos_produto_id ON public.produtos(produto_id);
CREATE INDEX idx_produtos_grupo ON public.produtos(grupo);
CREATE INDEX idx_produtos_tipo ON public.produtos(tipo);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON public.usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pracas_destino_updated_at 
    BEFORE UPDATE ON public.pracas_destino 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at 
    BEFORE UPDATE ON public.produtos 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solicitacoes_updated_at 
    BEFORE UPDATE ON public.solicitacoes 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itens_solicitacao_updated_at 
    BEFORE UPDATE ON public.itens_solicitacao 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movimento_estoque_updated_at 
    BEFORE UPDATE ON public.movimento_estoque 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();