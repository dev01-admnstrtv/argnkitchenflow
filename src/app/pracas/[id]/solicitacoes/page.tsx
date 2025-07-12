'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { buscarSolicitacoesPorPraca, buscarPracaPorId } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  History,
  Calendar,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface SolicitacaoPraca {
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

interface SolicitacoesPracaPageProps {
  params: { id: string }
}

export default function SolicitacoesPracaPage({ params }: SolicitacoesPracaPageProps) {
  const router = useRouter()
  const [praca, setPraca] = useState<any>(null)
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPraca[]>([])
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
        const [pracaResult, solicitacoesResult] = await Promise.all([
          buscarPracaPorId(params.id),
          buscarSolicitacoesPorPraca(
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
    }

    carregarDados(1)
  }, [params.id, filtroStatus, filtroPrioridade, dataInicio, dataFim])

  const handlePageChange = (page: number) => {
    setLoading(true)
    Promise.resolve().then(async () => {
      try {
        const solicitacoesResult = await buscarSolicitacoesPorPraca(
          params.id,
          filtroStatus || undefined,
          filtroPrioridade || undefined,
          dataInicio || undefined,
          dataFim || undefined,
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

  if (loading && solicitacoes.length === 0) {
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
              <Link href="/pracas">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              {praca && (
                <>
                  <span className="text-3xl">{getTipoIcon(praca.tipo)}</span>
                  <div>
                    <h1 className="text-3xl font-bold">{praca.nome}</h1>
                    <p className="text-gray-600">Solicitações da praça • {total} no total</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/pracas/${params.id}/historico`}>
                <History className="h-4 w-4 mr-1" />
                Histórico
              </Link>
            </Button>
          </div>
        </div>

        {/* Informações da Praça */}
        {praca && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações da Praça
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Responsável</label>
                  <p className="font-semibold">{praca.responsavel || 'Não definido'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo</label>
                  <p className="font-semibold capitalize">{praca.tipo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge variant={praca.ativo ? 'default' : 'secondary'}>
                    {praca.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
              {praca.descricao && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">Descrição</label>
                  <p className="text-gray-700">{praca.descricao}</p>
                </div>
              )}
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

        {/* Lista de Solicitações */}
        {solicitacoes.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma solicitação encontrada</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {solicitacoes.map((solicitacao) => (
                <Card key={solicitacao.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <CardTitle className="text-lg">
                              {solicitacao.solicitante?.nome || 'Solicitante não identificado'}
                            </CardTitle>
                            <p className="text-sm text-gray-500">
                              {formatDate(new Date(solicitacao.created_at))}
                            </p>
                          </div>
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {solicitacao.observacoes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {solicitacao.observacoes}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Itens:</span>
                        <span className="font-medium">{solicitacao.itens_solicitacao?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium capitalize">{solicitacao.tipo}</span>
                      </div>
                    </div>

                    {solicitacao.itens_solicitacao && solicitacao.itens_solicitacao.length > 0 && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium mb-2">Itens solicitados:</h4>
                        <div className="space-y-1">
                          {solicitacao.itens_solicitacao.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600 flex justify-between">
                              <span>{item.produto?.descricao || 'Produto não identificado'}</span>
                              <span className="font-medium">{item.quantidade_solicitada}</span>
                            </div>
                          ))}
                          {solicitacao.itens_solicitacao.length > 3 && (
                            <p className="text-sm text-gray-500">
                              +{solicitacao.itens_solicitacao.length - 3} itens adicionais
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/solicitacoes/${solicitacao.id}`}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Detalhes
                        </Link>
                      </Button>
                      {solicitacao.status === 'pendente' && (
                        <Button size="sm" asChild>
                          <Link href={`/separacao/${solicitacao.id}`}>
                            <Package className="h-4 w-4 mr-1" />
                            Separar
                          </Link>
                        </Button>
                      )}
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
    </div>
  )
}