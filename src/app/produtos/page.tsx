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
  Sparkles,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { ProdutoComAgrupamento } from '@/types'
import Image from 'next/image'

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoComAgrupamento[]>([])
  const [grupos, setGrupos] = useState<{grupo: string, subgrupos: string[]}[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroInput, setFiltroInput] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [grupoFiltro, setGrupoFiltro] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [total, setTotal] = useState(0)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const filtroEfetivo = filtro.length >= 3 ? filtro : undefined
      const [resultadoProdutos, resultadoGrupos] = await Promise.all([
        buscarProdutos(filtroEfetivo, tipoFiltro || undefined, grupoFiltro || undefined, 1, 1000), // Carregar todos os produtos
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
    setFiltroInput('')
    setTipoFiltro('')
    setGrupoFiltro('')
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
    <div className="min-h-screen">
      {/* Modern Header */}
      <header className="relative backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5" />
        <div className="relative container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="hover-lift glass-card">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <div className="flex items-center gap-4">
                <Image
                  src="https://www.administrative.com.br/aragon/aragon.png"
                  alt="Logo do Restaurante"
                  width={48}
                  height={48}
                  className="rounded-xl shadow-lg ring-2 ring-white/50"
                />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Catálogo de Produtos
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">Total: {total} produtos disponíveis</p>
                </div>
              </div>
            </div>
            <Button asChild className="gradient-primary text-white border-0 hover:shadow-lg hover-lift">
              <Link href="/produtos/novo">
                <Plus className="h-4 w-4 mr-2" />
                <Sparkles className="h-4 w-4 mr-1" />
                Novo Produto
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">

        {/* Search and Filters Section */}
        <div className="mb-8 space-y-6 animate-fade-in">
          <div className="glass-card p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="🔍 Pesquisar produtos (mínimo 3 caracteres)..."
                  value={filtroInput}
                  onChange={(e) => setFiltroInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && filtroInput.length >= 3 && setFiltro(filtroInput)}
                  className="pl-12 h-12 text-base focus-ring rounded-xl border-0 bg-white/50"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFiltro(filtroInput)}
                  disabled={filtroInput.length < 3}
                  className="flex items-center gap-2 hover-lift glass-card h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="h-4 w-4" />
                  Buscar Produtos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFiltros(!showFiltros)}
                  className="flex items-center gap-2 hover-lift glass-card h-12 px-6"
                >
                  <Filter className="h-4 w-4" />
                  Filtros Avançados
                </Button>
                {(tipoFiltro || grupoFiltro || filtroInput) && (
                  <Button 
                    variant="outline" 
                    onClick={limparFiltros}
                    className="hover-lift glass-card h-12 px-6 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    ✨ Limpar Filtros
                  </Button>
                )}
              </div>
            </div>

            {showFiltros && (
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">🏷️ Tipo de Produto</label>
                    <select
                      value={tipoFiltro}
                      onChange={(e) => setTipoFiltro(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus-ring bg-white shadow-sm"
                    >
                      <option value="">Todos os tipos</option>
                      <option value="insumo">🔧 Insumo</option>
                      <option value="produzido">👨‍🍳 Produzido</option>
                      <option value="produto">📦 Produto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700">📁 Grupo</label>
                    <select
                      value={grupoFiltro}
                      onChange={(e) => setGrupoFiltro(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus-ring bg-white shadow-sm"
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
        </div>

        {/* Products Grid */}
        {produtos.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="glass-card p-12 rounded-3xl shadow-xl max-w-md mx-auto">
              <div className="relative mb-6">
                <Package className="mx-auto h-16 w-16 text-gray-300 animate-float" />
                <div className="absolute -top-2 -right-2">
                  <Star className="h-6 w-6 text-yellow-400 fill-current animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mb-6">Que tal criar o primeiro produto do seu catálogo?</p>
              <Button asChild className="gradient-primary text-white border-0 hover:shadow-lg hover-lift">
                <Link href="/produtos/novo">
                  <Plus className="h-4 w-4 mr-2" />
                  <Sparkles className="h-4 w-4 mr-1" />
                  Criar Primeiro Produto
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {agruparProdutosPorSubgrupo(produtos).map((grupo, groupIndex) => {
              const subgroupKey = `${grupo.grupo}-${grupo.subgrupo}`
              
              return (
                <div 
                  key={subgroupKey} 
                  className="mb-10 animate-slide-up"
                  style={{animationDelay: `${groupIndex * 150}ms`}}
                >
                  {/* Modern Group Header */}
                  <div className="flex items-center gap-4 mb-6 p-4 glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-800">{grupo.grupo}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-400">›</span>
                        <h3 className="text-lg font-medium text-gray-600">{grupo.subgrupo}</h3>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200 px-3 py-1">
                      {grupo.produtos.length} {grupo.produtos.length === 1 ? 'produto' : 'produtos'}
                    </Badge>
                  </div>

                  {/* Responsive Layout - Desktop Table / Mobile Cards */}
                  
                  {/* Desktop Table - Hidden on Mobile */}
                  <div className="hidden md:block glass-card rounded-2xl shadow-lg overflow-hidden border-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-700">Produto</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-700">Código</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-700">Subgrupo</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-700">Custo</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-700">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {grupo.produtos.map((produto, prodIndex) => (
                            <tr 
                              key={produto.id} 
                              className="hover:bg-emerald-50/50 transition-colors duration-200 animate-scale-in group"
                              style={{animationDelay: `${(groupIndex * 150) + (prodIndex * 50)}ms`}}
                            >
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                                  {produto.descricao}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                                  {produto.produto_id}
                                </code>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <Badge 
                                  variant="outline" 
                                  className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200"
                                >
                                  {produto.subgrupo}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-semibold text-sm">
                                  {formatCurrency(produto.custo || 0)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-8 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 hover-lift"
                                  >
                                    <Link href={`/solicitacoes/nova?produto=${produto.id}`}>
                                      <ShoppingCart className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-8 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 hover-lift"
                                  >
                                    <Link href={`/produtos/${produto.id}/editar`}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(produto.id, produto.descricao)}
                                    className="h-8 hover:bg-red-50 hover:border-red-200 hover:text-red-700 hover-lift"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards - Visible only on Mobile */}
                  <div className="md:hidden space-y-3">
                    {grupo.produtos.map((produto, prodIndex) => (
                      <Card 
                        key={produto.id} 
                        className="glass-card border-0 shadow-lg animate-scale-in"
                        style={{animationDelay: `${(groupIndex * 150) + (prodIndex * 50)}ms`}}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
                                {produto.descricao}
                              </CardTitle>
                              <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono mt-1 inline-block">
                                {produto.produto_id}
                              </code>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="ml-2 text-xs bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200"
                            >
                              {produto.subgrupo}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                            <span className="text-xs font-medium text-blue-600">💰 Custo:</span>
                            <span className="font-bold text-blue-800 text-sm">
                              {formatCurrency(produto.custo || 0)}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="flex-1 h-9 text-xs hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                            >
                              <Link href={`/solicitacoes/nova?produto=${produto.id}`}>
                                <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                                Solicitar
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-9 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                            >
                              <Link href={`/produtos/${produto.id}/editar`}>
                                <Edit className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(produto.id, produto.descricao)}
                              className="h-9 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}