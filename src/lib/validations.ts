import { z } from 'zod'

export const solicitacaoSchema = z.object({
  praca_destino_id: z.string().uuid('Selecione uma praça de destino'),
  solicitante: z.string().min(1, 'Solicitante é obrigatório'),
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
  perfil: z.enum(['solicitante', 'conferente', 'entregador', 'admin']),
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

export const fichaTecnicaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  categoria: z.enum(['prato', 'bebida', 'sobremesa', 'entrada']),
  tempo_preparo: z.number().min(1, 'Tempo deve ser maior que 0').optional().nullable(),
  rendimento: z.number().min(1, 'Rendimento deve ser maior que 0').optional().nullable(),
  dificuldade: z.enum(['facil', 'medio', 'dificil']).optional().nullable(),
  custo_estimado: z.number().min(0, 'Custo não pode ser negativo').optional().nullable(),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional(),
})

export const fichaTecnicaIngredienteSchema = z.object({
  produto_id: z.string().uuid('Selecione um produto'),
  quantidade: z.number().min(0.01, 'Quantidade deve ser maior que 0'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  fator_correcao: z.number().min(0.1, 'Fator deve ser maior que 0.1').max(10, 'Fator não pode ser maior que 10').optional(),
  opcional: z.boolean().optional(),
  observacoes: z.string().optional(),
})

export const fichaTecnicaPreparoSchema = z.object({
  passo: z.number().min(1, 'Passo deve ser maior que 0'),
  descricao: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  tempo_estimado: z.number().min(1, 'Tempo deve ser maior que 0').optional().nullable(),
  temperatura: z.number().min(0, 'Temperatura não pode ser negativa').optional().nullable(),
  observacoes: z.string().optional(),
})

export const fichaTecnicaCompletaSchema = z.object({
  ficha: fichaTecnicaSchema,
  ingredientes: z.array(fichaTecnicaIngredienteSchema).min(1, 'Adicione pelo menos um ingrediente'),
  preparo: z.array(fichaTecnicaPreparoSchema).min(1, 'Adicione pelo menos um passo de preparo'),
  pracas: z.array(z.string().uuid()).optional(),
})