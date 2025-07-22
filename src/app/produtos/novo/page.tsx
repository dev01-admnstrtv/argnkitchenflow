'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarProduto, gerarProximoCodigoProduto, buscarAgrupamentosPorTipo } from '@/lib/actions/produtos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoProdutoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
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

  // Carregar próximo código do produto ao montar o componente ou quando tipo muda
  useEffect(() => {
    const carregarCodigoProduto = async () => {
      const resultado = await gerarProximoCodigoProduto(formData.tipo)
      if (resultado.success && resultado.data) {
        setFormData(prev => ({ ...prev, produto_id: resultado.data }))
      }
    }
    
    carregarCodigoProduto()
  }, [formData.tipo])

  // Carregar agrupamentos quando o tipo mudar
  useEffect(() => {
    const carregarAgrupamentos = async () => {
      if (formData.tipo) {
        const resultado = await buscarAgrupamentosPorTipo(formData.tipo)
        if (resultado.success) {
          setAgrupamentos(resultado.data)
          setGrupos(Object.keys(resultado.data))
          // Resetar grupo e subgrupo quando tipo muda
          setFormData(prev => ({ ...prev, grupo: '', subgrupo: '', agrupamento_id: '' }))
          setSubgrupos([])
        }
      }
    }
    
    carregarAgrupamentos()
  }, [formData.tipo])

  // Atualizar subgrupos quando grupo muda
  useEffect(() => {
    if (formData.grupo && agrupamentos[formData.grupo]) {
      setSubgrupos(agrupamentos[formData.grupo])
      setFormData(prev => ({ ...prev, subgrupo: '', agrupamento_id: '' }))
    } else {
      setSubgrupos([])
    }
  }, [formData.grupo, agrupamentos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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

      const resultado = await criarProduto(formDataToSend)
      
      if (resultado.success) {
        router.push('/produtos')
      } else {
        setErrors({ submit: resultado.error || 'Erro ao criar produto' })
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      setErrors({ submit: 'Erro inesperado ao criar produto' })
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold">Novo Produto</h1>
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
                  <p className="text-xs text-gray-500 mt-1">Código gerado automaticamente baseado no tipo</p>
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
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Produto'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}