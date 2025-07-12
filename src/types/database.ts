export type Database = {
  public: {
    Tables: {
      solicitacoes: {
        Row: {
          id: string
          solicitante_id: string
          praca_destino_id: string
          status: 'pendente' | 'rejeitada' | 'separando' | 'entregue' | 'confirmada'
          prioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
          observacoes: string | null
          data_solicitacao: string
          janela_entrega: 'manha' | 'tarde'
          tipo: 'entrada' | 'saida'
          loja: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          solicitante_id: string
          praca_destino_id: string
          status?: 'pendente' | 'rejeitada' | 'separando' | 'entregue' | 'confirmada'
          prioridade?: 'baixa' | 'normal' | 'alta' | 'urgente'
          observacoes?: string | null
          data_solicitacao?: string
          janela_entrega: 'manha' | 'tarde'
          tipo: 'entrada' | 'saida'
          loja: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          solicitante_id?: string
          praca_destino_id?: string
          status?: 'pendente' | 'rejeitada' | 'separando' | 'entregue' | 'confirmada'
          prioridade?: 'baixa' | 'normal' | 'alta' | 'urgente'
          observacoes?: string | null
          data_solicitacao?: string
          janela_entrega?: 'manha' | 'tarde'
          tipo?: 'entrada' | 'saida'
          loja?: string
          created_at?: string
          updated_at?: string
        }
      }
      itens_solicitacao: {
        Row: {
          id: string
          solicitacao_id: string
          produto_id: string
          quantidade_solicitada: number
          quantidade_separada: number
          status: 'solicitado' | 'separado' | 'entregue' | 'em_falta'
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          solicitacao_id: string
          produto_id: string
          quantidade_solicitada: number
          quantidade_separada?: number
          status?: 'solicitado' | 'separado' | 'entregue' | 'em_falta'
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          solicitacao_id?: string
          produto_id?: string
          quantidade_solicitada?: number
          quantidade_separada?: number
          status?: 'solicitado' | 'separado' | 'entregue' | 'em_falta'
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      produtos: {
        Row: {
          id: string
          produto_id: string
          descricao: string
          grupo: string
          subgrupo: string
          custo: number
          tipo: 'insumo' | 'produzido' | 'produto'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          produto_id: string
          descricao: string
          grupo: string
          subgrupo: string
          custo: number
          tipo: 'insumo' | 'produzido' | 'produto'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          produto_id?: string
          descricao?: string
          grupo?: string
          subgrupo?: string
          custo?: number
          tipo?: 'insumo' | 'produzido' | 'produto'
          created_at?: string
          updated_at?: string
        }
      }
      pracas_destino: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          responsavel: string | null
          tipo: 'cozinha' | 'salao' | 'bar' | 'estoque' | 'limpeza' | 'escritorio' | 'geral'
          capacidade_maxima: number | null
          limite_produtos: number | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          responsavel?: string | null
          tipo?: 'cozinha' | 'salao' | 'bar' | 'estoque' | 'limpeza' | 'escritorio' | 'geral'
          capacidade_maxima?: number | null
          limite_produtos?: number | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          responsavel?: string | null
          tipo?: 'cozinha' | 'salao' | 'bar' | 'estoque' | 'limpeza' | 'escritorio' | 'geral'
          capacidade_maxima?: number | null
          limite_produtos?: number | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          email: string
          nome: string
          perfil: 'solicitante' | 'conferente' | 'entregador' | 'admin'
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nome: string
          perfil: 'solicitante' | 'conferente' | 'entregador' | 'admin'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          perfil?: 'solicitante' | 'conferente' | 'entregador' | 'admin'
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      movimento_estoque: {
        Row: {
          id: string
          produto_id: string
          tipo_movimento: 'entrada' | 'saida'
          quantidade: number
          solicitacao_id: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          produto_id: string
          tipo_movimento: 'entrada' | 'saida'
          quantidade: number
          solicitacao_id?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          produto_id?: string
          tipo_movimento?: 'entrada' | 'saida'
          quantidade?: number
          solicitacao_id?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}