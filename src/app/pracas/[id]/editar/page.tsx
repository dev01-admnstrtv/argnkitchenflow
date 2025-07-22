'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { buscarPracaPorId, atualizarPraca, buscarEstatisticasPraca } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { PracaDestino } from '@/types'

interface EditarPracaPageProps {
  params: { id: string }
}

export default function EditarPracaPage({ params }: EditarPracaPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [praca, setPraca] = useState<PracaDestino | null>(null)
  const [estatisticas, setEstatisticas] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    responsavel: '',
    tipo: 'geral' as 'cozinha' | 'salao' | 'bar' | 'estoque' | 'limpeza' | 'escritorio' | 'geral',
    capacidade_maxima: '',
    limite_produtos: '',
    ativo: true,
  })

  useEffect(() => {
    const carregarPraca = async () => {
      try {
        const [resultadoPraca, resultadoEstatisticas] = await Promise.all([
          buscarPracaPorId(params.id),
          buscarEstatisticasPraca(params.id)
        ])

        if (resultadoPraca.success && resultadoPraca.data) {
          setPraca(resultadoPraca.data)
          setFormData({
            nome: resultadoPraca.data.nome,
            descricao: resultadoPraca.data.descricao || '',
            responsavel: resultadoPraca.data.responsavel || '',
            tipo: resultadoPraca.data.tipo,
            capacidade_maxima: resultadoPraca.data.capacidade_maxima?.toString() || '',
            limite_produtos: resultadoPraca.data.limite_produtos?.toString() || '',
            ativo: resultadoPraca.data.ativo,
          })
        } else {
          setErrors({ load: 'Praça não encontrada' })
        }

        if (resultadoEstatisticas.success) {
          setEstatisticas(resultadoEstatisticas.data)
        }
      } catch (error) {
        console.error('Erro ao carregar praça:', error)
        setErrors({ load: 'Erro ao carregar praça' })
      } finally {
        setLoading(false)
      }
    }

    carregarPraca()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('nome', formData.nome)
      formDataToSend.append('descricao', formData.descricao)
      formDataToSend.append('responsavel', formData.responsavel)
      formDataToSend.append('tipo', formData.tipo)
      formDataToSend.append('capacidade_maxima', formData.capacidade_maxima)
      formDataToSend.append('limite_produtos', formData.limite_produtos)
      formDataToSend.append('ativo', formData.ativo.toString())

      const resultado = await atualizarPraca(params.id, formDataToSend)
      
      if (resultado.success) {
        router.push('/pracas')
      } else {
        setErrors({ submit: resultado.error || 'Erro ao atualizar praça' })
      }
    } catch (error) {
      console.error('Erro ao atualizar praça:', error)
      setErrors({ submit: 'Erro inesperado ao atualizar praça' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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
            <Link href="/pracas">Voltar para Praças</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/pracas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Praça</h1>
            <p className="text-gray-600">{praca?.nome}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Praça</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Nome da Praça *
                      </label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        placeholder="Ex: Cozinha Principal"
                        required
                      />
                      {errors.nome && (
                        <p className="text-red-600 text-sm mt-1">{errors.nome}</p>
                      )}
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
                        <option value="geral">Geral</option>
                        <option value="cozinha">Cozinha</option>
                        <option value="salao">Salão</option>
                        <option value="bar">Bar</option>
                        <option value="estoque">Estoque</option>
                        <option value="limpeza">Limpeza</option>
                        <option value="escritorio">Escritório</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => handleInputChange('descricao', e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Descrição da praça..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Responsável
                    </label>
                    <Input
                      value={formData.responsavel}
                      onChange={(e) => handleInputChange('responsavel', e.target.value)}
                      placeholder="Nome do responsável pela praça"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Capacidade Máxima
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.capacidade_maxima}
                        onChange={(e) => handleInputChange('capacidade_maxima', e.target.value)}
                        placeholder="Ex: 100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Capacidade física da praça (opcional)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Limite de Produtos
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.limite_produtos}
                        onChange={(e) => handleInputChange('limite_produtos', e.target.value)}
                        placeholder="Ex: 50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Limite de produtos por solicitação (opcional)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) => handleInputChange('ativo', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="ativo" className="text-sm font-medium">
                      Praça ativa
                    </label>
                  </div>

                  {errors.submit && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">{errors.submit}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/pracas">Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Estatísticas */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {estatisticas ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de solicitações:</span>
                      <Badge variant="outline">{estatisticas.total}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pendentes:</span>
                      <Badge variant={estatisticas.pendentes > 0 ? "destructive" : "outline"}>
                        {estatisticas.pendentes}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Em separação:</span>
                      <Badge variant={estatisticas.separando > 0 ? "default" : "outline"}>
                        {estatisticas.separando}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entregues:</span>
                      <Badge variant="outline">{estatisticas.entregues}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confirmadas:</span>
                      <Badge variant="outline">{estatisticas.confirmadas}</Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Carregando estatísticas...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/solicitacoes?praca=${params.id}`}>
                    Ver Solicitações
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/solicitacoes/nova?praca=${params.id}`}>
                    Nova Solicitação
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}