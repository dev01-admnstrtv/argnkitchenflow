'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { buscarHistoricoSolicitacoesPorPraca, buscarPracaPorId } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleGroup } from '@/components/ui/collapsible'
import { formatDate } from '@/lib/utils'
import { 
  ArrowLeft, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Clock,
  FileText,
  Calendar,
  BarChart3,
  TrendingUp,
  Download
} from 'lucide-react'
import Link from 'next/link'

interface SolicitacaoHistorico {
  id: string
  created_at: string
  prioridade: string
  status: string
  observacoes: string
  tipo: string
  solicitante: any
  praca_destino: any
  itens_solicitacao: any[]
}

interface HistoricoPageProps {
  params: { id: string }
}

export default function HistoricoSolicitacoesPracaPage({ params }: HistoricoPageProps) {
  const router = useRouter()
  const [praca, setPraca] = useState<any>(null)
  const [historico, setHistorico] = useState<Record<string, SolicitacaoHistorico[]>>({})
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroPrioridade, setFiltroPrioridade] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const carregarDados = async (page = 1) => {
      setLoading(true)
      try {
        const [pracaResult, historicoResult] = await Promise.all([
          buscarPracaPorId(params.id),
          buscarHistoricoSolicitacoesPorPraca(
            params.id,
            filtroStatus || undefined,
            filtroPrioridade || undefined,
            dataInicio || undefined,
            dataFim || undefined,
            page
          )
        ])

        if (pracaResult.success) {
          setPraca(pracaResult.data)
        }

        if (historicoResult.success) {
          setHistorico(historicoResult.data)
          setTotalPages(historicoResult.totalPages || 1)
          setTotal(historicoResult.total || 0)
          setCurrentPage(historicoResult.currentPage || 1)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados(1)
  }, [params.id, filtroStatus, filtroPrioridade, dataInicio, dataFim])

  const handlePageChange = (page: number) => {
    setLoading(true)
    Promise.resolve().then(async () => {
      try {
        const historicoResult = await buscarHistoricoSolicitacoesPorPraca(
          params.id,
          filtroStatus || undefined,
          filtroPrioridade || undefined,
          dataInicio || undefined,
          dataFim || undefined,
          page
        )

        if (historicoResult.success) {
          setHistorico(historicoResult.data)
          setTotalPages(historicoResult.totalPages || 1)
          setTotal(historicoResult.total || 0)
          setCurrentPage(historicoResult.currentPage || 1)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    })
  }

  const limparFiltros = () => {
    setFiltroStatus('')
    setFiltroPrioridade('')
    setDataInicio('')
    setDataFim('')
    setCurrentPage(1)
  }

  const getPrioridadeBadge = (prioridade: string) => {
    const styles = {
      'urgente': 'bg-red-500 text-white',
      'alta': 'bg-orange-500 text-white',
      'normal': 'bg-blue-500 text-white',
      'baixa': 'bg-gray-500 text-white'
    }
    return styles[prioridade as keyof typeof styles] || 'bg-gray-500 text-white'
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'separando': 'bg-blue-100 text-blue-800',
      'entregue': 'bg-green-100 text-green-800',
      'confirmada': 'bg-purple-100 text-purple-800',
      'rejeitada': 'bg-red-100 text-red-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      'pendente': 'Pendente',
      'separando': 'Separando',
      'entregue': 'Entregue',
      'confirmada': 'Confirmada',
      'rejeitada': 'Rejeitada'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getTipoIcon = (tipo: string) => {
    const icons = {
      'cozinha': '👨‍🍳',
      'salao': '🏛️',
      'bar': '🍺',
      'estoque': '📦',
      'limpeza': '🧽',
      'escritorio': '🏢',
      'geral': '🏪'
    }
    return icons[tipo as keyof typeof icons] || '🏪'
  }

  const calcularEstatisticasDia = (solicitacoes: SolicitacaoHistorico[]) => {
    const total = solicitacoes.length
    const pendentes = solicitacoes.filter(s => s.status === 'pendente').length
    const entregues = solicitacoes.filter(s => s.status === 'entregue').length
    const confirmadas = solicitacoes.filter(s => s.status === 'confirmada').length
    const totalItens = solicitacoes.reduce((sum, s) => sum + (s.itens_solicitacao?.length || 0), 0)

    return { total, pendentes, entregues, confirmadas, totalItens }
  }

  const datasOrdenadas = Object.keys(historico).sort((a, b) => {
    const dataA = new Date(a.split('/').reverse().join('-'))
    const dataB = new Date(b.split('/').reverse().join('-'))
    return dataB.getTime() - dataA.getTime()
  })

  if (loading && Object.keys(historico).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href={`/pracas/${params.id}/solicitacoes`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              {praca && (
                <>
                  <span className="text-3xl">{getTipoIcon(praca.tipo)}</span>
                  <div>
                    <h1 className="text-3xl font-bold">Histórico - {praca.nome}</h1>
                    <p className="text-gray-600">Histórico de solicitações • {total} no total</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Resumo Geral */}
        {praca && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo do Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{total}</div>
                  <div className="text-sm text-gray-500">Total de Solicitações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(historico).flat().filter(s => s.status === 'confirmada').length}
                  </div>
                  <div className="text-sm text-gray-500">Confirmadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.values(historico).flat().filter(s => s.status === 'pendente').length}
                  </div>
                  <div className="text-sm text-gray-500">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.values(historico).flat().reduce((sum, s) => sum + (s.itens_solicitacao?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total de Itens</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 items-center">
            <Button
              variant="outline"
              onClick={() => setShowFiltros(!showFiltros)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            {(filtroStatus || filtroPrioridade || dataInicio || dataFim) && (
              <Button variant="outline" onClick={limparFiltros}>
                Limpar Filtros
              </Button>
            )}
          </div>

          {showFiltros && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Todos os status</option>
                    <option value="pendente">Pendente</option>
                    <option value="separando">Separando</option>
                    <option value="entregue">Entregue</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="rejeitada">Rejeitada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridade</label>
                  <select
                    value={filtroPrioridade}
                    onChange={(e) => setFiltroPrioridade(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Todas as prioridades</option>
                    <option value="urgente">Urgente</option>
                    <option value="alta">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data Início</label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data Fim</label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Histórico Agrupado por Data */}
        {Object.keys(historico).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma solicitação encontrada no histórico</p>
          </div>
        ) : (
          <CollapsibleGroup>
            {datasOrdenadas.map((data) => {
              const solicitacoesDia = historico[data]
              const stats = calcularEstatisticasDia(solicitacoesDia)
              
              return (
                <Collapsible
                  key={data}
                  title={data}
                  itemCount={stats.total}
                  defaultOpen={data === datasOrdenadas[0]} // Abrir o primeiro (mais recente)
                >
                  {/* Estatísticas do Dia */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">{stats.total}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-yellow-600">{stats.pendentes}</div>
                        <div className="text-xs text-gray-500">Pendentes</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">{stats.entregues}</div>
                        <div className="text-xs text-gray-500">Entregues</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">{stats.confirmadas}</div>
                        <div className="text-xs text-gray-500">Confirmadas</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-600">{stats.totalItens}</div>
                        <div className="text-xs text-gray-500">Itens</div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Solicitações do Dia */}
                  <div className="space-y-3">
                    {solicitacoesDia.map((solicitacao) => (
                      <div key={solicitacao.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <h4 className="font-medium">
                                {solicitacao.solicitante?.nome || 'Solicitante não identificado'}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {new Date(solicitacao.created_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPrioridadeBadge(solicitacao.prioridade)}>
                              {solicitacao.prioridade}
                            </Badge>
                            <Badge className={getStatusBadge(solicitacao.status)}>
                              {getStatusLabel(solicitacao.status)}
                            </Badge>
                          </div>
                        </div>

                        {solicitacao.observacoes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-2">
                            {solicitacao.observacoes}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span>{solicitacao.itens_solicitacao?.length || 0} itens</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="capitalize">{solicitacao.tipo}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/solicitacoes/${solicitacao.id}`}>
                              Detalhes
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Collapsible>
              )
            })}
          </CollapsibleGroup>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}