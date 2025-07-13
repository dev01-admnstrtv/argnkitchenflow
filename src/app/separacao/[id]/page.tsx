'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  buscarDetalhesSeparacao, 
  iniciarSeparacaoItem, 
  concluirSeparacaoItem,
  cancelarSeparacaoItem,
  aplicarAjustesEstoque,
  calcularImpactoEstoque,
  verificarAjustesEstoqueAplicados
} from '@/lib/actions/separacao'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Package, 
  User,
  FileText,
  Save
} from 'lucide-react'
import Link from 'next/link'

interface SeparacaoPageProps {
  params: { id: string }
}

interface ItemSeparacao {
  item_id: string
  solicitacao_id: string
  produto_id: string
  produto_descricao: string
  produto_grupo: string
  produto_subgrupo: string
  quantidade_solicitada: number
  quantidade_separada: number
  status_separacao: string
  observacoes_item: string
  observacoes_separacao: string
  iniciado_separacao_em: string | null
  concluido_separacao_em: string | null
  separado_por_usuario_id: string | null
  separado_por: string | null
  tempo_separacao_minutos: number | null
}

interface SolicitacaoDetalhes {
  solicitacao: any
  itens: ItemSeparacao[]
}

export default function SeparacaoIndividualPage({ params }: SeparacaoPageProps) {
  const router = useRouter()
  const [dados, setDados] = useState<SolicitacaoDetalhes | null>(null)
  const [impactoEstoque, setImpactoEstoque] = useState<any>(null)
  const [ajustesAplicados, setAjustesAplicados] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, {
    quantidade_separada: string
    observacoes: string
  }>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Usuário fixo para teste (depois será dinâmico)
  const usuarioId = '0f4a00bb-a9fd-4e00-ad29-f6e2bf1b4d47'

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      try {
        const [dadosResult, impactoResult, ajustesResult] = await Promise.all([
          buscarDetalhesSeparacao(params.id),
          calcularImpactoEstoque(params.id),
          verificarAjustesEstoqueAplicados(params.id)
        ])
        
        if (dadosResult.success) {
          setDados(dadosResult.data || null)
          // Inicializar formData com quantidade solicitada para cada item
          const initialFormData: Record<string, { quantidade_separada: string; observacoes: string }> = {}
          dadosResult.data?.itens.forEach((item: ItemSeparacao) => {
            initialFormData[item.item_id] = {
              quantidade_separada: item.quantidade_separada?.toString() || item.quantidade_solicitada.toString(),
              observacoes: item.observacoes_separacao || ''
            }
          })
          setFormData(initialFormData)
        } else {
          setErrors({ load: dadosResult.error || 'Erro ao carregar dados' })
        }
        if (impactoResult.success) {
          setImpactoEstoque(impactoResult.data)
        }
        if (ajustesResult.success) {
          setAjustesAplicados(ajustesResult.data?.ajustesAplicados || false)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setErrors({ load: 'Erro inesperado ao carregar dados' })
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [params.id])

  const recarregarDados = async () => {
    setLoading(true)
    try {
      const [dadosResult, impactoResult, ajustesResult] = await Promise.all([
        buscarDetalhesSeparacao(params.id),
        calcularImpactoEstoque(params.id),
        verificarAjustesEstoqueAplicados(params.id)
      ])
      
      if (dadosResult.success) {
        setDados(dadosResult.data || null)
        // Recriar formData com novos dados
        const newFormData: Record<string, { quantidade_separada: string; observacoes: string }> = {}
        dadosResult.data?.itens.forEach((item: ItemSeparacao) => {
          newFormData[item.item_id] = {
            quantidade_separada: formData[item.item_id]?.quantidade_separada ?? item.quantidade_separada?.toString() ?? item.quantidade_solicitada.toString(),
            observacoes: formData[item.item_id]?.observacoes || item.observacoes_separacao || ''
          }
        })
        setFormData(newFormData)
      } else {
        setErrors({ load: dadosResult.error || 'Erro ao carregar dados' })
      }
      if (impactoResult.success) {
        setImpactoEstoque(impactoResult.data)
      }
      if (ajustesResult.success) {
        setAjustesAplicados(ajustesResult.data?.ajustesAplicados || false)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setErrors({ load: 'Erro inesperado ao carregar dados' })
    } finally {
      setLoading(false)
    }
  }

  const handleSalvarItem = async (itemId: string, status: 'separado' | 'em_falta') => {
    const itemFormData = formData[itemId]
    if (!itemFormData) return

    setProcessando(itemId)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('item_id', itemId)
      formDataToSend.append('quantidade_separada', itemFormData.quantidade_separada)
      formDataToSend.append('status', status)
      formDataToSend.append('observacoes', itemFormData.observacoes)

      const resultado = await concluirSeparacaoItem(formDataToSend)
      if (!resultado.success) {
        setErrors({ [itemId]: resultado.error || 'Erro ao salvar item' })
        return
      }

      await recarregarDados()
      setErrors({ [itemId]: '' }) // Limpar erro se houver
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      setErrors({ [itemId]: 'Erro inesperado ao salvar item' })
    } finally {
      setProcessando(null)
    }
  }

  const updateFormData = (itemId: string, field: keyof typeof formData[string], value: string) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }))
  }

  const handleAplicarAjustesEstoque = async () => {
    if (!confirm('Aplicar ajustes no estoque para todos os itens separados?')) return

    setProcessando('estoque')
    try {
      const resultado = await aplicarAjustesEstoque(params.id)
      if (resultado.success) {
        alert(`${resultado.data?.ajustes || 0} ajustes aplicados no estoque`)
        await recarregarDados()
      } else {
        setErrors({ estoque: resultado.error || 'Erro ao aplicar ajustes' })
      }
    } catch (error) {
      console.error('Erro ao aplicar ajustes:', error)
      setErrors({ estoque: 'Erro inesperado' })
    } finally {
      setProcessando(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      'aguardando': 'bg-yellow-100 text-yellow-800',
      'separando': 'bg-blue-100 text-blue-800',
      'separado': 'bg-green-100 text-green-800',
      'em_falta': 'bg-red-100 text-red-800',
      'cancelado': 'bg-gray-100 text-gray-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'aguardando': 'Aguardando',
      'separando': 'Separando',
      'separado': 'Separado',
      'em_falta': 'Em Falta',
      'cancelado': 'Cancelado'
    }
    return labels[status as keyof typeof labels] || status
  }

  const calcularProgresso = () => {
    if (!dados?.itens.length) return 0
    const concluidos = dados.itens.filter(item => 
      item.status_separacao === 'separado' || item.status_separacao === 'em_falta'
    ).length
    return Math.round((concluidos / dados.itens.length) * 100)
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
            <Link href="/separacao">Voltar para Separação</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Solicitação não encontrada</h1>
          <Button asChild>
            <Link href="/separacao">Voltar para Separação</Link>
          </Button>
        </div>
      </div>
    )
  }

  const progresso = calcularProgresso()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/separacao">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Separação da Solicitação</h1>
            <p className="text-gray-600">
              {dados.solicitacao.praca_destino?.nome} • {formatDate(new Date(dados.solicitacao.created_at))}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{progresso}%</div>
            <div className="text-sm text-gray-500">Concluído</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações da Solicitação */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Praça de Destino</label>
                  <p className="text-lg font-semibold">{dados.solicitacao.praca_destino?.nome}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Solicitante</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{dados.solicitacao.solicitante?.nome}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Prioridade</label>
                  <Badge className={`${
                    dados.solicitacao.prioridade === 'urgente' ? 'bg-red-500' :
                    dados.solicitacao.prioridade === 'alta' ? 'bg-orange-500' :
                    dados.solicitacao.prioridade === 'normal' ? 'bg-blue-500' : 'bg-gray-500'
                  } text-white`}>
                    {dados.solicitacao.prioridade}
                  </Badge>
                </div>

                {dados.solicitacao.observacoes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Observações</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{dados.solicitacao.observacoes}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso</span>
                    <span className="font-semibold">{progresso}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>

                {/* Impacto no Estoque */}
                {impactoEstoque && impactoEstoque.total_produtos > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Impacto no Estoque</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Produtos afetados:</span>
                        <span className="font-medium">{impactoEstoque.total_produtos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor total:</span>
                        <span className="font-medium">
                          R$ {impactoEstoque.valor_total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  {ajustesAplicados ? (
                    <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md text-center">
                      <div className="flex items-center justify-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Ajustes de Estoque Aplicados</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Os ajustes foram aplicados automaticamente quando a solicitação foi entregue
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleAplicarAjustesEstoque}
                      disabled={processando === 'estoque' || progresso < 100}
                      variant="outline"
                      className="w-full"
                    >
                      {processando === 'estoque' ? 'Aplicando...' : 'Aplicar Ajustes de Estoque'}
                    </Button>
                  )}
                  {errors.estoque && (
                    <p className="text-red-600 text-sm">{errors.estoque}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Itens */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Itens para Separação ({dados.itens.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dados.itens.map((item) => (
                    <div key={item.item_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium">{item.produto_descricao}</h3>
                          <p className="text-sm text-gray-600">
                            {item.produto_grupo} • {item.produto_subgrupo}
                          </p>
                        </div>
                        <Badge className={getStatusBadge(item.status_separacao)}>
                          {getStatusLabel(item.status_separacao)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Qtd. Solicitada</label>
                          <p className="text-lg font-semibold">{item.quantidade_solicitada}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Qtd. Separada</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData[item.item_id]?.quantidade_separada || item.quantidade_solicitada.toString()}
                            onChange={(e) => updateFormData(item.item_id, 'quantidade_separada', e.target.value)}
                            className="text-lg font-semibold"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Observações da Separação</label>
                        <textarea
                          value={formData[item.item_id]?.observacoes || ''}
                          onChange={(e) => updateFormData(item.item_id, 'observacoes', e.target.value)}
                          rows={2}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Observações sobre a separação..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <Button 
                          onClick={() => handleSalvarItem(item.item_id, 'separado')}
                          disabled={processando === item.item_id}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {processando === item.item_id ? 'Salvando...' : 'Separado'}
                        </Button>
                        <Button 
                          onClick={() => handleSalvarItem(item.item_id, 'em_falta')}
                          disabled={processando === item.item_id}
                          variant="destructive"
                          size="sm"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {processando === item.item_id ? 'Salvando...' : 'Em Falta'}
                        </Button>
                      </div>

                      {errors[item.item_id] && (
                        <p className="text-red-600 text-sm mt-2">{errors[item.item_id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}