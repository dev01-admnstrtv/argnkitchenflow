'use server'

import { createServiceClient } from '@/lib/supabase'

export async function getTotalProdutos() {
  try {
    const supabase = createServiceClient()
    const { count, error } = await supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })

    if (error) throw new Error(error.message)

    return { success: true, data: count || 0 }
  } catch (error) {
    console.error('Erro ao buscar total de produtos:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function getTotalPracas() {
  try {
    const supabase = createServiceClient()
    const { count, error } = await supabase
      .from('pracas_destino')
      .select('id', { count: 'exact', head: true })

    if (error) throw new Error(error.message)

    return { success: true, data: count || 0 }
  } catch (error) {
    console.error('Erro ao buscar total de praças:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function getTotalInventarios() {
  try {
    const supabase = createServiceClient()
    const { count, error } = await supabase
      .from('inventarios')
      .select('id', { count: 'exact', head: true })

    if (error) throw new Error(error.message)

    return { success: true, data: count || 0 }
  } catch (error) {
    console.error('Erro ao buscar total de inventários:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function getTotalFichasTecnicas() {
  try {
    const supabase = createServiceClient()
    const { count, error } = await supabase
      .from('fichas_tecnicas')
      .select('id', { count: 'exact', head: true })

    if (error) throw new Error(error.message)

    return { success: true, data: count || 0 }
  } catch (error) {
    console.error('Erro ao buscar total de fichas técnicas:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}
