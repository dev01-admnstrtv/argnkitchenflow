'use server'

import { createServiceClient } from '@/lib/supabase'
import { pracaDestinoSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function buscarPracas(search?: string, tipo?: string, ativo?: boolean, page: number = 1, limit: number = 20) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('pracas_destino')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(`nome.ilike.%${search}%,descricao.ilike.%${search}%,responsavel.ilike.%${search}%`)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo)
    }

    const offset = (page - 1) * limit
    query = query
      .order('nome', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error('Erro ao buscar praças: ' + error.message)
    }

    return { 
      success: true, 
      data: data || [], 
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Erro ao buscar praças:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarPracasDestino() {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('pracas_destino')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      throw new Error('Erro ao buscar praças de destino: ' + error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar praças de destino:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarPracaPorId(id: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('pracas_destino')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error('Erro ao buscar praça: ' + error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar praça:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function criarPraca(formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const rawData = {
      nome: formData.get('nome') as string,
      descricao: formData.get('descricao') as string || undefined,
      responsavel: formData.get('responsavel') as string || undefined,
      tipo: formData.get('tipo') as string,
      capacidade_maxima: formData.get('capacidade_maxima') ? parseInt(formData.get('capacidade_maxima') as string) : null,
      limite_produtos: formData.get('limite_produtos') ? parseInt(formData.get('limite_produtos') as string) : null,
      ativo: formData.get('ativo') === 'true',
    }

    const validatedData = pracaDestinoSchema.parse(rawData)

    const { data, error } = await supabase
      .from('pracas_destino')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao criar praça: ' + error.message)
    }

    revalidatePath('/pracas')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar praça:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function atualizarPraca(id: string, formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const rawData = {
      nome: formData.get('nome') as string,
      descricao: formData.get('descricao') as string || undefined,
      responsavel: formData.get('responsavel') as string || undefined,
      tipo: formData.get('tipo') as string,
      capacidade_maxima: formData.get('capacidade_maxima') ? parseInt(formData.get('capacidade_maxima') as string) : null,
      limite_produtos: formData.get('limite_produtos') ? parseInt(formData.get('limite_produtos') as string) : null,
      ativo: formData.get('ativo') === 'true',
    }

    const validatedData = pracaDestinoSchema.parse(rawData)

    const { data, error } = await supabase
      .from('pracas_destino')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao atualizar praça: ' + error.message)
    }

    revalidatePath('/pracas')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar praça:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function alternarStatusPraca(id: string) {
  try {
    const supabase = createServiceClient()
    
    // Buscar praça atual
    const { data: praca, error: fetchError } = await supabase
      .from('pracas_destino')
      .select('ativo')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error('Erro ao buscar praça: ' + fetchError.message)
    }

    // Se tentando desativar, verificar se há solicitações pendentes
    if (praca.ativo) {
      const { data: solicitacoesPendentes, error: solicitacoesError } = await supabase
        .from('solicitacoes')
        .select('id')
        .eq('praca_destino_id', id)
        .in('status', ['pendente', 'separando'])

      if (solicitacoesError) {
        throw new Error('Erro ao verificar solicitações: ' + solicitacoesError.message)
      }

      if (solicitacoesPendentes && solicitacoesPendentes.length > 0) {
        throw new Error('Não é possível desativar praça com solicitações pendentes')
      }
    }

    const { data, error } = await supabase
      .from('pracas_destino')
      .update({ ativo: !praca.ativo })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao alterar status: ' + error.message)
    }

    revalidatePath('/pracas')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao alterar status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarEstatisticasPraca(id: string) {
  try {
    const supabase = createServiceClient()
    
    // Contar solicitações por status
    const { data: solicitacoes, error: solicitacoesError } = await supabase
      .from('solicitacoes')
      .select('status, created_at')
      .eq('praca_destino_id', id)

    if (solicitacoesError) {
      throw new Error('Erro ao buscar estatísticas: ' + solicitacoesError.message)
    }

    const estatisticas = {
      total: solicitacoes.length,
      pendentes: solicitacoes.filter(s => s.status === 'pendente').length,
      separando: solicitacoes.filter(s => s.status === 'separando').length,
      entregues: solicitacoes.filter(s => s.status === 'entregue').length,
      confirmadas: solicitacoes.filter(s => s.status === 'confirmada').length,
      ultimaSolicitacao: solicitacoes.length > 0 ? 
        Math.max(...solicitacoes.map(s => new Date(s.created_at).getTime())) : null
    }

    return { success: true, data: estatisticas }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarSolicitacoesPorPraca(
  id: string, 
  status?: string,
  prioridade?: string,
  dataInicio?: string,
  dataFim?: string,
  page: number = 1, 
  limit: number = 20
) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('solicitacoes')
      .select(`
        *,
        solicitante:usuarios(*),
        praca_destino:pracas_destino(*),
        itens_solicitacao(
          *,
          produto:produtos(*)
        )
      `, { count: 'exact' })
      .eq('praca_destino_id', id)

    if (status) {
      query = query.eq('status', status)
    }

    if (prioridade) {
      query = query.eq('prioridade', prioridade)
    }

    if (dataInicio) {
      query = query.gte('created_at', dataInicio)
    }

    if (dataFim) {
      query = query.lte('created_at', dataFim)
    }

    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

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
    console.error('Erro ao buscar solicitações da praça:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarHistoricoSolicitacoesPorPraca(
  pracaId: string,
  status?: string,
  prioridade?: string,
  dataInicio?: string,
  dataFim?: string,
  page: number = 1,
  limit: number = 50
) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('solicitacoes')
      .select(`
        *,
        solicitante:usuarios(*),
        praca_destino:pracas_destino(*),
        itens_solicitacao(
          *,
          produto:produtos(*)
        )
      `, { count: 'exact' })
      .eq('praca_destino_id', pracaId)

    if (status) {
      query = query.eq('status', status)
    }

    if (prioridade) {
      query = query.eq('prioridade', prioridade)
    }

    if (dataInicio) {
      query = query.gte('created_at', dataInicio)
    }

    if (dataFim) {
      query = query.lte('created_at', dataFim)
    }

    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error('Erro ao buscar histórico: ' + error.message)
    }

    // Agrupar por data
    const groupedData = (data || []).reduce((groups, solicitacao) => {
      const date = new Date(solicitacao.created_at).toLocaleDateString('pt-BR')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(solicitacao)
      return groups
    }, {} as Record<string, typeof data>)

    return {
      success: true,
      data: groupedData,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Erro ao buscar histórico da praça:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function buscarResumoSolicitacoesPraca(pracaId: string) {
  try {
    const supabase = createServiceClient()
    
    // Buscar resumo dos últimos 30 dias
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - 30)
    
    const { data: solicitacoes, error } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        itens_solicitacao(*)
      `)
      .eq('praca_destino_id', pracaId)
      .gte('created_at', dataInicio.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Erro ao buscar resumo: ' + error.message)
    }

    const total = solicitacoes.length
    const pendentes = solicitacoes.filter(s => s.status === 'pendente').length
    const separando = solicitacoes.filter(s => s.status === 'separando').length
    const entregues = solicitacoes.filter(s => s.status === 'entregue').length
    const totalItens = solicitacoes.reduce((sum, s) => sum + s.itens_solicitacao.length, 0)

    return {
      success: true,
      data: {
        total,
        pendentes,
        separando,
        entregues,
        totalItens,
        solicitacoesRecentes: solicitacoes.slice(0, 5)
      }
    }
  } catch (error) {
    console.error('Erro ao buscar resumo da praça:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

export async function verificarCapacidadePraca(pracaId: string, novaQuantidade: number) {
  try {
    const supabase = createServiceClient()
    
    // Buscar dados da praça
    const { data: praca, error: pracaError } = await supabase
      .from('pracas_destino')
      .select('limite_produtos, capacidade_maxima')
      .eq('id', pracaId)
      .single()

    if (pracaError) {
      throw new Error('Erro ao buscar praça: ' + pracaError.message)
    }

    // Se não há limite definido, permitir
    if (!praca.limite_produtos) {
      return { success: true, permitido: true }
    }

    // Contar produtos atualmente solicitados (pendentes e separando)
    const { data: itensAtuais, error: itensError } = await supabase
      .from('itens_solicitacao')
      .select('quantidade_solicitada')
      .in('status', ['solicitado', 'separado'])
      .eq('solicitacao_id', (await supabase
        .from('solicitacoes')
        .select('id')
        .eq('praca_destino_id', pracaId)
        .in('status', ['pendente', 'separando'])
      ).data?.map(s => s.id) || [])

    if (itensError) {
      throw new Error('Erro ao buscar itens: ' + itensError.message)
    }

    const quantidadeAtual = itensAtuais.reduce((total, item) => total + item.quantidade_solicitada, 0)
    const quantidadeTotal = quantidadeAtual + novaQuantidade

    const permitido = quantidadeTotal <= praca.limite_produtos

    return { 
      success: true, 
      permitido,
      quantidadeAtual,
      limite: praca.limite_produtos,
      quantidadeTotal
    }
  } catch (error) {
    console.error('Erro ao verificar capacidade:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}