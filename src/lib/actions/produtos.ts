'use server'

import { createServiceClient } from '@/lib/supabase'
import { produtoSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function buscarProdutos(search?: string, tipo?: string, grupo?: string, page: number = 1, limit: number = 20) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('vw_produtos_completos')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(`descricao.ilike.%${search}%,produto_id.ilike.%${search}%,grupo.ilike.%${search}%,subgrupo.ilike.%${search}%,agrupamento_descricao.ilike.%${search}%`)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (grupo) {
      query = query.eq('grupo', grupo)
    }

    const offset = (page - 1) * limit
    query = query
      .order('descricao', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error('Erro ao buscar produtos: ' + error.message)
    }

    return { 
      success: true, 
      data: data || [], 
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarProdutoPorId(id: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('vw_produtos_completos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error('Erro ao buscar produto: ' + error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function criarProduto(formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const custoString = formData.get('custo') as string
    const rawData = {
      produto_id: formData.get('produto_id') as string,
      descricao: formData.get('descricao') as string,
      grupo: formData.get('grupo') as string,
      subgrupo: formData.get('subgrupo') as string,
      custo: custoString && custoString.trim() !== '' ? parseFloat(custoString) : undefined,
      tipo: formData.get('tipo') as string,
      agrupamento_id: formData.get('agrupamento_id') as string || null,
    }

    const validatedData = produtoSchema.parse(rawData)

    const { data, error } = await supabase
      .from('produtos')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao criar produto: ' + error.message)
    }

    revalidatePath('/produtos')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function atualizarProduto(id: string, formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const custoString = formData.get('custo') as string
    const rawData = {
      produto_id: formData.get('produto_id') as string,
      descricao: formData.get('descricao') as string,
      grupo: formData.get('grupo') as string,
      subgrupo: formData.get('subgrupo') as string,
      custo: custoString && custoString.trim() !== '' ? parseFloat(custoString) : undefined,
      tipo: formData.get('tipo') as string,
      agrupamento_id: formData.get('agrupamento_id') as string || null,
    }

    const validatedData = produtoSchema.parse(rawData)

    const { data, error } = await supabase
      .from('produtos')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao atualizar produto: ' + error.message)
    }

    revalidatePath('/produtos')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function deletarProduto(id: string) {
  try {
    const supabase = createServiceClient()
    
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Erro ao deletar produto: ' + error.message)
    }

    revalidatePath('/produtos')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar produto:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarGruposProdutos() {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('produtos')
      .select('grupo, subgrupo')
      .order('grupo', { ascending: true })

    if (error) {
      throw new Error('Erro ao buscar grupos: ' + error.message)
    }

    // Organizar por grupo
    const grupos = data.reduce((acc, item) => {
      if (!acc[item.grupo]) {
        acc[item.grupo] = new Set()
      }
      acc[item.grupo].add(item.subgrupo)
      return acc
    }, {} as Record<string, Set<string>>)

    // Converter Sets para Arrays
    const gruposArray = Object.entries(grupos).map(([grupo, subgrupos]) => ({
      grupo,
      subgrupos: Array.from(subgrupos)
    }))

    return { success: true, data: gruposArray }
  } catch (error) {
    console.error('Erro ao buscar grupos:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarEstoqueProduto(produtoId: string) {
  try {
    const supabase = createServiceClient()
    
    // Calcular estoque atual baseado em movimentações
    const { data, error } = await supabase
      .from('movimento_estoque')
      .select('tipo_movimento, quantidade')
      .eq('produto_id', produtoId)

    if (error) {
      throw new Error('Erro ao buscar estoque: ' + error.message)
    }

    const estoque = data.reduce((total, movimento) => {
      return movimento.tipo_movimento === 'entrada' 
        ? total + movimento.quantidade 
        : total - movimento.quantidade
    }, 0)

    return { success: true, data: estoque }
  } catch (error) {
    console.error('Erro ao buscar estoque:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function gerarProximoCodigoProduto(tipo: 'insumo' | 'produzido' | 'produto') {
  try {
    const supabase = createServiceClient()
    
    // Definir prefixo baseado no tipo
    const prefixos = {
      'produto': 'PRO',
      'insumo': 'INS', 
      'produzido': 'PP'
    }
    
    const prefixo = prefixos[tipo]
    
    // Buscar o último código com esse prefixo
    const { data, error } = await supabase
      .from('produtos')
      .select('produto_id')
      .ilike('produto_id', `${prefixo}%`)
      .order('produto_id', { ascending: false })
      .limit(1)

    if (error) {
      throw new Error('Erro ao buscar último código: ' + error.message)
    }

    let proximoNumero = 1
    
    // Se há produtos com esse prefixo, incrementar
    if (data && data.length > 0) {
      const ultimoCodigo = data[0].produto_id
      const numeroMatch = ultimoCodigo.match(/\d+/)
      
      if (numeroMatch) {
        const ultimoNumero = parseInt(numeroMatch[0])
        proximoNumero = ultimoNumero + 1
      }
    }
    
    // Formatar com zeros à esquerda (ex: PRO0001)
    const codigoFormatado = `${prefixo}${proximoNumero.toString().padStart(4, '0')}`
    
    return { success: true, data: codigoFormatado }
  } catch (error) {
    console.error('Erro ao gerar próximo código:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

// === FUNÇÕES PARA AGRUPAMENTOS ===

export async function buscarAgrupamentosPorTipo(tipo: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('agrupamentos')
      .select('*')
      .eq('tipo', tipo)
      .eq('ativo', true)
      .order('grupo', { ascending: true })
      .order('subgrupo', { ascending: true })

    if (error) {
      throw new Error('Erro ao buscar agrupamentos: ' + error.message)
    }

    // Organizar por grupo
    const grupos = data.reduce((acc, agrupamento) => {
      if (!acc[agrupamento.grupo]) {
        acc[agrupamento.grupo] = []
      }
      acc[agrupamento.grupo].push({
        id: agrupamento.id,
        subgrupo: agrupamento.subgrupo,
        descricao: agrupamento.descricao
      })
      return acc
    }, {} as Record<string, Array<{id: string, subgrupo: string, descricao?: string}>>)

    return { success: true, data: grupos }
  } catch (error) {
    console.error('Erro ao buscar agrupamentos por tipo:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarAgrupamentos(search?: string, tipo?: string, page: number = 1, limit: number = 20) {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('agrupamentos')
      .select('*', { count: 'exact' })
      .eq('ativo', true)

    if (search) {
      query = query.or(`cod_agrupamento.ilike.%${search}%,grupo.ilike.%${search}%,subgrupo.ilike.%${search}%,descricao.ilike.%${search}%`)
    }

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    const offset = (page - 1) * limit
    query = query
      .order('grupo', { ascending: true })
      .order('subgrupo', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error('Erro ao buscar agrupamentos: ' + error.message)
    }

    return { 
      success: true, 
      data: data || [], 
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }
  } catch (error) {
    console.error('Erro ao buscar agrupamentos:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function buscarAgrupamentoPorId(id: string) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from('agrupamentos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error('Erro ao buscar agrupamento: ' + error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar agrupamento:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function criarAgrupamento(formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const rawData = {
      cod_agrupamento: formData.get('cod_agrupamento') as string,
      grupo: formData.get('grupo') as string,
      subgrupo: formData.get('subgrupo') as string,
      descricao: formData.get('descricao') as string,
      tipo: formData.get('tipo') as string,
      ativo: formData.get('ativo') === 'true',
    }

    const { data, error } = await supabase
      .from('agrupamentos')
      .insert(rawData)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao criar agrupamento: ' + error.message)
    }

    revalidatePath('/produtos')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar agrupamento:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function atualizarAgrupamento(id: string, formData: FormData) {
  try {
    const supabase = createServiceClient()
    
    const rawData = {
      cod_agrupamento: formData.get('cod_agrupamento') as string,
      grupo: formData.get('grupo') as string,
      subgrupo: formData.get('subgrupo') as string,
      descricao: formData.get('descricao') as string,
      tipo: formData.get('tipo') as string,
      ativo: formData.get('ativo') === 'true',
    }

    const { data, error } = await supabase
      .from('agrupamentos')
      .update(rawData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error('Erro ao atualizar agrupamento: ' + error.message)
    }

    revalidatePath('/produtos')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar agrupamento:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function deletarAgrupamento(id: string) {
  try {
    const supabase = createServiceClient()
    
    // Verificar se há produtos usando este agrupamento
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('id')
      .eq('agrupamento_id', id)
      .limit(1)

    if (produtosError) {
      throw new Error('Erro ao verificar produtos: ' + produtosError.message)
    }

    if (produtos && produtos.length > 0) {
      throw new Error('Não é possível excluir agrupamento que possui produtos associados')
    }

    const { error } = await supabase
      .from('agrupamentos')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('Erro ao deletar agrupamento: ' + error.message)
    }

    revalidatePath('/produtos')
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar agrupamento:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}