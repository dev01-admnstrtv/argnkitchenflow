'use client'

import { useEffect, useState } from 'react'
import { buscarSolicitacoesParaEntrega, buscarEstatisticasEntrega, iniciarEntregaSolicitacao } from '@/lib/actions/entrega'
import { buscarPracasDestino } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { 
  Search, 
  ArrowLeft, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  Users,
  CheckCircle,
  Truck,
  AlertCircle,
  Play,
  BarChart3,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

interface SolicEntrega {
  solicitacao_id: string
  created_at: string
  prioridade: string
  prioridade_calculada: number
  status: string
  observacoes: string
  praca_destino: string
  tipo_praca: string
  responsavel_praca: string
  solicitante: string
  total_itens: number
  itens_entregues: number
  itens_nao_entregues: number
  itens_aguardando: number
  itens_em_entrega: number
  iniciado_entrega_em: string | null
  concluido_entrega_em: string | null
  percentual_entregue: number
  minutos_desde_separacao: number
}

interface EstatisticasEntrega {
  solicitacoes_prontas: number
  solicitacoes_em_entrega: number
  solicitacoes_entregues_hoje: number
  itens_aguardando: number
  itens_em_entrega: number
  tempo_medio_entrega: number
}

export default function EntregaPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicEntrega[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasEntrega | null>(null)
  const [pracas, setPracas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [prioridadeFiltro, setPrioridadeFiltro] = useState('')
  const [pracaFiltro, setPracaFiltro] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Usuário fixo para teste (depois será dinâmico)
  const usuarioId = '0f4a00bb-a9fd-4e00-ad29-f6e2bf1b4d47'

  useEffect(() => {
    const carregarDados = async (page = 1) => {
      setLoading(true)
      try {
        const [solicitacoesResult, estatisticasResult, pracasResult] = await Promise.all([
          buscarSolicitacoesParaEntrega(filtro || undefined, prioridadeFiltro || undefined, pracaFiltro || undefined, page),
          buscarEstatisticasEntrega(),
          buscarPracasDestino()
        ])

        if (solicitacoesResult.success) {
          setSolicitacoes(solicitacoesResult.data || [])
          setTotalPages(solicitacoesResult.totalPages || 1)
          setTotal(solicitacoesResult.total || 0)
          setCurrentPage(solicitacoesResult.currentPage || 1)
        }

        if (estatisticasResult.success) {
          setEstatisticas(estatisticasResult.data || null)
        }

        if (pracasResult.success) {
          setPracas(pracasResult.data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados(1)
  }, [filtro, prioridadeFiltro, pracaFiltro])

  const handlePageChange = (page: number) => {
    setLoading(true)
    Promise.resolve().then(async () => {
      try {
        const solicitacoesResult = await buscarSolicitacoesParaEntrega(
          filtro || undefined, 
          prioridadeFiltro || undefined, 
          pracaFiltro || undefined, 
          page
        )
        
        if (solicitacoesResult.success) {
          setSolicitacoes(solicitacoesResult.data || [])
          setTotalPages(solicitacoesResult.totalPages || 1)
          setTotal(solicitacoesResult.total || 0)
          setCurrentPage(solicitacoesResult.currentPage || 1)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    })
  }

  const handleIniciarEntrega = async (solicitacaoId: string) => {
    setProcessando(solicitacaoId)
    try {
      const resultado = await iniciarEntregaSolicitacao(solicitacaoId, usuarioId)
      if (resultado.success) {
        // Redirecionar para página individual de entrega
        window.location.href = `/entrega/${solicitacaoId}`
      } else {
        alert('Erro ao iniciar entrega: ' + resultado.error)
      }
    } catch (error) {
      console.error('Erro ao iniciar entrega:', error)
      alert('Erro inesperado ao iniciar entrega')
    } finally {
      setProcessando(null)
    }
  }

  const limparFiltros = () => {
    setFiltro('')
    setPrioridadeFiltro('')
    setPracaFiltro('')
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

  const getTempoEspera = (minutos: number) => {
    if (minutos < 60) {
      return `${Math.round(minutos)}min`
    } else if (minutos < 1440) {
      return `${Math.round(minutos / 60)}h`
    } else {
      return `${Math.round(minutos / 1440)}d`
    }
  }

  const getCorTempoEspera = (minutos: number) => {
    if (minutos > 120) return 'text-red-600' // Mais de 2 horas
    if (minutos > 60) return 'text-orange-600' // Mais de 1 hora
    return 'text-green-600'
  }

  if (loading && solicitacoes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Entrega</h1>
            <p className="text-gray-600">Controle de entrega de solicitações</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Prontas para Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estatisticas.solicitacoes_prontas}</div>
              <div className="text-sm text-gray-500">
                <Package className="inline h-4 w-4 mr-1" />
                Separadas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Em Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estatisticas.solicitacoes_em_entrega}</div>
              <div className="text-sm text-gray-500">
                <Truck className="inline h-4 w-4 mr-1" />
                Em andamento
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Entregues Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estatisticas.solicitacoes_entregues_hoje}</div>
              <div className="text-sm text-gray-500">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Finalizadas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Itens Aguardando</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{estatisticas.itens_aguardando}</div>
              <div className="text-sm text-gray-500">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Não iniciados
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{Math.round(estatisticas.tempo_medio_entrega)}min</div>
              <div className="text-sm text-gray-500">
                <Clock className="inline h-4 w-4 mr-1" />
                Por entrega
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Pesquisar por praça ou solicitante..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFiltros(!showFiltros)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          {(prioridadeFiltro || pracaFiltro) && (
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>

        {showFiltros && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prioridade</label>
                <select
                  value={prioridadeFiltro}
                  onChange={(e) => setPrioridadeFiltro(e.target.value)}
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
                <label className="block text-sm font-medium mb-2">Praça</label>
                <select
                  value={pracaFiltro}
                  onChange={(e) => setPracaFiltro(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todas as praças</option>
                  {pracas.map(praca => (
                    <option key={praca.id} value={praca.nome}>{praca.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Solicitações */}
      {solicitacoes.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma solicitação pronta para entrega</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {solicitacoes.map((solicitacao) => (
              <Card key={solicitacao.solicitacao_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTipoIcon(solicitacao.tipo_praca)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{solicitacao.praca_destino}</CardTitle>
                          <Badge className={getPrioridadeBadge(solicitacao.prioridade)}>
                            {solicitacao.prioridade}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Prioridade: {solicitacao.prioridade_calculada}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Solicitado por: {solicitacao.solicitante} • {formatDate(new Date(solicitacao.created_at))}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      Pronto para entrega
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {solicitacao.observacoes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {solicitacao.observacoes}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{solicitacao.total_itens}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Responsável:</span>
                      <span className="font-medium">{solicitacao.responsavel_praca || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Aguardando:</span>
                      <span className={`font-medium ${getCorTempoEspera(solicitacao.minutos_desde_separacao)}`}>
                        {getTempoEspera(solicitacao.minutos_desde_separacao)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium capitalize">{solicitacao.tipo_praca}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/solicitacoes/${solicitacao.solicitacao_id}`}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Detalhes
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/entrega/${solicitacao.solicitacao_id}`}>
                          <Truck className="h-4 w-4 mr-1" />
                          Entrega
                        </Link>
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleIniciarEntrega(solicitacao.solicitacao_id)}
                      disabled={processando === solicitacao.solicitacao_id}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {processando === solicitacao.solicitacao_id ? 'Iniciando...' : 'Iniciar Entrega'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
        </>
      )}
    </div>
  )
}