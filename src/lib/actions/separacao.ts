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
      .select()
      .single() // Adicionado .single() para obter o item atualizado

    if (error) {
      throw new Error('Erro ao concluir separação: ' + error.message)
    }

    if (!data) {
      throw new Error('Item não encontrado')
    }

    // Após concluir a separação de um item, verificar o status da solicitação
    await checkAndSetSolicitacaoStatus(data.solicitacao_id)

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

async function checkAndSetSolicitacaoStatus(solicitacaoId: string) {
  try {
    const supabase = createServiceClient()

    // 1. Buscar todos os itens da solicitação
    const { data: itens, error: itensError } = await supabase
      .from('itens_solicitacao')
      .select('status_separacao')
      .eq('solicitacao_id', solicitacaoId)

    if (itensError) {
      throw new Error('Erro ao buscar itens da solicitação para verificação de status: ' + itensError.message)
    }

    if (!itens || itens.length === 0) {
      // Se não houver itens, não há o que verificar
      return
    }

    // 2. Verificar se todos os itens estão em status final (separado ou em_falta)
    const todosItensConcluidos = itens.every(item => 
      item.status_separacao === 'separado' || item.status_separacao === 'em_falta'
    )

    // 3. Se todos os itens estiverem concluídos, atualizar o status da solicitação para 'entregue'
    if (todosItensConcluidos) {
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({ status: 'entregue' })
        .eq('id', solicitacaoId)

      if (updateError) {
        throw new Error('Erro ao atualizar status da solicitação para entregue: ' + updateError.message)
      }
      revalidatePath('/solicitacoes') // Revalidar a página de solicitações
    }
  } catch (error) {
    console.error('Erro em checkAndSetSolicitacaoStatus:', error)
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
    
    // Contar solicitações pendentes e em separação
    const { count: pendenteCount, error: pendenteError } = await supabase
      .from('solicitacoes')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pendente', 'separando'])

    if (pendenteError) {
      throw new Error('Erro ao buscar solicitações pendentes: ' + pendenteError.message)
    }

    // Contar todas as solicitações (para o percentual de conclusão)
    const { count: totalSolicitacoesCount, error: totalError } = await supabase
      .from('solicitacoes')
      .select('id', { count: 'exact', head: true })

    if (totalError) {
      throw new Error('Erro ao buscar total de solicitações: ' + totalError.message)
    }

    const percentualConclusao = (totalSolicitacoesCount || 0) > 0 
      ? (((totalSolicitacoesCount || 0) - (pendenteCount || 0)) / (totalSolicitacoesCount || 0)) * 100
      : 0

    const estatisticas = {
      solicitacoesPendentes: pendenteCount || 0,
      percentualConclusao: parseFloat(percentualConclusao.toFixed(2))
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
    
    // Verificar se já existem movimentações para esta solicitação (evitar duplicatas)
    const { data: movimentacoesExistentes, error: checkError } = await supabase
      .from('movimento_estoque')
      .select('id')
      .eq('solicitacao_id', solicitacaoId)
      .limit(1)

    if (checkError) {
      throw new Error('Erro ao verificar movimentações existentes: ' + checkError.message)
    }

    if (movimentacoesExistentes && movimentacoesExistentes.length > 0) {
      throw new Error('Ajustes de estoque já foram aplicados para esta solicitação')
    }
    
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
      tipo_movimento: solicitacao.tipo === 'entrada' ? 'entrada' : 'saida',
      quantidade: item.quantidade_separada,
      solicitacao_id: solicitacaoId,
      observacoes: `Separação de solicitação - ${solicitacao.praca_destino?.nome}${item.observacoes_separacao ? ` | ${item.observacoes_separacao}` : ''}`
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

export async function verificarAjustesEstoqueAplicados(solicitacaoId: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('movimento_estoque')
      .select('id')
      .eq('solicitacao_id', solicitacaoId)
      .limit(1)

    if (error) {
      throw new Error('Erro ao verificar ajustes: ' + error.message)
    }

    return { 
      success: true, 
      data: { 
        ajustesAplicados: !!(data && data.length > 0) 
      } 
    }
  } catch (error) {
    console.error('Erro ao verificar ajustes de estoque:', error)
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