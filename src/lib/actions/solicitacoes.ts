'use server'

import { createServiceClient } from '@/lib/supabase'
import { solicitacaoSchema } from '@/lib/validations'
import { getJanelaEntrega } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export async function criarSolicitacao(formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    // Validar dados do formulário
    const rawData = {
      praca_destino_id: formData.get('praca_destino_id') as string,
      solicitante: formData.get('solicitante') as string,
      prioridade: formData.get('prioridade') as string,
      observacoes: formData.get('observacoes') as string,
      tipo: formData.get('tipo') as string,
      data_entrega: formData.get('data_entrega') as string,
      janela_entrega: formData.get('janela_entrega') as string,
      itens: JSON.parse(formData.get('itens') as string || '[]'),
    }

    const validatedData = solicitacaoSchema.parse(rawData)
    
    // Usar usuário padrão temporariamente (sem autenticação)
    const usuarioId = '0f4a00bb-a9fd-4e00-ad29-f6e2bf1b4d47' // ID do usuário existente

    // Criar solicitação
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .insert({
        solicitante_id: usuarioId,
        solicitante: validatedData.solicitante,
        praca_destino_id: validatedData.praca_destino_id,
        prioridade: validatedData.prioridade,
        observacoes: validatedData.observacoes,
        tipo: validatedData.tipo,
        data_entrega: validatedData.data_entrega,
        janela_entrega: validatedData.janela_entrega,
        loja: 'Aragon',
      })
      .select()
      .single()

    if (solicitacaoError) {
      throw new Error('Erro ao criar solicitação: ' + solicitacaoError.message)
    }

    // Criar itens da solicitação
    const itensData = validatedData.itens.map(item => ({
      solicitacao_id: solicitacao.id,
      produto_id: item.produto_id,
      quantidade_solicitada: item.quantidade_solicitada,
      observacoes: item.observacoes,
    }))

    const { error: itensError } = await supabase
      .from('itens_solicitacao')
      .insert(itensData)

    if (itensError) {
      throw new Error('Erro ao criar itens da solicitação: ' + itensError.message)
    }

    revalidatePath('/solicitacoes')
    return { success: true, id: solicitacao.id }
  } catch (error) {
    console.error('Erro ao criar solicitação:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarSolicitacoes(usuarioId?: string, page: number = 1, limit: number = 30) {
  try {
    const supabase = createServiceClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('solicitacoes')
      .select(`
        *,
        praca_destino:pracas_destino(*),
        solicitante,
        itens:itens_solicitacao(
          *,
          produto:produtos(*)
        )
      `)
      .order('data_entrega', { ascending: false })
      .range(from, to)

    if (usuarioId) {
      query = query.eq('solicitante_id', usuarioId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Erro ao buscar solicitações: ' + error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarSolicitacaoPorId(id: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        praca_destino:pracas_destino(*),
        solicitante,
        itens:itens_solicitacao(
          *,
          produto:produtos(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error('Erro ao buscar solicitação: ' + error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function atualizarStatusSolicitacao(id: string, novoStatus: string) {
  try {
    const supabase = createServiceClient()
    
    const { error } = await supabase
      .from('solicitacoes')
      .update({ status: novoStatus })
      .eq('id', id)

    if (error) {
      throw new Error('Erro ao atualizar status: ' + error.message)
    }

    revalidatePath('/solicitacoes')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function atualizarSolicitacao(id: string, formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    // Validar dados do formulário
    const rawData = {
      praca_destino_id: formData.get('praca_destino_id') as string,
      prioridade: formData.get('prioridade') as string,
      observacoes: formData.get('observacoes') as string,
      tipo: formData.get('tipo') as string,
      data_entrega: formData.get('data_entrega') as string,
      janela_entrega: formData.get('janela_entrega') as string,
      itens: JSON.parse(formData.get('itens') as string || '[]'),
    }

    const validatedData = solicitacaoSchema.parse(rawData)
    
    // Verificar se a solicitação pode ser editada
    const { data: solicitacao, error: fetchError } = await supabase
      .from('solicitacoes')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error('Erro ao buscar solicitação: ' + fetchError.message)
    }

    if (solicitacao.status !== 'pendente') {
      throw new Error('Não é possível editar solicitação que não está pendente')
    }

    // Atualizar solicitação
    const { error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .update({
        praca_destino_id: validatedData.praca_destino_id,
        prioridade: validatedData.prioridade,
        observacoes: validatedData.observacoes,
        tipo: validatedData.tipo,
        data_entrega: validatedData.data_entrega,
        janela_entrega: validatedData.janela_entrega,
      })
      .eq('id', id)

    if (solicitacaoError) {
      throw new Error('Erro ao atualizar solicitação: ' + solicitacaoError.message)
    }

    // Deletar itens existentes
    const { error: deleteError } = await supabase
      .from('itens_solicitacao')
      .delete()
      .eq('solicitacao_id', id)

    if (deleteError) {
      throw new Error('Erro ao deletar itens existentes: ' + deleteError.message)
    }

    // Criar novos itens da solicitação
    const itensData = validatedData.itens.map(item => ({
      solicitacao_id: id,
      produto_id: item.produto_id,
      quantidade_solicitada: item.quantidade_solicitada,
      observacoes: item.observacoes,
    }))

    const { error: itensError } = await supabase
      .from('itens_solicitacao')
      .insert(itensData)

    if (itensError) {
      throw new Error('Erro ao criar novos itens da solicitação: ' + itensError.message)
    }

    revalidatePath('/solicitacoes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar solicitação:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function deletarSolicitacao(id: string) {
  try {
    const supabase = createServiceClient()
    
    // Verificar se a solicitação pode ser deletada
    const { data: solicitacao, error: fetchError } = await supabase
      .from('solicitacoes')
      .select(`
        status,
        itens:itens_solicitacao(status_separacao)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error('Erro ao buscar solicitação: ' + fetchError.message)
    }

    // Verificar se todos os itens estão no status 'aguardando'
    const todosItensPendentes = solicitacao.itens.every(
      (item: any) => item.status_separacao === 'aguardando'
    )

    if (!todosItensPendentes) {
      throw new Error('Não é possível deletar solicitação que possui itens fora do status "Aguardando"')
    }

    const { error } = await supabase
      .from('solicitacoes')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Erro ao deletar solicitação: ' + error.message)
    }

    revalidatePath('/solicitacoes')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar solicitação:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function getDailySolicitacoesStats() {
  try {
    const supabase = createServiceClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Solicitações de hoje
    const { count: todayCount, error: todayError } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (todayError) throw new Error(todayError.message);

    // Solicitações de ontem
    const { count: yesterdayCount, error: yesterdayError } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    if (yesterdayError) throw new Error(yesterdayError.message);

    const variation = yesterdayCount && yesterdayCount > 0 
      ? ((todayCount || 0) - yesterdayCount) / yesterdayCount * 100 
      : (todayCount || 0) > 0 ? 100 : 0; // Se ontem foi 0 e hoje > 0, variação de 100%

    return { 
      success: true, 
      data: { 
        today: todayCount || 0, 
        variation: parseFloat(variation.toFixed(2)) 
      } 
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas diárias de solicitações:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
