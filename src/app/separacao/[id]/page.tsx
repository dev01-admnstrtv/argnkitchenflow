'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  buscarDetalhesSeparacao, 
  iniciarSeparacaoItem, 
  concluirSeparacaoItem,
  cancelarSeparacaoItem,
  aplicarAjustesEstoque,
  calcularImpactoEstoque
} from '@/lib/actions/separacao'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Package, 
  User,
  Timer as TimerIcon,
  FileText,
  Save,
  X
} from 'lucide-react'
import { Timer } from '@/components/ui/timer'
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
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)
  const [itemEditando, setItemEditando] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    quantidade_separada: '',
    status: 'separado',
    observacoes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tempoAtual, setTempoAtual] = useState(new Date())

  // Usuário fixo para teste (depois será dinâmico)
  const usuarioId = '0f4a00bb-a9fd-4e00-ad29-f6e2bf1b4d47'

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      try {
        const [dadosResult, impactoResult] = await Promise.all([
          buscarDetalhesSeparacao(params.id),
          calcularImpactoEstoque(params.id)
        ])
        
        if (dadosResult.success) {
          setDados(dadosResult.data || null)
        } else {
          setErrors({ load: dadosResult.error || 'Erro ao carregar dados' })
        }
        if (impactoResult.success) {
          setImpactoEstoque(impactoResult.data)
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

  // Atualizar tempo a cada segundo para mostrar cronômetro
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoAtual(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])


  const handleIniciarSeparacao = async (itemId: string) => {
    setProcessando(itemId)
    try {
      const resultado = await iniciarSeparacaoItem(itemId, usuarioId)
      if (resultado.success) {
        await carregarDados()
      } else {
        setErrors({ [itemId]: resultado.error || 'Erro ao iniciar separação' })
      }
    } catch (error) {
      console.error('Erro ao iniciar separação:', error)
      setErrors({ [itemId]: 'Erro inesperado' })
    } finally {
      setProcessando(null)
    }
  }

  const handleCancelarSeparacao = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja cancelar a separação deste item?')) return

    setProcessando(itemId)
    try {
      const resultado = await cancelarSeparacaoItem(itemId)
      if (resultado.success) {
        await carregarDados()
      } else {
        setErrors({ [itemId]: resultado.error || 'Erro ao cancelar separação' })
      }
    } catch (error) {
      console.error('Erro ao cancelar separação:', error)
      setErrors({ [itemId]: 'Erro inesperado' })
    } finally {
      setProcessando(null)
    }
  }

  const handleEditarItem = (item: ItemSeparacao) => {
    setItemEditando(item.item_id)
    setFormData({
      quantidade_separada: item.quantidade_separada?.toString() || item.quantidade_solicitada.toString(),
      status: item.status_separacao === 'separando' ? 'separado' : item.status_separacao,
      observacoes: item.observacoes_separacao || ''
    })
    setErrors({})
  }

  const handleSalvarItem = async () => {
    if (!itemEditando) return

    setProcessando(itemEditando)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('item_id', itemEditando)
      formDataToSend.append('quantidade_separada', formData.quantidade_separada)
      formDataToSend.append('status', formData.status)
      formDataToSend.append('observacoes', formData.observacoes)

      const resultado = await concluirSeparacaoItem(formDataToSend)
      if (resultado.success) {
        setItemEditando(null)
        await carregarDados()
      } else {
        setErrors({ [itemEditando]: resultado.error || 'Erro ao salvar item' })
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      setErrors({ [itemEditando]: 'Erro inesperado' })
    } finally {
      setProcessando(null)
    }
  }

  const handleCancelarEdicao = () => {
    setItemEditando(null)
    setFormData({ quantidade_separada: '', status: 'separado', observacoes: '' })
    setErrors({})
  }

  const handleAplicarAjustesEstoque = async () => {
    if (!confirm('Aplicar ajustes no estoque para todos os itens separados?')) return

    setProcessando('estoque')
    try {
      const resultado = await aplicarAjustesEstoque(params.id)
      if (resultado.success) {
        alert(`${resultado.data?.ajustes || 0} ajustes aplicados no estoque`)
        await carregarDados()
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

  const calcularTempoSeparacao = (iniciado: string | null) => {
    if (!iniciado) return null
    const inicio = new Date(iniciado)
    const diferencaMinutos = Math.floor((tempoAtual.getTime() - inicio.getTime()) / 60000)
    return diferencaMinutos
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
                  <Button 
                    onClick={handleAplicarAjustesEstoque}
                    disabled={processando === 'estoque' || progresso < 100}
                    className="w-full"
                  >
                    {processando === 'estoque' ? 'Aplicando...' : 'Aplicar Ajustes de Estoque'}
                  </Button>
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
                          <p className="text-lg font-semibold">{item.quantidade_separada || 0}</p>
                        </div>
                      </div>

                      {item.status_separacao === 'separando' && item.iniciado_separacao_em && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
                          <Timer 
                            startTime={item.iniciado_separacao_em} 
                            className="text-blue-600"
                            format="text"
                          />
                          {item.separado_por && (
                            <span className="text-gray-600">• por {item.separado_por}</span>
                          )}
                        </div>
                      )}

                      {item.observacoes_separacao && (
                        <div className="mb-3">
                          <label className="text-sm font-medium text-gray-600">Observações da Separação</label>
                          <p className="text-sm bg-gray-50 p-2 rounded">{item.observacoes_separacao}</p>
                        </div>
                      )}

                      {/* Formulário de edição */}
                      {itemEditando === item.item_id ? (
                        <div className="space-y-3 bg-gray-50 p-3 rounded">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Quantidade Separada</label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={item.quantidade_solicitada}
                                value={formData.quantidade_separada}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantidade_separada: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Status</label>
                              <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="separado">Separado</option>
                                <option value="em_falta">Em Falta</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Observações</label>
                            <textarea
                              value={formData.observacoes}
                              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                              rows={2}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              placeholder="Observações sobre a separação..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleSalvarItem}
                              disabled={processando === item.item_id}
                              size="sm"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {processando === item.item_id ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={handleCancelarEdicao}
                              size="sm"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                          {errors[item.item_id] && (
                            <p className="text-red-600 text-sm">{errors[item.item_id]}</p>
                          )}
                        </div>
                      ) : (
                        /* Botões de ação */
                        <div className="flex gap-2">
                          {item.status_separacao === 'aguardando' && (
                            <Button 
                              onClick={() => handleIniciarSeparacao(item.item_id)}
                              disabled={processando === item.item_id}
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {processando === item.item_id ? 'Iniciando...' : 'Iniciar'}
                            </Button>
                          )}
                          {item.status_separacao === 'separando' && (
                            <>
                              <Button 
                                onClick={() => handleEditarItem(item)}
                                size="sm"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Concluir
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleCancelarSeparacao(item.item_id)}
                                disabled={processando === item.item_id}
                                size="sm"
                              >
                                <Pause className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            </>
                          )}
                          {(item.status_separacao === 'separado' || item.status_separacao === 'em_falta') && (
                            <Button 
                              variant="outline"
                              onClick={() => handleEditarItem(item)}
                              size="sm"
                            >
                              Editar
                            </Button>
                          )}
                        </div>
                      )}

                      {errors[item.item_id] && !itemEditando && (
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