'use server'

import { createServiceClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function buscarSolicitacoesParaEntrega(
  filtro?: string,
  prioridade?: string,
  praca?: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('vw_entrega_dashboard')
      .select('*', { count: 'exact' })
      .eq('status', 'separado') // Só solicitações prontas para entrega

    if (filtro) {
      query = query.or(`praca_destino.ilike.%${filtro}%,solicitante.ilike.%${filtro}%`)
    }

    if (prioridade) {
      query = query.eq('prioridade', prioridade)
    }

    if (praca) {
      query = query.eq('praca_destino', praca)
    }

    const offset = (page - 1) * limit
    query = query
      .order('prioridade_calculada', { ascending: false })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.warn('Erro na view, usando query manual:', error.message)
      
      // Fallback query manual
      let fallbackQuery = supabase
        .from('solicitacoes')
        .select(`
          id as solicitacao_id,
          created_at,
          prioridade,
          prioridade_calculada,
          status,
          observacoes,
          praca_destino:pracas_destino(nome, tipo, responsavel),
          solicitante:usuarios(nome)
        `, { count: 'exact' })
        .eq('status', 'separado')

      if (filtro) {
        fallbackQuery = fallbackQuery.or(`praca_destino.nome.ilike.%${filtro}%,solicitante.nome.ilike.%${filtro}%`)
      }

      if (prioridade) {
        fallbackQuery = fallbackQuery.eq('prioridade', prioridade)
      }

      fallbackQuery = fallbackQuery
        .order('prioridade_calculada', { ascending: false })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1)

      const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery

      if (fallbackError) {
        throw new Error('Erro ao buscar solicitações: ' + fallbackError.message)
      }

      const transformedData = fallbackData?.map((item: any) => ({
        solicitacao_id: item.solicitacao_id,
        created_at: item.created_at,
        prioridade: item.prioridade,
        prioridade_calculada: item.prioridade_calculada || 0,
        status: item.status,
        observacoes: item.observacoes,
        praca_destino: item.praca_destino?.nome || 'N/A',
        tipo_praca: item.praca_destino?.tipo || 'geral',
        responsavel_praca: item.praca_destino?.responsavel || '',
        solicitante: item.solicitante?.nome || 'N/A',
        total_itens: 0,
        itens_entregues: 0,
        itens_nao_entregues: 0,
        itens_aguardando: 0,
        itens_em_entrega: 0,
        iniciado_entrega_em: null,
        concluido_entrega_em: null,
        percentual_entregue: 0,
        minutos_desde_separacao: 0
      })) || []

      return {
        success: true,
        data: transformedData,
        total: fallbackCount || 0,
        totalPages: Math.ceil((fallbackCount || 0) / limit),
        currentPage: page
      }
    }

    return {
      success: true,
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Erro ao buscar solicitações para entrega:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarDetalhesEntrega(solicitacaoId: string) {
  try {
    const supabase = createServiceClient()
    
    // Buscar dados da solicitação
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        praca_destino:pracas_destino(*),
        solicitante:usuarios(*)
      `)
      .eq('id', solicitacaoId)
      .single()

    if (solicitacaoError) {
      throw new Error('Erro ao buscar solicitação: ' + solicitacaoError.message)
    }

    // Buscar itens da solicitação
    const { data: itens, error: itensError } = await supabase
      .from('vw_entrega_detalhes')
      .select('*')
      .eq('solicitacao_id', solicitacaoId)

    if (itensError) {
      // Fallback para busca manual
      const { data: itensFallback, error: fallbackError } = await supabase
        .from('itens_solicitacao')
        .select(`
          *,
          produto:produtos(*),
          entregue_por:usuarios(*)
        `)
        .eq('solicitacao_id', solicitacaoId)
        .eq('status_separacao', 'separado')

      if (fallbackError) {
        throw new Error('Erro ao buscar itens: ' + fallbackError.message)
      }

      return {
        success: true,
        data: {
          solicitacao,
          itens: itensFallback || []
        }
      }
    }

    return {
      success: true,
      data: {
        solicitacao,
        itens: itens || []
      }
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes da entrega:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function iniciarEntregaSolicitacao(solicitacaoId: string, usuarioId: string) {
  try {
    const supabase = createServiceClient()
    
    // Verificar se a solicitação está pronta para entrega
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .select('status')
      .eq('id', solicitacaoId)
      .single()

    if (solicitacaoError) {
      throw new Error('Erro ao verificar solicitação: ' + solicitacaoError.message)
    }

    if (solicitacao.status !== 'separado') {
      throw new Error('Solicitação não está pronta para entrega')
    }

    // Iniciar entrega: atualizar status da solicitação
    const { error: updateError } = await supabase
      .from('solicitacoes')
      .update({ 
        status: 'em_entrega',
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitacaoId)

    if (updateError) {
      throw new Error('Erro ao iniciar entrega: ' + updateError.message)
    }

    revalidatePath('/entrega')
    return { success: true }
  } catch (error) {
    console.error('Erro ao iniciar entrega da solicitação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function confirmarEntregaItem(formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const rawData = {
      item_id: formData.get('item_id') as string,
      status_entrega: formData.get('status_entrega') as string,
      observacoes_entrega: formData.get('observacoes_entrega') as string || undefined,
      usuario_id: formData.get('usuario_id') as string,
    }

    // Validar dados
    if (!rawData.item_id || !rawData.status_entrega || !rawData.usuario_id) {
      throw new Error('Dados obrigatórios não fornecidos')
    }

    if (!['entregue', 'nao_entregue'].includes(rawData.status_entrega)) {
      throw new Error('Status de entrega inválido')
    }

    const updateData: any = {
      status_entrega: rawData.status_entrega,
      entregue_por_usuario_id: rawData.usuario_id,
      concluido_entrega_em: new Date().toISOString()
    }

    if (rawData.observacoes_entrega) {
      updateData.observacoes_entrega = rawData.observacoes_entrega
    }

    const { data, error } = await supabase
      .from('itens_solicitacao')
      .update(updateData)
      .eq('id', rawData.item_id)
      .eq('status_separacao', 'separado') // Só permite entregar itens separados
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao confirmar entrega: ' + error.message)
    }

    if (!data) {
      throw new Error('Item não encontrado ou não está pronto para entrega')
    }

    revalidatePath('/entrega')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao confirmar entrega do item:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function finalizarEntregaSolicitacao(solicitacaoId: string) {
  try {
    const supabase = createServiceClient()
    
    // Verificar se todos os itens foram processados
    const { data: itens, error: itensError } = await supabase
      .from('itens_solicitacao')
      .select('status_entrega')
      .eq('solicitacao_id', solicitacaoId)
      .eq('status_separacao', 'separado')

    if (itensError) {
      throw new Error('Erro ao verificar itens: ' + itensError.message)
    }

    const itensNaoProcessados = itens.filter(item => 
      item.status_entrega === 'aguardando' || item.status_entrega === 'em_entrega'
    )

    if (itensNaoProcessados.length > 0) {
      throw new Error(`${itensNaoProcessados.length} itens ainda não foram processados`)
    }

    // Determinar status final baseado nos resultados
    const itensEntregues = itens.filter(item => item.status_entrega === 'entregue').length
    const totalItens = itens.length
    
    const statusFinal = itensEntregues === totalItens ? 'entregue' : 'parcialmente_entregue'

    // Atualizar status da solicitação
    const { error: updateError } = await supabase
      .from('solicitacoes')
      .update({ 
        status: statusFinal,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitacaoId)

    if (updateError) {
      throw new Error('Erro ao finalizar entrega: ' + updateError.message)
    }

    revalidatePath('/entrega')
    return { 
      success: true, 
      data: { 
        statusFinal,
        itensEntregues,
        totalItens 
      } 
    }
  } catch (error) {
    console.error('Erro ao finalizar entrega:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarEstatisticasEntrega() {
  try {
    const supabase = createServiceClient()
    
    // Usar função SQL criada na migration
    const { data: stats, error } = await supabase
      .rpc('obter_estatisticas_entrega')

    if (error) {
      // Fallback para consultas manuais
      const [
        { count: prontas },
        { count: emEntrega }, 
        { count: entreguesHoje },
        { count: itensAguardando },
        { count: itensEmEntrega }
      ] = await Promise.all([
        supabase.from('solicitacoes').select('id', { count: 'exact', head: true }).eq('status', 'separado'),
        supabase.from('solicitacoes').select('id', { count: 'exact', head: true }).eq('status', 'em_entrega'),
        supabase.from('solicitacoes').select('id', { count: 'exact', head: true })
          .in('status', ['entregue', 'parcialmente_entregue'])
          .gte('updated_at', new Date().toISOString().split('T')[0]),
        supabase.from('itens_solicitacao').select('id', { count: 'exact', head: true })
          .eq('status_entrega', 'aguardando')
          .eq('status_separacao', 'separado'),
        supabase.from('itens_solicitacao').select('id', { count: 'exact', head: true })
          .eq('status_entrega', 'em_entrega')
      ])

      return {
        success: true,
        data: {
          solicitacoes_prontas: prontas || 0,
          solicitacoes_em_entrega: emEntrega || 0,
          solicitacoes_entregues_hoje: entreguesHoje || 0,
          itens_aguardando: itensAguardando || 0,
          itens_em_entrega: itensEmEntrega || 0,
          tempo_medio_entrega: 0
        }
      }
    }

    return { 
      success: true, 
      data: stats?.[0] || {
        solicitacoes_prontas: 0,
        solicitacoes_em_entrega: 0,
        solicitacoes_entregues_hoje: 0,
        itens_aguardando: 0,
        itens_em_entrega: 0,
        tempo_medio_entrega: 0
      }
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas de entrega:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarItensEmEntrega(usuarioId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('vw_entrega_detalhes')
      .select('*')
      .eq('entregue_por_usuario_id', usuarioId)
      .eq('status_entrega', 'em_entrega')
      .order('iniciado_entrega_em', { ascending: true })

    if (error) {
      // Fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('itens_solicitacao')
        .select(`
          *,
          produto:produtos(*),
          solicitacao:solicitacoes(
            *,
            praca_destino:pracas_destino(*)
          )
        `)
        .eq('entregue_por_usuario_id', usuarioId)
        .eq('status_entrega', 'em_entrega')
        .order('iniciado_entrega_em', { ascending: true })

      if (fallbackError) {
        throw new Error('Erro ao buscar itens em entrega: ' + fallbackError.message)
      }

      return { success: true, data: fallbackData || [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar itens em entrega:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function cancelarEntregaSolicitacao(solicitacaoId: string) {
  try {
    const supabase = createServiceClient()
    
    // Resetar status da solicitação para separado
    const { error: updateSolicitacaoError } = await supabase
      .from('solicitacoes')
      .update({ 
        status: 'separado',
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitacaoId)
      .eq('status', 'em_entrega')

    if (updateSolicitacaoError) {
      throw new Error('Erro ao cancelar entrega: ' + updateSolicitacaoError.message)
    }

    // Resetar status dos itens que estavam em entrega
    const { error: updateItensError } = await supabase
      .from('itens_solicitacao')
      .update({
        status_entrega: 'aguardando',
        entregue_por_usuario_id: null,
        iniciado_entrega_em: null,
        observacoes_entrega: null
      })
      .eq('solicitacao_id', solicitacaoId)
      .eq('status_entrega', 'em_entrega')

    if (updateItensError) {
      throw new Error('Erro ao resetar itens: ' + updateItensError.message)
    }

    revalidatePath('/entrega')
    return { success: true }
  } catch (error) {
    console.error('Erro ao cancelar entrega:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}