'use client'

import { useEffect, useState, useCallback } from 'react'
import { buscarProdutos, buscarGruposProdutos, deletarProduto } from '@/lib/actions/produtos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { 
  Search, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  ShoppingCart,
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Link from 'next/link'
import { ProdutoComAgrupamento } from '@/types'

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoComAgrupamento[]>([])
  const [grupos, setGrupos] = useState<{grupo: string, subgrupos: string[]}[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [grupoFiltro, setGrupoFiltro] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [total, setTotal] = useState(0)
  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set())
  const [subgroupPages, setSubgroupPages] = useState<Record<string, number>>({})
  const [subgroupProducts, setSubgroupProducts] = useState<Record<string, ProdutoComAgrupamento[]>>({})
  const PRODUTOS_POR_SUBGRUPO = 6

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const [resultadoProdutos, resultadoGrupos] = await Promise.all([
        buscarProdutos(filtro || undefined, tipoFiltro || undefined, grupoFiltro || undefined, 1, 1000), // Carregar todos os produtos
        buscarGruposProdutos()
      ])

      if (resultadoProdutos.success) {
        setProdutos(resultadoProdutos.data || [])
        setTotal(resultadoProdutos.total || 0)
      }

      if (resultadoGrupos.success) {
        setGrupos(resultadoGrupos.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [filtro, tipoFiltro, grupoFiltro])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const handleDelete = async (id: string, descricao: string) => {
    if (confirm(`Tem certeza que deseja deletar o produto "${descricao}"?`)) {
      const resultado = await deletarProduto(id)
      if (resultado.success) {
        carregarDados()
      } else {
        alert('Erro ao deletar produto: ' + resultado.error)
      }
    }
  }

  const limparFiltros = () => {
    setFiltro('')
    setTipoFiltro('')
    setGrupoFiltro('')
  }

  const toggleSubgroup = (subgroupKey: string) => {
    setExpandedSubgroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subgroupKey)) {
        newSet.delete(subgroupKey)
      } else {
        newSet.add(subgroupKey)
        // Inicializar página do subgrupo se não existir
        if (!subgroupPages[subgroupKey]) {
          setSubgroupPages(prevPages => ({
            ...prevPages,
            [subgroupKey]: 1
          }))
        }
      }
      return newSet
    })
  }

  const expandAll = () => {
    const allSubgroups = agruparProdutosPorSubgrupo(produtos).map(grupo => 
      `${grupo.grupo}-${grupo.subgrupo}`
    )
    setExpandedSubgroups(new Set(allSubgroups))
  }

  const collapseAll = () => {
    setExpandedSubgroups(new Set())
  }

  const loadMoreProducts = (subgroupKey: string) => {
    setSubgroupPages(prev => ({
      ...prev,
      [subgroupKey]: (prev[subgroupKey] || 1) + 1
    }))
  }

  const getVisibleProducts = (produtos: ProdutoComAgrupamento[], subgroupKey: string) => {
    const currentPage = subgroupPages[subgroupKey] || 1
    const endIndex = currentPage * PRODUTOS_POR_SUBGRUPO
    return produtos.slice(0, endIndex)
  }

  const hasMoreProducts = (produtos: ProdutoComAgrupamento[], subgroupKey: string) => {
    const currentPage = subgroupPages[subgroupKey] || 1
    const endIndex = currentPage * PRODUTOS_POR_SUBGRUPO
    return produtos.length > endIndex
  }

  // Função para agrupar produtos por subgrupo
  const agruparProdutosPorSubgrupo = (produtos: ProdutoComAgrupamento[]) => {
    const agrupados = produtos.reduce((acc, produto) => {
      // Usar combinação de grupo + subgrupo como chave única
      const chaveUnica = `${produto.grupo}|${produto.subgrupo}`
      if (!acc[chaveUnica]) {
        acc[chaveUnica] = {
          subgrupo: produto.subgrupo,
          grupo: produto.grupo,
          produtos: []
        }
      }
      acc[chaveUnica].produtos.push(produto)
      return acc
    }, {} as Record<string, { subgrupo: string, grupo: string, produtos: ProdutoComAgrupamento[] }>)

    // Converter para array e ordenar por grupo e depois por subgrupo
    return Object.values(agrupados).sort((a, b) => {
      if (a.grupo !== b.grupo) {
        return a.grupo.localeCompare(b.grupo)
      }
      return a.subgrupo.localeCompare(b.subgrupo)
    })
  }

  if (loading && produtos.length === 0) {
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
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-gray-600">Total: {total} produtos</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/produtos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
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
              placeholder="Pesquisar produtos..."
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
          {(tipoFiltro || grupoFiltro) && (
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          )}
          {produtos.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expandir Todos
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <ChevronUp className="h-4 w-4 mr-1" />
                Recolher Todos
              </Button>
            </div>
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
                  <option value="insumo">Insumo</option>
                  <option value="produzido">Produzido</option>
                  <option value="produto">Produto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Grupo</label>
                <select
                  value={grupoFiltro}
                  onChange={(e) => setGrupoFiltro(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todos os grupos</option>
                  {grupos.map(grupo => (
                    <option key={grupo.grupo} value={grupo.grupo}>
                      {grupo.grupo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Produtos Agrupados */}
      {produtos.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
          <Button asChild className="mt-4">
            <Link href="/produtos/novo">
              Criar primeiro produto
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {agruparProdutosPorSubgrupo(produtos).map((grupo) => {
            const subgroupKey = `${grupo.grupo}-${grupo.subgrupo}`
            const isExpanded = expandedSubgroups.has(subgroupKey)
            
            return (
              <div key={subgroupKey} className="mb-6">
                {/* Cabeçalho do Grupo com Botão de Collapse/Expand */}
                <div 
                  className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSubgroup(subgroupKey)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    )}
                    <Package className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold">{grupo.grupo}</h2>
                    <span className="text-gray-400">›</span>
                    <h3 className="text-lg font-medium text-gray-700">{grupo.subgrupo}</h3>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {grupo.produtos.length} {grupo.produtos.length === 1 ? 'produto' : 'produtos'}
                  </Badge>
                </div>

                {/* Grid de Produtos do Subgrupo - Só aparece se expandido */}
                {isExpanded && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
                      {getVisibleProducts(grupo.produtos, subgroupKey).map((produto) => (
                        <Card key={produto.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-lg line-clamp-2">
                                  {produto.descricao}
                                </CardTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                  {produto.produto_id}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {produto.tipo}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              {produto.agrupamento_descricao && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Agrupamento:</span>
                                  <span className="font-medium text-blue-600">{produto.agrupamento_descricao}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Custo:</span>
                                <span className="font-medium">{formatCurrency(produto.custo || 0)}</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex-1"
                              >
                                <Link href={`/solicitacoes/nova?produto=${produto.id}`}>
                                  <ShoppingCart className="h-4 w-4 mr-1" />
                                  Solicitar
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/produtos/${produto.id}/editar`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(produto.id, produto.descricao)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Botão Carregar Mais */}
                    {hasMoreProducts(grupo.produtos, subgroupKey) && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => loadMoreProducts(subgroupKey)}
                          className="w-full max-w-md"
                        >
                          Carregar mais {PRODUTOS_POR_SUBGRUPO} produtos
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Indicador de quantidade */}
                    <div className="text-center text-sm text-gray-500 mt-2">
                      Mostrando {getVisibleProducts(grupo.produtos, subgroupKey).length} de {grupo.produtos.length} produtos
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}