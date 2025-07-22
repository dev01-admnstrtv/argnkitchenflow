'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { buscarProdutoPorId, atualizarProduto, buscarAgrupamentosPorTipo } from '@/lib/actions/produtos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProdutoComAgrupamento } from '@/types'

interface EditarProdutoPageProps {
  params: { id: string }
}

export default function EditarProdutoPage({ params }: EditarProdutoPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [produto, setProduto] = useState<ProdutoComAgrupamento | null>(null)
  const [agrupamentos, setAgrupamentos] = useState<Record<string, Array<{id: string, subgrupo: string, descricao?: string}>>>({})
  const [grupos, setGrupos] = useState<string[]>([])
  const [subgrupos, setSubgrupos] = useState<Array<{id: string, subgrupo: string, descricao?: string}>>([])
  
  const [formData, setFormData] = useState({
    produto_id: '',
    descricao: '',
    grupo: '',
    subgrupo: '',
    custo: '',
    tipo: 'insumo' as 'insumo' | 'produzido' | 'produto',
    agrupamento_id: '',
  })

  useEffect(() => {
    const carregarProduto = async () => {
      try {
        const resultado = await buscarProdutoPorId(params.id)
        if (resultado.success && resultado.data) {
          setProduto(resultado.data)
          setFormData({
            produto_id: resultado.data.produto_id,
            descricao: resultado.data.descricao,
            grupo: resultado.data.grupo,
            subgrupo: resultado.data.subgrupo,
            custo: resultado.data.custo?.toString() || '',
            tipo: resultado.data.tipo,
            agrupamento_id: resultado.data.agrupamento_id || '',
          })
        } else {
          setErrors({ load: 'Produto não encontrado' })
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error)
        setErrors({ load: 'Erro ao carregar produto' })
      } finally {
        setLoading(false)
      }
    }

    carregarProduto()
  }, [params.id])

  // Carregar agrupamentos quando o tipo mudar
  useEffect(() => {
    const carregarAgrupamentos = async () => {
      if (formData.tipo) {
        const resultado = await buscarAgrupamentosPorTipo(formData.tipo)
        if (resultado.success) {
          setAgrupamentos(resultado.data)
          setGrupos(Object.keys(resultado.data))
        }
      }
    }
    
    carregarAgrupamentos()
  }, [formData.tipo])

  // Atualizar subgrupos quando grupo muda
  useEffect(() => {
    if (formData.grupo && agrupamentos[formData.grupo]) {
      setSubgrupos(agrupamentos[formData.grupo])
    } else {
      setSubgrupos([])
    }
  }, [formData.grupo, agrupamentos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('produto_id', formData.produto_id)
      formDataToSend.append('descricao', formData.descricao)
      formDataToSend.append('grupo', formData.grupo)
      formDataToSend.append('subgrupo', formData.subgrupo)
      formDataToSend.append('custo', formData.custo)
      formDataToSend.append('tipo', formData.tipo)
      if (formData.agrupamento_id) {
        formDataToSend.append('agrupamento_id', formData.agrupamento_id)
      }

      const resultado = await atualizarProduto(params.id, formDataToSend)
      
      if (resultado.success) {
        router.push('/produtos')
      } else {
        setErrors({ submit: resultado.error || 'Erro ao atualizar produto' })
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      setErrors({ submit: 'Erro inesperado ao atualizar produto' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Se mudou o subgrupo, encontrar o agrupamento_id correspondente
    if (field === 'subgrupo' && value) {
      const agrupamentoEncontrado = subgrupos.find(sub => sub.subgrupo === value)
      if (agrupamentoEncontrado) {
        setFormData(prev => ({ ...prev, agrupamento_id: agrupamentoEncontrado.id }))
      }
    }
    
    // Se mudou o tipo, resetar grupo e subgrupo
    if (field === 'tipo') {
      setFormData(prev => ({ ...prev, grupo: '', subgrupo: '', agrupamento_id: '' }))
      setSubgrupos([])
    }
    
    // Se mudou o grupo, resetar subgrupo  
    if (field === 'grupo') {
      setFormData(prev => ({ ...prev, subgrupo: '', agrupamento_id: '' }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (errors.load) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Erro</h1>
          <p className="text-gray-600 mb-6">{errors.load}</p>
          <Button asChild>
            <Link href="/produtos">Voltar para Produtos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/produtos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Produto</h1>
            <p className="text-gray-600">{produto?.descricao}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Código do Produto *
                  </label>
                  <Input
                    value={formData.produto_id}
                    readOnly
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                    placeholder="PRO0001, INS0001 ou PP0001"
                  />
                  <p className="text-xs text-gray-500 mt-1">Código não pode ser alterado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="insumo">Insumo</option>
                    <option value="produzido">Produzido</option>
                    <option value="produto">Produto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Grupo *
                  </label>
                  <select
                    value={formData.grupo}
                    onChange={(e) => handleInputChange('grupo', e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione um grupo</option>
                    {grupos.map(grupo => (
                      <option key={grupo} value={grupo}>
                        {grupo}
                      </option>
                    ))}
                  </select>
                  {errors.grupo && (
                    <p className="text-red-600 text-sm mt-1">{errors.grupo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subgrupo *
                  </label>
                  <select
                    value={formData.subgrupo}
                    onChange={(e) => handleInputChange('subgrupo', e.target.value)}
                    required
                    disabled={!formData.grupo}
                    className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecione um subgrupo</option>
                    {subgrupos.map(sub => (
                      <option key={sub.id} value={sub.subgrupo}>
                        {sub.subgrupo}
                      </option>
                    ))}
                  </select>
                  {errors.subgrupo && (
                    <p className="text-red-600 text-sm mt-1">{errors.subgrupo}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição *
                </label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Ex: Arroz Branco 5kg"
                  required
                />
                {errors.descricao && (
                  <p className="text-red-600 text-sm mt-1">{errors.descricao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Custo (R$) <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.custo}
                  onChange={(e) => handleInputChange('custo', e.target.value)}
                  placeholder="0.00"
                />
                {errors.custo && (
                  <p className="text-red-600 text-sm mt-1">{errors.custo}</p>
                )}
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/produtos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}