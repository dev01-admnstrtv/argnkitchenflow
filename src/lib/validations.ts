import { z } from 'zod'

export const solicitacaoSchema = z.object({
  praca_destino_id: z.string().uuid('Selecione uma praça de destino'),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']),
  observacoes: z.string().optional(),
  tipo: z.enum(['entrada', 'saida']).default('saida'),
  data_entrega: z.string().min(1, 'Data de entrega é obrigatória'),
  janela_entrega: z.enum(['manha', 'tarde', 'noite']),
  itens: z.array(z.object({
    produto_id: z.string().uuid('Selecione um produto'),
    quantidade_solicitada: z.number().min(0.01, 'Quantidade deve ser maior que 0'),
    observacoes: z.string().optional(),
  })).min(1, 'Adicione pelo menos um item'),
})

export const itemSolicitacaoSchema = z.object({
  produto_id: z.string().uuid('Selecione um produto'),
  quantidade_solicitada: z.number().min(0.01, 'Quantidade deve ser maior que 0'),
  observacoes: z.string().optional(),
})

export const separacaoSchema = z.object({
  item_id: z.string().uuid(),
  quantidade_separada: z.number().min(0, 'Quantidade não pode ser negativa'),
  status: z.enum(['separado', 'em_falta', 'cancelado']),
  observacoes: z.string().optional(),
})


export const usuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  perfil: z.enum(['solicitante', 'conferente', 'admin']),
})

export const produtoSchema = z.object({
  produto_id: z.string().min(1, 'Código do produto é obrigatório'),
  descricao: z.string().min(2, 'Descrição deve ter pelo menos 2 caracteres'),
  grupo: z.string().min(1, 'Grupo é obrigatório'),
  subgrupo: z.string().min(1, 'Subgrupo é obrigatório'),
  custo: z.number().min(0, 'Custo não pode ser negativo').optional(),
  tipo: z.enum(['insumo', 'produzido', 'produto']),
  agrupamento_id: z.string().uuid().optional().nullable(),
})

export const agrupamentoSchema = z.object({
  cod_agrupamento: z.string().min(1, 'Código do agrupamento é obrigatório'),
  grupo: z.string().min(1, 'Grupo é obrigatório'),
  subgrupo: z.string().min(1, 'Subgrupo é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.string().optional(),
  ativo: z.boolean().optional(),
})

export const pracaDestinoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  responsavel: z.string().optional(),
  tipo: z.enum(['cozinha', 'salao', 'bar', 'estoque', 'limpeza', 'escritorio', 'geral']),
  capacidade_maxima: z.number().min(1, 'Capacidade deve ser maior que 0').optional().nullable(),
  limite_produtos: z.number().min(1, 'Limite deve ser maior que 0').optional().nullable(),
  ativo: z.boolean().optional(),
})