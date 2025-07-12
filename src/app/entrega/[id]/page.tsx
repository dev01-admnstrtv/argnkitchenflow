'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  buscarDetalhesEntrega, 
  confirmarEntregaItem,
  finalizarEntregaSolicitacao,
  cancelarEntregaSolicitacao
} from '@/lib/actions/entrega'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Timer } from '@/components/ui/timer'
import { formatDate } from '@/lib/utils'
import { 
  ArrowLeft, 
  CheckCircle, 
  X, 
  AlertCircle, 
  Package, 
  User,
  MapPin,
  FileText,
  Save,
  Truck,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface EntregaPageProps {
  params: { id: string }
}

interface ItemEntrega {
  item_id: string
  solicitacao_id: string
  produto_id: string
  produto_descricao: string
  produto_grupo: string
  produto_subgrupo: string
  quantidade_solicitada: number
  quantidade_separada: number
  status_separacao: string
  status_entrega: string
  observacoes_item: string
  observacoes_separacao: string
  observacoes_entrega: string
  iniciado_entrega_em: string | null
  concluido_entrega_em: string | null
  entregue_por_usuario_id: string | null
  entregue_por: string | null
  tempo_entrega_minutos: number | null
}

interface SolicitacaoDetalhes {
  solicitacao: any
  itens: ItemEntrega[]
}

export default function EntregaIndividualPage({ params }: EntregaPageProps) {
  const router = useRouter()
  const [dados, setDados] = useState<SolicitacaoDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)
  const [itensStatus, setItensStatus] = useState<Record<string, {
    status: 'entregue' | 'nao_entregue' | null
    observacoes: string
  }>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sucessos, setSucessos] = useState<Record<string, boolean>>({})

  // Usuário fixo para teste (depois será dinâmico)
  const usuarioId = '0f4a00bb-a9fd-4e00-ad29-f6e2bf1b4d47'

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const resultado = await buscarDetalhesEntrega(params.id)
      if (resultado.success && resultado.data) {
        setDados(resultado.data)
        
        // Inicializar status dos itens
        const initialStatus: Record<string, any> = {}
        resultado.data.itens.forEach((item: ItemEntrega) => {
          initialStatus[item.item_id] = {
            status: item.status_entrega === 'aguardando' ? null : item.status_entrega,
            observacoes: item.observacoes_entrega || ''
          }
        })
        setItensStatus(initialStatus)
      } else {
        setErrors({ load: resultado.error || 'Erro ao carregar dados' })
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setErrors({ load: 'Erro inesperado ao carregar dados' })
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const handleStatusChange = (itemId: string, status: 'entregue' | 'nao_entregue') => {
    setItensStatus(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status: prev[itemId]?.status === status ? null : status
      }
    }))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[itemId]
      return newErrors
    })
    setSucessos(prev => {
      const newSucessos = { ...prev }
      delete newSucessos[itemId]
      return newSucessos
    })
  }

  const handleObservacoesChange = (itemId: string, observacoes: string) => {
    setItensStatus(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        observacoes
      }
    }))
  }

  const handleConfirmarItem = async (itemId: string) => {
    const itemStatus = itensStatus[itemId]
    
    if (!itemStatus?.status) {
      setErrors(prev => ({ ...prev, [itemId]: 'Selecione o status de entrega' }))
      return
    }

    if (itemStatus.status === 'nao_entregue' && !itemStatus.observacoes?.trim()) {
      setErrors(prev => ({ ...prev, [itemId]: 'Observação obrigatória para itens não entregues' }))
      return
    }

    setProcessando(itemId)
    try {
      const formData = new FormData()
      formData.append('item_id', itemId)
      formData.append('status_entrega', itemStatus.status)
      formData.append('observacoes_entrega', itemStatus.observacoes || '')
      formData.append('usuario_id', usuarioId)

      const resultado = await confirmarEntregaItem(formData)
      if (resultado.success) {
        // Feedback visual de sucesso
        setSucessos(prev => ({ ...prev, [itemId]: true }))
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[itemId]
          return newErrors
        })
        
        // Limpar sucesso após 2 segundos
        setTimeout(() => {
          setSucessos(prev => {
            const newSucessos = { ...prev }
            delete newSucessos[itemId]
            return newSucessos
          })
        }, 2000)
        
        await carregarDados()
      } else {
        setErrors(prev => ({ ...prev, [itemId]: resultado.error || 'Erro ao confirmar item' }))
      }
    } catch (error) {
      console.error('Erro ao confirmar item:', error)
      setErrors(prev => ({ ...prev, [itemId]: 'Erro inesperado' }))
    } finally {
      setProcessando(null)
    }
  }

  const handleFinalizarEntrega = async () => {
    const itensNaoProcessados = dados?.itens.filter(item => 
      item.status_entrega === 'aguardando'
    ) || []

    if (itensNaoProcessados.length > 0) {
      alert(`${itensNaoProcessados.length} itens ainda não foram processados`)
      return
    }

    if (!confirm('Finalizar entrega da solicitação?')) return

    setProcessando('finalizar')
    try {
      const resultado = await finalizarEntregaSolicitacao(params.id)
      if (resultado.success && resultado.data) {
        const statusMensagem = resultado.data.statusFinal === 'entregue' 
          ? 'Todos os itens foram entregues com sucesso!'
          : `Entrega finalizada! ${resultado.data.itensEntregues} de ${resultado.data.totalItens} itens entregues.`
        
        alert(statusMensagem)
        router.push('/entrega')
      } else {
        alert('Erro ao finalizar entrega: ' + resultado.error)
      }
    } catch (error) {
      console.error('Erro ao finalizar entrega:', error)
      alert('Erro inesperado ao finalizar entrega')
    } finally {
      setProcessando(null)
    }
  }

  const handleCancelarEntrega = async () => {
    if (!confirm('Cancelar entrega e voltar para status separado?')) return

    setProcessando('cancelar')
    try {
      const resultado = await cancelarEntregaSolicitacao(params.id)
      if (resultado.success) {
        router.push('/entrega')
      } else {
        alert('Erro ao cancelar entrega: ' + resultado.error)
      }
    } catch (error) {
      console.error('Erro ao cancelar entrega:', error)
      alert('Erro inesperado ao cancelar entrega')
    } finally {
      setProcessando(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      'aguardando': 'bg-yellow-100 text-yellow-800',
      'em_entrega': 'bg-blue-100 text-blue-800',
      'entregue': 'bg-green-100 text-green-800',
      'nao_entregue': 'bg-red-100 text-red-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'aguardando': 'Aguardando',
      'em_entrega': 'Em Entrega',
      'entregue': 'Entregue',
      'nao_entregue': 'Não Entregue'
    }
    return labels[status as keyof typeof labels] || status
  }

  const calcularProgresso = () => {
    if (!dados?.itens.length) return 0
    const processados = dados.itens.filter(item => 
      item.status_entrega === 'entregue' || item.status_entrega === 'nao_entregue'
    ).length
    return Math.round((processados / dados.itens.length) * 100)
  }

  const todosProcessados = dados?.itens.every(item => 
    item.status_entrega === 'entregue' || item.status_entrega === 'nao_entregue'
  ) || false

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
            <Link href="/entrega">Voltar para Entrega</Link>
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
            <Link href="/entrega">Voltar para Entrega</Link>
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
            <Link href="/entrega">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Entrega da Solicitação</h1>
            <p className="text-gray-600">
              {dados.solicitacao.praca_destino?.nome} • {formatDate(new Date(dados.solicitacao.created_at))}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{progresso}%</div>
            <div className="text-sm text-gray-500">Processado</div>
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
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold">{dados.solicitacao.praca_destino?.nome}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Responsável da Praça</label>
                  <p className="text-sm">{dados.solicitacao.praca_destino?.responsavel || 'Não definido'}</p>
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
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  {todosProcessados ? (
                    <Button 
                      onClick={handleFinalizarEntrega}
                      disabled={processando === 'finalizar'}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processando === 'finalizar' ? 'Finalizando...' : 'Finalizar Entrega'}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={handleCancelarEntrega}
                      disabled={processando === 'cancelar'}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {processando === 'cancelar' ? 'Cancelando...' : 'Cancelar Entrega'}
                    </Button>
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
                  Itens para Entrega ({dados.itens.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dados.itens.map((item) => {
                    const statusAtual = itensStatus[item.item_id] || { status: null, observacoes: '' }
                    const jaProcessado = item.status_entrega === 'entregue' || item.status_entrega === 'nao_entregue'
                    
                    return (
                      <div key={item.item_id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.produto_descricao}</h3>
                            <p className="text-sm text-gray-600">
                              {item.produto_grupo} • {item.produto_subgrupo}
                            </p>
                          </div>
                          <Badge className={getStatusBadge(item.status_entrega)}>
                            {getStatusLabel(item.status_entrega)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Qtd. Separada</label>
                            <p className="text-lg font-semibold">{item.quantidade_separada}</p>
                          </div>
                          {item.observacoes_separacao && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Obs. Separação</label>
                              <p className="text-sm text-gray-700">{item.observacoes_separacao}</p>
                            </div>
                          )}
                        </div>

                        {jaProcessado ? (
                          <div className="space-y-2">
                            {item.entregue_por && (
                              <p className="text-sm text-gray-600">
                                Processado por: {item.entregue_por}
                              </p>
                            )}
                            {item.observacoes_entrega && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Observações da Entrega</label>
                                <p className="text-sm bg-gray-50 p-2 rounded">{item.observacoes_entrega}</p>
                              </div>
                            )}
                            {item.tempo_entrega_minutos && (
                              <p className="text-sm text-gray-600">
                                <Clock className="inline h-4 w-4 mr-1" />
                                Processado em {Math.round(item.tempo_entrega_minutos)} minutos
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Checkboxes para status */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-600">Status da Entrega</label>
                              <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`entregue-${item.item_id}`}
                                    checked={statusAtual.status === 'entregue'}
                                    onCheckedChange={() => handleStatusChange(item.item_id, 'entregue')}
                                  />
                                  <label 
                                    htmlFor={`entregue-${item.item_id}`}
                                    className="text-sm font-medium text-green-700"
                                  >
                                    Entregue
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`nao-entregue-${item.item_id}`}
                                    checked={statusAtual.status === 'nao_entregue'}
                                    onCheckedChange={() => handleStatusChange(item.item_id, 'nao_entregue')}
                                  />
                                  <label 
                                    htmlFor={`nao-entregue-${item.item_id}`}
                                    className="text-sm font-medium text-red-700"
                                  >
                                    Não Entregue
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Campo de observações (obrigatório para não entregue) */}
                            {statusAtual.status && (
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Observações {statusAtual.status === 'nao_entregue' && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                  value={statusAtual.observacoes}
                                  onChange={(e) => handleObservacoesChange(item.item_id, e.target.value)}
                                  rows={2}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  placeholder={
                                    statusAtual.status === 'nao_entregue' 
                                      ? "Por que não foi entregue? (obrigatório)"
                                      : "Observações sobre a entrega (opcional)"
                                  }
                                />
                              </div>
                            )}

                            {/* Botão confirmar */}
                            <Button 
                              onClick={() => handleConfirmarItem(item.item_id)}
                              disabled={!statusAtual.status || processando === item.item_id}
                              size="sm"
                              className="w-full"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {processando === item.item_id ? 'Confirmando...' : 'Confirmar'}
                            </Button>

                            {sucessos[item.item_id] && (
                              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                <CheckCircle className="h-4 w-4" />
                                Item confirmado com sucesso!
                              </div>
                            )}
                            {errors[item.item_id] && (
                              <p className="text-red-600 text-sm">{errors[item.item_id]}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}