'use server'

import { createServiceClient } from '@/lib/supabase'
import { separacaoSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function buscarSolicitacoesPendentes(
  filtro?: string,
  prioridade?: string,
  praca?: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    const supabase = createServiceClient()
    
    // Primeiro tentar usar a view otimizada
    let query = supabase
      .from('vw_separacao_dashboard')
      .select('*', { count: 'exact' })

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

    // Se a view não existir, usar query manual
    if (error && error.message.includes('relation "vw_separacao_dashboard" does not exist')) {
      console.log('View não existe, usando query manual...')
      
      let manualQuery = supabase
        .from('solicitacoes')
        .select(`
          id as solicitacao_id,
          created_at,
          prioridade,
          prioridade_calculada,
          status,
          observacoes,
          praca_destino:pracas_destino(nome, tipo),
          solicitante:usuarios(nome)
        `, { count: 'exact' })
        .in('status', ['pendente', 'separando'])

      if (filtro) {
        manualQuery = manualQuery.or(`praca_destino.nome.ilike.%${filtro}%,solicitante.nome.ilike.%${filtro}%`)
      }

      if (prioridade) {
        manualQuery = manualQuery.eq('prioridade', prioridade)
      }

      if (praca) {
        manualQuery = manualQuery.eq('praca_destino.nome', praca)
      }

      manualQuery = manualQuery
        .order('prioridade_calculada', { ascending: false })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1)

      const { data: manualData, error: manualError, count: manualCount } = await manualQuery

      if (manualError) {
        throw new Error('Erro ao buscar solicitações: ' + manualError.message)
      }

      // Transformar dados para o formato esperado
      const transformedData = manualData?.map((item: any) => ({
        solicitacao_id: item.solicitacao_id,
        created_at: item.created_at,
        prioridade: item.prioridade,
        prioridade_calculada: item.prioridade_calculada || 0,
        status: item.status,
        observacoes: item.observacoes,
        praca_destino: item.praca_destino?.nome || 'N/A',
        tipo_praca: item.praca_destino?.tipo || 'geral',
        solicitante: item.solicitante?.nome || 'N/A',
        total_itens: 0, // Será calculado depois
        itens_separados: 0,
        itens_em_falta: 0,
        itens_aguardando: 0,
        itens_separando: 0,
        iniciado_em: null,
        concluido_em: null,
        percentual_concluido: 0
      })) || []

      return {
        success: true,
        data: transformedData,
        total: manualCount || 0,
        totalPages: Math.ceil((manualCount || 0) / limit),
        currentPage: page
      }
    }

    if (error) {
      throw new Error('Erro ao buscar solicitações: ' + error.message)
    }

    return {
      success: true,
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Erro ao buscar solicitações pendentes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarDetalhesSeparacao(solicitacaoId: string) {
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
      .from('vw_separacao_detalhes')
      .select('*')
      .eq('solicitacao_id', solicitacaoId)

    if (itensError) {
      throw new Error('Erro ao buscar itens: ' + itensError.message)
    }

    return {
      success: true,
      data: {
        solicitacao,
        itens: itens || []
      }
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes da separação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function iniciarSeparacaoItem(itemId: string, usuarioId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('itens_solicitacao')
      .update({
        status_separacao: 'separando',
        separado_por_usuario_id: usuarioId,
        iniciado_separacao_em: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('status_separacao', 'aguardando') // Só permite iniciar se estiver aguardando
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao iniciar separação: ' + error.message)
    }

    if (!data) {
      throw new Error('Item não encontrado ou já em separação')
    }

    revalidatePath('/separacao')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao iniciar separação do item:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function concluirSeparacaoItem(formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const rawData = {
      item_id: formData.get('item_id') as string,
      quantidade_separada: parseFloat(formData.get('quantidade_separada') as string),
      status: formData.get('status') as string,
      observacoes: formData.get('observacoes') as string || undefined,
    }

    const validatedData = separacaoSchema.parse(rawData)

    const { data, error } = await supabase
      .from('itens_solicitacao')
      .update({
        quantidade_separada: validatedData.quantidade_separada,
        status_separacao: validatedData.status,
        observacoes_separacao: validatedData.observacoes,
        concluido_separacao_em: new Date().toISOString()
      })
      .eq('id', validatedData.item_id)
      .eq('status_separacao', 'separando') // Só permite concluir se estiver separando
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao concluir separação: ' + error.message)
    }

    if (!data) {
      throw new Error('Item não encontrado ou não está em separação')
    }

    revalidatePath('/separacao')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao concluir separação do item:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function cancelarSeparacaoItem(itemId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('itens_solicitacao')
      .update({
        status_separacao: 'aguardando',
        separado_por_usuario_id: null,
        iniciado_separacao_em: null,
        observacoes_separacao: null
      })
      .eq('id', itemId)
      .eq('status_separacao', 'separando')
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao cancelar separação: ' + error.message)
    }

    if (!data) {
      throw new Error('Item não encontrado ou não está em separação')
    }

    revalidatePath('/separacao')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao cancelar separação do item:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarEstatisticasSeparacao() {
  try {
    const supabase = createServiceClient()
    
    // Contar solicitações por status
    const { data: statusCounts, error: statusError } = await supabase
      .from('solicitacoes')
      .select('status')
      .in('status', ['pendente', 'separando', 'entregue'])

    if (statusError) {
      throw new Error('Erro ao buscar estatísticas: ' + statusError.message)
    }

    // Contar itens por status de separação
    const { data: itemCounts, error: itemError } = await supabase
      .from('itens_solicitacao')
      .select('status_separacao')
      .in('status_separacao', ['aguardando', 'separando', 'separado', 'em_falta'])

    if (itemError) {
      throw new Error('Erro ao buscar estatísticas de itens: ' + itemError.message)
    }

    // Tempo médio de separação nas últimas 24 horas
    const { data: tempoMedio, error: tempoError } = await supabase
      .from('itens_solicitacao')
      .select('iniciado_separacao_em, concluido_separacao_em')
      .not('iniciado_separacao_em', 'is', null)
      .not('concluido_separacao_em', 'is', null)
      .gte('concluido_separacao_em', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (tempoError) {
      throw new Error('Erro ao calcular tempo médio: ' + tempoError.message)
    }

    // Calcular tempo médio em minutos
    let tempoMedioMinutos = 0
    if (tempoMedio && tempoMedio.length > 0) {
      const tempos = tempoMedio.map(item => {
        const inicio = new Date(item.iniciado_separacao_em!).getTime()
        const fim = new Date(item.concluido_separacao_em!).getTime()
        return (fim - inicio) / 60000 // converter para minutos
      })
      tempoMedioMinutos = tempos.reduce((a, b) => a + b, 0) / tempos.length
    }

    const estatisticas = {
      solicitacoes: {
        pendentes: statusCounts.filter(s => s.status === 'pendente').length,
        separando: statusCounts.filter(s => s.status === 'separando').length,
        entregues: statusCounts.filter(s => s.status === 'entregue').length,
        total: statusCounts.length
      },
      itens: {
        aguardando: itemCounts.filter(i => i.status_separacao === 'aguardando').length,
        separando: itemCounts.filter(i => i.status_separacao === 'separando').length,
        separados: itemCounts.filter(i => i.status_separacao === 'separado').length,
        em_falta: itemCounts.filter(i => i.status_separacao === 'em_falta').length,
        total: itemCounts.length
      },
      tempoMedioMinutos: Math.round(tempoMedioMinutos)
    }

    return { success: true, data: estatisticas }
  } catch (error) {
    console.error('Erro ao buscar estatísticas de separação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarItensEmSeparacao(usuarioId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('vw_separacao_detalhes')
      .select('*')
      .eq('separado_por_usuario_id', usuarioId)
      .eq('status_separacao', 'separando')
      .order('iniciado_separacao_em', { ascending: true })

    if (error) {
      throw new Error('Erro ao buscar itens em separação: ' + error.message)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar itens em separação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarHistoricoSeparacao(
  usuarioId?: string,
  dataInicio?: string,
  dataFim?: string,
  page: number = 1,
  limit: number = 50
) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('vw_separacao_detalhes')
      .select('*', { count: 'exact' })
      .in('status_separacao', ['separado', 'em_falta'])

    if (usuarioId) {
      query = query.eq('separado_por_usuario_id', usuarioId)
    }

    if (dataInicio) {
      query = query.gte('concluido_separacao_em', dataInicio)
    }

    if (dataFim) {
      query = query.lte('concluido_separacao_em', dataFim)
    }

    const offset = (page - 1) * limit
    query = query
      .order('concluido_separacao_em', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error('Erro ao buscar histórico: ' + error.message)
    }

    return {
      success: true,
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Erro ao buscar histórico de separação:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function aplicarAjustesEstoque(solicitacaoId: string) {
  try {
    const supabase = createServiceClient()
    
    // Buscar dados da solicitação para pegar informações da praça
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        praca_destino:pracas_destino(*)
      `)
      .eq('id', solicitacaoId)
      .single()

    if (solicitacaoError) {
      throw new Error('Erro ao buscar solicitação: ' + solicitacaoError.message)
    }

    // Buscar itens separados da solicitação
    const { data: itens, error: itensError } = await supabase
      .from('itens_solicitacao')
      .select('*')
      .eq('solicitacao_id', solicitacaoId)
      .eq('status_separacao', 'separado')

    if (itensError) {
      throw new Error('Erro ao buscar itens: ' + itensError.message)
    }

    if (!itens || itens.length === 0) {
      return { success: true, data: { ajustes: 0 } }
    }

    // Criar movimentações de estoque para cada item separado
    const movimentacoes = itens.map(item => ({
      produto_id: item.produto_id,
      tipo: solicitacao.tipo === 'entrada' ? 'entrada' : 'saida',
      quantidade: item.quantidade_separada,
      motivo: `Separação de solicitação - ${solicitacao.praca_destino?.nome}`,
      referencia_id: solicitacaoId,
      referencia_tipo: 'solicitacao',
      usuario_id: item.separado_por_usuario_id,
      observacoes: item.observacoes_separacao
    }))

    const { data: movimentacoesData, error: movError } = await supabase
      .from('movimento_estoque')
      .insert(movimentacoes)
      .select()

    if (movError) {
      throw new Error('Erro ao criar movimentações: ' + movError.message)
    }

    // Atualizar status da solicitação para indicar que ajustes foram aplicados
    const { error: updateError } = await supabase
      .from('solicitacoes')
      .update({ 
        status: 'confirmada',
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitacaoId)

    if (updateError) {
      console.warn('Erro ao atualizar status da solicitação:', updateError.message)
    }

    revalidatePath('/separacao')
    revalidatePath('/solicitacoes')
    
    return { 
      success: true, 
      data: { 
        ajustes: movimentacoesData.length,
        movimentacoes: movimentacoesData,
        tipo_movimento: solicitacao.tipo
      } 
    }
  } catch (error) {
    console.error('Erro ao aplicar ajustes de estoque:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarMovimentosPorSolicitacao(solicitacaoId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('movimento_estoque')
      .select(`
        *,
        produto:produtos(*),
        usuario:usuarios(*)
      `)
      .eq('referencia_id', solicitacaoId)
      .eq('referencia_tipo', 'solicitacao')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Erro ao buscar movimentações: ' + error.message)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function calcularImpactoEstoque(solicitacaoId: string) {
  try {
    const supabase = createServiceClient()
    
    // Buscar itens separados da solicitação
    const { data: itens, error: itensError } = await supabase
      .from('itens_solicitacao')
      .select(`
        *,
        produto:produtos(*)
      `)
      .eq('solicitacao_id', solicitacaoId)
      .eq('status_separacao', 'separado')

    if (itensError) {
      throw new Error('Erro ao buscar itens: ' + itensError.message)
    }

    if (!itens || itens.length === 0) {
      return { success: true, data: { produtos: [], total_produtos: 0, valor_total: 0 } }
    }

    // Calcular impacto por produto
    const impacto = itens.map(item => {
      const valorUnitario = item.produto?.custo || 0
      const valorTotal = valorUnitario * item.quantidade_separada
      
      return {
        produto_id: item.produto_id,
        produto_descricao: item.produto?.descricao,
        quantidade_separada: item.quantidade_separada,
        valor_unitario: valorUnitario,
        valor_total: valorTotal
      }
    })

    const valorTotalGeral = impacto.reduce((total, item) => total + item.valor_total, 0)

    return {
      success: true,
      data: {
        produtos: impacto,
        total_produtos: itens.length,
        valor_total: valorTotalGeral
      }
    }
  } catch (error) {
    console.error('Erro ao calcular impacto no estoque:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}