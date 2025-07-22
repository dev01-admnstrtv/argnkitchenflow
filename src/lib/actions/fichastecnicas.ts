'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  FichaTecnica, 
  FichaTecnicaInsert, 
  FichaTecnicaUpdate,
  FichaTecnicaCompleta,
  FichaTecnicaIngrediente,
  FichaTecnicaIngredienteInsert,
  FichaTecnicaFoto,
  FichaTecnicaFotoInsert,
  FichaTecnicaPreparo,
  FichaTecnicaPreparoInsert,
  FichaTecnicaPraca,
  FichaTecnicaPracaInsert,
  CategoriaFicha,
  DificuldadeFicha
} from '@/types'

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  total?: number
  totalPages?: number
  currentPage?: number
}

export async function buscarFichasTecnicas(
  filtro?: string,
  categoria?: CategoriaFicha,
  dificuldade?: DificuldadeFicha,
  ativo?: boolean,
  page = 1,
  limit = 20
): Promise<ActionResult<FichaTecnica[]>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    let query = supabase
      .from('fichas_tecnicas')
      .select('*')
      .order('nome')

    if (filtro) {
      query = query.or(`nome.ilike.%${filtro}%,descricao.ilike.%${filtro}%`)
    }

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    if (dificuldade) {
      query = query.eq('dificuldade', dificuldade)
    }

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo)
    }

    const { count } = await query
    const offset = (page - 1) * limit
    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      return { success: false, error: error.message }
    }

    const totalPages = count ? Math.ceil(count / limit) : 1

    return {
      success: true,
      data: data || [],
      total: count || 0,
      totalPages,
      currentPage: page
    }
  } catch (error) {
    return { success: false, error: 'Erro ao buscar fichas técnicas' }
  }
}

export async function buscarFichaTecnicaPorId(id: string): Promise<ActionResult<FichaTecnicaCompleta>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_tecnicas')
      .select('*')
      .eq('id', id)
      .single()

    if (fichaError) {
      return { success: false, error: fichaError.message }
    }

    const [ingredientesResult, fotosResult, preparoResult, pracasResult] = await Promise.all([
      supabase
        .from('fichas_tecnicas_ingredientes')
        .select(`
          *,
          produto:produtos(*)
        `)
        .eq('ficha_tecnica_id', id)
        .order('id'),

      supabase
        .from('fichas_tecnicas_fotos')
        .select('*')
        .eq('ficha_tecnica_id', id)
        .order('ordem', { ascending: true }),

      supabase
        .from('fichas_tecnicas_preparo')
        .select('*')
        .eq('ficha_tecnica_id', id)
        .order('passo', { ascending: true }),

      supabase
        .from('fichas_tecnicas_pracas')
        .select(`
          *,
          praca_destino:pracas_destino(*)
        `)
        .eq('ficha_tecnica_id', id)
        .eq('ativo', true)
    ])

    const fichaTecnicaCompleta: FichaTecnicaCompleta = {
      ...ficha,
      ingredientes: ingredientesResult.data || [],
      fotos: fotosResult.data || [],
      preparo: preparoResult.data || [],
      pracas: pracasResult.data || []
    }

    return { success: true, data: fichaTecnicaCompleta }
  } catch (error) {
    return { success: false, error: 'Erro ao buscar ficha técnica' }
  }
}

export async function criarFichaTecnica(ficha: FichaTecnicaInsert): Promise<ActionResult<FichaTecnica>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data, error } = await supabase
      .from('fichas_tecnicas')
      .insert(ficha)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Erro ao criar ficha técnica' }
  }
}

export async function atualizarFichaTecnica(id: string, ficha: FichaTecnicaUpdate): Promise<ActionResult<FichaTecnica>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data, error } = await supabase
      .from('fichas_tecnicas')
      .update({ ...ficha, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar ficha técnica' }
  }
}

export async function alternarStatusFichaTecnica(id: string): Promise<ActionResult> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data: ficha } = await supabase
      .from('fichas_tecnicas')
      .select('ativo')
      .eq('id', id)
      .single()

    if (!ficha) {
      return { success: false, error: 'Ficha técnica não encontrada' }
    }

    const { error } = await supabase
      .from('fichas_tecnicas')
      .update({ 
        ativo: !ficha.ativo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Erro ao alterar status da ficha técnica' }
  }
}

export async function deletarFichaTecnica(id: string): Promise<ActionResult> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { error } = await supabase
      .from('fichas_tecnicas')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Erro ao deletar ficha técnica' }
  }
}

export async function adicionarIngrediente(ingrediente: FichaTecnicaIngredienteInsert): Promise<ActionResult<FichaTecnicaIngrediente>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data, error } = await supabase
      .from('fichas_tecnicas_ingredientes')
      .insert(ingrediente)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Erro ao adicionar ingrediente' }
  }
}

export async function removerIngrediente(id: string): Promise<ActionResult> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { error } = await supabase
      .from('fichas_tecnicas_ingredientes')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Erro ao remover ingrediente' }
  }
}

export async function adicionarFoto(foto: FichaTecnicaFotoInsert): Promise<ActionResult<FichaTecnicaFoto>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data, error } = await supabase
      .from('fichas_tecnicas_fotos')
      .insert(foto)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Erro ao adicionar foto' }
  }
}

export async function removerFoto(id: string): Promise<ActionResult> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { error } = await supabase
      .from('fichas_tecnicas_fotos')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Erro ao remover foto' }
  }
}

export async function adicionarPassoPreparo(passo: FichaTecnicaPreparoInsert): Promise<ActionResult<FichaTecnicaPreparo>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data, error } = await supabase
      .from('fichas_tecnicas_preparo')
      .insert(passo)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Erro ao adicionar passo de preparo' }
  }
}

export async function removerPassoPreparo(id: string): Promise<ActionResult> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { error } = await supabase
      .from('fichas_tecnicas_preparo')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Erro ao remover passo de preparo' }
  }
}

export async function vincularPraca(vinculo: FichaTecnicaPracaInsert): Promise<ActionResult<FichaTecnicaPraca>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data, error } = await supabase
      .from('fichas_tecnicas_pracas')
      .insert(vinculo)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Erro ao vincular praça' }
  }
}

export async function desvincularPraca(fichaId: string, pracaId: string): Promise<ActionResult> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { error } = await supabase
      .from('fichas_tecnicas_pracas')
      .delete()
      .eq('ficha_tecnica_id', fichaId)
      .eq('praca_destino_id', pracaId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Erro ao desvincular praça' }
  }
}

export async function buscarFichasPorPraca(pracaId: string): Promise<ActionResult<FichaTecnica[]>> {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    const { data, error } = await supabase
      .from('fichas_tecnicas_pracas')
      .select(`
        ficha_tecnica:fichas_tecnicas(*)
      `)
      .eq('praca_destino_id', pracaId)
      .eq('ativo', true)
      .eq('fichas_tecnicas.ativo', true)

    if (error) {
      return { success: false, error: error.message }
    }

    const fichas = data?.map(item => item.ficha_tecnica).filter(Boolean) || []

    return { success: true, data: fichas }
  } catch (error) {
    return { success: false, error: 'Erro ao buscar fichas da praça' }
  }
}