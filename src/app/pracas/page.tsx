'use client'

import { useEffect, useState, useCallback } from 'react'
import { buscarPracas, alternarStatusPraca, buscarEstatisticasPraca } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { 
  Search, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Power,
  Building2,
  Users,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  History,
  ChefHat
} from 'lucide-react'
import Link from 'next/link'
import { PracaDestino } from '@/types'

interface PracaComEstatisticas extends PracaDestino {
  estatisticas?: {
    total: number
    pendentes: number
    separando: number
    entregues: number
    confirmadas: number
    ultimaSolicitacao: number | null
  }
}

export default function PracasPage() {
  const [pracas, setPracas] = useState<PracaComEstatisticas[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<boolean | undefined>(undefined)
  const [showFiltros, setShowFiltros] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const carregarDados = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const resultado = await buscarPracas(
        filtro || undefined, 
        tipoFiltro || undefined, 
        statusFiltro, 
        page
      )

      if (resultado.success) {
        const pracasComEstatisticas = await Promise.all(
          (resultado.data || []).map(async (praca) => {
            const estatisticas = await buscarEstatisticasPraca(praca.id)
            return {
              ...praca,
              estatisticas: estatisticas.success ? estatisticas.data : undefined
            }
          })
        )

        setPracas(pracasComEstatisticas)
        setTotalPages(resultado.totalPages || 1)
        setTotal(resultado.total || 0)
        setCurrentPage(resultado.currentPage || 1)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [filtro, tipoFiltro, statusFiltro])

  useEffect(() => {
    carregarDados(1)
  }, [carregarDados])

  const handleToggleStatus = async (id: string, nome: string) => {
    const praca = pracas.find(p => p.id === id)
    const acao = praca?.ativo ? 'desativar' : 'ativar'
    
    if (confirm(`Tem certeza que deseja ${acao} a praça "${nome}"?`)) {
      const resultado = await alternarStatusPraca(id)
      if (resultado.success) {
        carregarDados(currentPage)
      } else {
        alert('Erro ao alterar status: ' + resultado.error)
      }
    }
  }

  const handlePageChange = (page: number) => {
    carregarDados(page)
  }

  const limparFiltros = () => {
    setFiltro('')
    setTipoFiltro('')
    setStatusFiltro(undefined)
    setCurrentPage(1)
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

  const getTipoLabel = (tipo: string) => {
    const labels = {
      'cozinha': 'Cozinha',
      'salao': 'Salão',
      'bar': 'Bar',
      'estoque': 'Estoque',
      'limpeza': 'Limpeza',
      'escritorio': 'Escritório',
      'geral': 'Geral'
    }
    return labels[tipo as keyof typeof labels] || 'Geral'
  }

  if (loading && pracas.length === 0) {
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
            <h1 className="text-3xl font-bold">Praças</h1>
            <p className="text-gray-600">Total: {total} praças</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/pracas/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Praça
          </Link>
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Pesquisar praças..."
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
          {(tipoFiltro || statusFiltro !== undefined) && (
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>

        {showFiltros && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todos os tipos</option>
                  <option value="cozinha">Cozinha</option>
                  <option value="salao">Salão</option>
                  <option value="bar">Bar</option>
                  <option value="estoque">Estoque</option>
                  <option value="limpeza">Limpeza</option>
                  <option value="escritorio">Escritório</option>
                  <option value="geral">Geral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFiltro === undefined ? '' : statusFiltro.toString()}
                  onChange={(e) => setStatusFiltro(e.target.value === '' ? undefined : e.target.value === 'true')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todos</option>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Praças */}
      {pracas.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma praça encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/pracas/nova">
              Criar primeira praça
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pracas.map((praca) => (
              <Card key={praca.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{getTipoIcon(praca.tipo)}</span>
                      <div>
                        <CardTitle className="text-lg line-clamp-2">
                          {praca.nome}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {getTipoLabel(praca.tipo)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={praca.ativo ? "default" : "secondary"}>
                      {praca.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {praca.descricao && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {praca.descricao}
                    </p>
                  )}

                  <div className="space-y-2">
                    {praca.responsavel && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Responsável:</span>
                        <span className="font-medium">{praca.responsavel}</span>
                      </div>
                    )}

                    {praca.limite_produtos && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Limite de produtos:</span>
                        <span className="font-medium">{praca.limite_produtos}</span>
                      </div>
                    )}

                    {praca.capacidade_maxima && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Capacidade máxima:</span>
                        <span className="font-medium">{praca.capacidade_maxima}</span>
                      </div>
                    )}

                    {praca.estatisticas && (
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Solicitações:</span>
                          <span className="font-medium">{praca.estatisticas.total}</span>
                        </div>
                        {praca.estatisticas.pendentes > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-yellow-600">Pendentes:</span>
                            <span className="font-medium text-yellow-600">{praca.estatisticas.pendentes}</span>
                          </div>
                        )}
                        {praca.estatisticas.ultimaSolicitacao && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            Última: {formatDate(new Date(praca.estatisticas.ultimaSolicitacao))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/pracas/${praca.id}/solicitacoes`}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Solicitações
                        </Link>
                      </Button>
                      
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/pracas/${praca.id}/fichastecnicas`}>
                          <ChefHat className="h-4 w-4 mr-1" />
                          Fichas Técnicas
                        </Link>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/pracas/${praca.id}/editar`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Link>
                      </Button>
                      
                    </div>
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