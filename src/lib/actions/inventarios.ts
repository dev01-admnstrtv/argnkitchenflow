'use server'

import { createServiceClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// ========================================
// TIPOS PARA INVENTÁRIOS
// ========================================

export interface InventarioData {
  id: string
  numero_inventario: string
  praca_id: string
  praca_nome: string
  data_contagem: string
  responsavel: string
  status: 'em_andamento' | 'finalizado'
  observacoes?: string
  total_itens: number
  quantidade_total: number
  quantidade_em_uso_total: number
  created_at: string
  updated_at: string
  finalizado_at?: string
}

export interface InventarioItemData {
  id: string
  inventario_id: string
  produto_id: string
  codigo_produto: string
  produto_descricao: string
  produto_grupo: string
  produto_subgrupo: string
  produto_tipo: string
  produto_custo: number
  quantidade: number
  quantidade_em_uso?: number
  created_at: string
  updated_at: string
}

// ========================================
// FUNÇÕES PARA INVENTÁRIOS
// ========================================

export async function buscarInventarios(search?: string, status?: string, page: number = 1, limit: number = 20) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('vw_inventarios_completos')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(`numero_inventario.ilike.%${search}%,praca_nome.ilike.%${search}%,responsavel.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error('Erro ao buscar inventários: ' + error.message)
    }

    return { 
      success: true, 
      data: data || [], 
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Erro ao buscar inventários:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarInventarioPorId(id: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('vw_inventarios_completos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error('Erro ao buscar inventário: ' + error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar inventário:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function criarInventario(formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    // Gerar número do inventário
    const { data: numeroInventario, error: numeroError } = await supabase
      .rpc('gerar_numero_inventario')

    if (numeroError) {
      throw new Error('Erro ao gerar número do inventário: ' + numeroError.message)
    }

    const inventarioData = {
      numero_inventario: numeroInventario,
      praca_id: formData.get('praca_id') as string,
      data_contagem: formData.get('data_contagem') as string,
      responsavel: formData.get('responsavel') as string,
      observacoes: formData.get('observacoes') as string || null,
      status: 'em_andamento' as const
    }

    const { data, error } = await supabase
      .from('inventarios')
      .insert(inventarioData)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao criar inventário: ' + error.message)
    }

    revalidatePath('/inventarios')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar inventário:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function atualizarInventario(id: string, formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const inventarioData = {
      praca_id: formData.get('praca_id') as string,
      data_contagem: formData.get('data_contagem') as string,
      responsavel: formData.get('responsavel') as string,
      observacoes: formData.get('observacoes') as string || null,
    }

    const { data, error } = await supabase
      .from('inventarios')
      .update(inventarioData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao atualizar inventário: ' + error.message)
    }

    revalidatePath('/inventarios')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar inventário:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function finalizarInventario(id: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('inventarios')
      .update({ status: 'finalizado' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao finalizar inventário: ' + error.message)
    }

    revalidatePath('/inventarios')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao finalizar inventário:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function deletarInventario(id: string) {
  try {
    const supabase = createServiceClient()
    
    // Verificar se o inventário pode ser deletado (só se estiver em andamento)
    const { data: inventario, error: checkError } = await supabase
      .from('inventarios')
      .select('status')
      .eq('id', id)
      .single()

    if (checkError) {
      throw new Error('Erro ao verificar inventário: ' + checkError.message)
    }

    if (inventario.status === 'finalizado') {
      throw new Error('Não é possível excluir inventário finalizado')
    }

    const { error } = await supabase
      .from('inventarios')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Erro ao deletar inventário: ' + error.message)
    }

    revalidatePath('/inventarios')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar inventário:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

// ========================================
// FUNÇÕES PARA ITENS DO INVENTÁRIO
// ========================================

export async function buscarItensInventario(inventarioId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('vw_inventario_itens_completos')
      .select('*')
      .eq('inventario_id', inventarioId)
      .order('produto_descricao', { ascending: true })

    if (error) {
      throw new Error('Erro ao buscar itens do inventário: ' + error.message)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar itens do inventário:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function adicionarItemInventario(formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const itemData = {
      inventario_id: formData.get('inventario_id') as string,
      produto_id: formData.get('produto_id') as string,
      quantidade: parseFloat(formData.get('quantidade') as string) || 0,
      quantidade_em_uso: parseFloat(formData.get('quantidade_em_uso') as string) || 0,
    }

    const { data, error } = await supabase
      .from('inventario_itens')
      .insert(itemData)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao adicionar item: ' + error.message)
    }

    revalidatePath('/inventarios')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao adicionar item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function atualizarItemInventario(id: string, formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const itemData = {
      quantidade: parseFloat(formData.get('quantidade') as string) || 0,
      quantidade_em_uso: parseFloat(formData.get('quantidade_em_uso') as string) || 0,
    }

    const { data, error } = await supabase
      .from('inventario_itens')
      .update(itemData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao atualizar item: ' + error.message)
    }

    revalidatePath('/inventarios')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function deletarItemInventario(id: string) {
  try {
    const supabase = createServiceClient()
    
    const { error } = await supabase
      .from('inventario_itens')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Erro ao deletar item: ' + error.message)
    }

    revalidatePath('/inventarios')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar item:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

export async function buscarPracas() {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('pracas_destino')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      throw new Error('Erro ao buscar praças: ' + error.message)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar praças:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarProdutosParaInventario(search?: string) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('produtos')
      .select('id, produto_id, descricao, grupo, subgrupo, tipo')

    if (search) {
      query = query.or(`descricao.ilike.%${search}%,produto_id.ilike.%${search}%`)
    }

    query = query
      .order('descricao', { ascending: true })
      .limit(20)

    const { data, error } = await query

    if (error) {
      throw new Error('Erro ao buscar produtos: ' + error.message)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}