import { Database } from './database'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Solicitacao = Tables<'solicitacoes'>
export type ItemSolicitacao = Tables<'itens_solicitacao'>
export type Produto = Tables<'produtos'>
export interface Agrupamento {
  id: string
  cod_agrupamento: string
  grupo: string
  subgrupo: string
  descricao?: string
  tipo: string
  ativo: boolean
  created_at: string
  updated_at: string
}
export type PracaDestino = Tables<'pracas_destino'>
export type Usuario = Tables<'usuarios'>
export type MovimentoEstoque = Tables<'movimento_estoque'>

export type SolicitacaoInsert = Inserts<'solicitacoes'>
export type ItemSolicitacaoInsert = Inserts<'itens_solicitacao'>
export type ProdutoInsert = Inserts<'produtos'>
export type PracaDestinoInsert = Inserts<'pracas_destino'>
export type UsuarioInsert = Inserts<'usuarios'>
export type MovimentoEstoqueInsert = Inserts<'movimento_estoque'>

export type SolicitacaoUpdate = Updates<'solicitacoes'>
export type ItemSolicitacaoUpdate = Updates<'itens_solicitacao'>
export type ProdutoUpdate = Updates<'produtos'>
export type PracaDestinoUpdate = Updates<'pracas_destino'>
export type UsuarioUpdate = Updates<'usuarios'>
export type MovimentoEstoqueUpdate = Updates<'movimento_estoque'>

// Tipos específicos para Agrupamento (não baseados no Supabase)
export type AgrupamentoInsert = Omit<Agrupamento, 'id' | 'created_at' | 'updated_at'>
export type AgrupamentoUpdate = Partial<AgrupamentoInsert>

export type SolicitacaoStatus = 'pendente' | 'rejeitada' | 'separando' | 'entregue' | 'confirmada'
export type SolicitacaoPrioridade = 'baixa' | 'normal' | 'alta' | 'urgente'
export type JanelaEntrega = 'manha' | 'tarde'
export type TipoSolicitacao = 'entrada' | 'saida'
export type StatusItem = 'solicitado' | 'separado' | 'entregue' | 'em_falta'
export type TipoProduto = 'insumo' | 'produzido' | 'produto'
export type PerfilUsuario = 'solicitante' | 'conferente' | 'entregador' | 'admin'
export type TipoPraca = 'cozinha' | 'salao' | 'bar' | 'estoque' | 'limpeza' | 'escritorio' | 'geral'

// Tipos para Fichas Técnicas
export interface FichaTecnica {
  id: string
  nome: string
  descricao?: string
  categoria: CategoriaFicha
  tempo_preparo?: number
  rendimento?: number
  dificuldade?: DificuldadeFicha
  custo_estimado?: number
  observacoes?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface FichaTecnicaIngrediente {
  id: string
  ficha_tecnica_id: string
  produto_id: string
  quantidade: number
  unidade: string
  fator_correcao: number
  opcional: boolean
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface FichaTecnicaFoto {
  id: string
  ficha_tecnica_id: string
  url: string
  descricao?: string
  principal: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export interface FichaTecnicaPreparo {
  id: string
  ficha_tecnica_id: string
  passo: number
  descricao: string
  tempo_estimado?: number
  temperatura?: number
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface FichaTecnicaPraca {
  id: string
  ficha_tecnica_id: string
  praca_destino_id: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export type CategoriaFicha = 'prato' | 'bebida' | 'sobremesa' | 'entrada'
export type DificuldadeFicha = 'facil' | 'medio' | 'dificil'

export type FichaTecnicaInsert = Omit<FichaTecnica, 'id' | 'created_at' | 'updated_at'>
export type FichaTecnicaUpdate = Partial<FichaTecnicaInsert>
export type FichaTecnicaIngredienteInsert = Omit<FichaTecnicaIngrediente, 'id' | 'created_at' | 'updated_at'>
export type FichaTecnicaIngredienteUpdate = Partial<FichaTecnicaIngredienteInsert>
export type FichaTecnicaFotoInsert = Omit<FichaTecnicaFoto, 'id' | 'created_at' | 'updated_at'>
export type FichaTecnicaFotoUpdate = Partial<FichaTecnicaFotoInsert>
export type FichaTecnicaPreparoInsert = Omit<FichaTecnicaPreparo, 'id' | 'created_at' | 'updated_at'>
export type FichaTecnicaPreparoUpdate = Partial<FichaTecnicaPreparoInsert>
export type FichaTecnicaPracaInsert = Omit<FichaTecnicaPraca, 'id' | 'created_at' | 'updated_at'>
export type FichaTecnicaPracaUpdate = Partial<FichaTecnicaPracaInsert>

export interface FichaTecnicaCompleta extends FichaTecnica {
  ingredientes: (FichaTecnicaIngrediente & { produto: Produto })[]
  fotos: FichaTecnicaFoto[]
  preparo: FichaTecnicaPreparo[]
  pracas: (FichaTecnicaPraca & { praca_destino: PracaDestino })[]
}

export interface SolicitacaoCompleta extends Solicitacao {
  itens: ItemSolicitacao[]
  praca_destino: PracaDestino
  solicitante: Usuario
}

export interface ProdutoCompleto extends Produto {
  agrupamento?: Agrupamento
}

export interface ProdutoComAgrupamento {
  id: string
  produto_id: string
  descricao: string
  grupo: string
  subgrupo: string
  custo: number
  tipo: string
  agrupamento_id?: string
  agrupamento_descricao?: string
  agrupamento_ativo?: boolean
  created_at: string
  updated_at: string
}