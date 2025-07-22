'use client'

import { useEffect, useState, useCallback } from 'react'
import { buscarFichasTecnicas, alternarStatusFichaTecnica } from '@/lib/actions/fichastecnicas'
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
  ChefHat,
  Clock,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  Image
} from 'lucide-react'
import Link from 'next/link'
import { FichaTecnica, CategoriaFicha, DificuldadeFicha } from '@/types'

export default function FichasTecnicasPage() {
  const [fichas, setFichas] = useState<FichaTecnica[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFicha | ''>('')
  const [dificuldadeFiltro, setDificuldadeFiltro] = useState<DificuldadeFicha | ''>('')
  const [statusFiltro, setStatusFiltro] = useState<boolean | undefined>(undefined)
  const [showFiltros, setShowFiltros] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const carregarDados = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const resultado = await buscarFichasTecnicas(
        filtro || undefined,
        categoriaFiltro || undefined,
        dificuldadeFiltro || undefined,
        statusFiltro,
        page
      )

      if (resultado.success) {
        setFichas(resultado.data || [])
        setTotalPages(resultado.totalPages || 1)
        setTotal(resultado.total || 0)
        setCurrentPage(resultado.currentPage || 1)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [filtro, categoriaFiltro, dificuldadeFiltro, statusFiltro])

  useEffect(() => {
    carregarDados(1)
  }, [carregarDados])

  const handleToggleStatus = async (id: string, nome: string) => {
    const ficha = fichas.find(f => f.id === id)
    const acao = ficha?.ativo ? 'desativar' : 'ativar'
    
    if (confirm(`Tem certeza que deseja ${acao} a ficha técnica "${nome}"?`)) {
      const resultado = await alternarStatusFichaTecnica(id)
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
    setCategoriaFiltro('')
    setDificuldadeFiltro('')
    setStatusFiltro(undefined)
    setCurrentPage(1)
  }

  const getCategoriaIcon = (categoria: CategoriaFicha) => {
    const icons = {
      'prato': '🍽️',
      'bebida': '🥤',
      'sobremesa': '🍰',
      'entrada': '🥗'
    }
    return icons[categoria] || '🍽️'
  }

  const getCategoriaLabel = (categoria: CategoriaFicha) => {
    const labels = {
      'prato': 'Prato',
      'bebida': 'Bebida',
      'sobremesa': 'Sobremesa',
      'entrada': 'Entrada'
    }
    return labels[categoria] || 'Prato'
  }

  const getDificuldadeColor = (dificuldade: DificuldadeFicha) => {
    const colors = {
      'facil': 'bg-green-100 text-green-800',
      'medio': 'bg-yellow-100 text-yellow-800',
      'dificil': 'bg-red-100 text-red-800'
    }
    return colors[dificuldade] || 'bg-gray-100 text-gray-800'
  }

  const getDificuldadeLabel = (dificuldade: DificuldadeFicha) => {
    const labels = {
      'facil': 'Fácil',
      'medio': 'Médio',
      'dificil': 'Difícil'
    }
    return labels[dificuldade] || 'Médio'
  }

  if (loading && fichas.length === 0) {
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
            <h1 className="text-3xl font-bold">Fichas Técnicas</h1>
            <p className="text-gray-600">Total: {total} fichas</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/fichastecnicas/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Ficha
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
              placeholder="Pesquisar fichas técnicas..."
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
          {(categoriaFiltro || dificuldadeFiltro || statusFiltro !== undefined) && (
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>

        {showFiltros && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value as CategoriaFicha | '')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todas as categorias</option>
                  <option value="prato">Prato</option>
                  <option value="bebida">Bebida</option>
                  <option value="sobremesa">Sobremesa</option>
                  <option value="entrada">Entrada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Dificuldade</label>
                <select
                  value={dificuldadeFiltro}
                  onChange={(e) => setDificuldadeFiltro(e.target.value as DificuldadeFicha | '')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todas as dificuldades</option>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
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

      {/* Lista de Fichas Técnicas */}
      {fichas.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma ficha técnica encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/fichastecnicas/nova">
              Criar primeira ficha
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fichas.map((ficha) => (
              <Card key={ficha.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{getCategoriaIcon(ficha.categoria)}</span>
                      <div>
                        <CardTitle className="text-lg line-clamp-2">
                          {ficha.nome}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {getCategoriaLabel(ficha.categoria)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={ficha.ativo ? "default" : "secondary"}>
                      {ficha.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ficha.descricao && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ficha.descricao}
                    </p>
                  )}

                  <div className="space-y-2">
                    {ficha.tempo_preparo && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Tempo:</span>
                        <span className="font-medium">{ficha.tempo_preparo} min</span>
                      </div>
                    )}

                    {ficha.rendimento && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Rendimento:</span>
                        <span className="font-medium">{ficha.rendimento} porções</span>
                      </div>
                    )}

                    {ficha.dificuldade && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Dificuldade:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDificuldadeColor(ficha.dificuldade)}`}>
                          {getDificuldadeLabel(ficha.dificuldade)}
                        </span>
                      </div>
                    )}

                    {ficha.custo_estimado && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Custo estimado:</span>
                        <span className="font-medium">R$ {ficha.custo_estimado.toFixed(2)}</span>
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
                        <Link href={`/fichastecnicas/${ficha.id}`}>
                          <Image className="h-4 w-4 mr-1" alt="" />
                          Ver Detalhes
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
                        <Link href={`/fichastecnicas/${ficha.id}/editar`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(ficha.id, ficha.nome)}
                      >
                        <Power className="h-4 w-4" />
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