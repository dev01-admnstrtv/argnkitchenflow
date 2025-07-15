'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { 
  buscarInventarioPorId, 
  buscarItensInventario,
  adicionarItemInventario,
  atualizarItemInventario,
  deletarItemInventario,
  buscarProdutosParaInventario,
  finalizarInventario
} from '@/lib/actions/inventarios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Save,
  CheckCircle,
  Calendar,
  MapPin,
  User,
  Package,
  Hash,
  X,
  Sparkles,
  Star
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { InventarioData, InventarioItemData } from '@/lib/actions/inventarios'

interface Produto {
  id: string
  produto_id: string
  descricao: string
  grupo: string
  subgrupo: string
  tipo: string
}

export default function InventarioDetalhePage() {
  const params = useParams()
  const inventarioId = params.id as string

  const [inventario, setInventario] = useState<InventarioData | null>(null)
  const [itens, setItens] = useState<InventarioItemData[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [searchProduto, setSearchProduto] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  
  const [novoItem, setNovoItem] = useState({
    produto_id: '',
    quantidade: '',
    quantidade_em_uso: ''
  })

  const [editItem, setEditItem] = useState({
    quantidade: '',
    quantidade_em_uso: ''
  })

  const [searchTerm, setSearchTerm] = useState('')

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const [inventarioResult, itensResult] = await Promise.all([
        buscarInventarioPorId(inventarioId),
        buscarItensInventario(inventarioId)
      ])

      if (inventarioResult.success) {
        setInventario(inventarioResult.data)
      }
      
      if (itensResult.success && itensResult.data) {
        setItens(itensResult.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [inventarioId])

  const buscarProdutos = useCallback(async (search: string) => {
    if (!search.trim()) {
      setProdutos([])
      return
    }

    setLoadingProdutos(true)
    try {
      const resultado = await buscarProdutosParaInventario(search)
      if (resultado.success && resultado.data) {
        setProdutos(resultado.data)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoadingProdutos(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  useEffect(() => {
    const timeout = setTimeout(() => {
      buscarProdutos(searchProduto)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchProduto, buscarProdutos])

  const handleAddItem = async () => {
    if (!novoItem.produto_id || !novoItem.quantidade) return

    const formData = new FormData()
    formData.append('inventario_id', inventarioId)
    formData.append('produto_id', novoItem.produto_id)
    formData.append('quantidade', novoItem.quantidade)
    formData.append('quantidade_em_uso', novoItem.quantidade_em_uso || '0')

    const resultado = await adicionarItemInventario(formData)
    
    if (resultado.success) {
      setNovoItem({ produto_id: '', quantidade: '', quantidade_em_uso: '' })
      setSearchProduto('')
      setProdutos([])
      setShowAddItem(false)
      carregarDados()
    } else {
      alert('Erro ao adicionar item: ' + resultado.error)
    }
  }

  const handleEditItem = async (itemId: string) => {
    const formData = new FormData()
    formData.append('quantidade', editItem.quantidade)
    formData.append('quantidade_em_uso', editItem.quantidade_em_uso || '0')

    const resultado = await atualizarItemInventario(itemId, formData)
    
    if (resultado.success) {
      setEditingItem(null)
      setEditItem({ quantidade: '', quantidade_em_uso: '' })
      carregarDados()
    } else {
      alert('Erro ao atualizar item: ' + resultado.error)
    }
  }

  const handleDeleteItem = async (itemId: string, produtoDescricao: string) => {
    if (confirm(`Tem certeza que deseja remover "${produtoDescricao}" do inventário?`)) {
      const resultado = await deletarItemInventario(itemId)
      
      if (resultado.success) {
        carregarDados()
      } else {
        alert('Erro ao deletar item: ' + resultado.error)
      }
    }
  }

  const handleFinalizar = async () => {
    if (confirm('Tem certeza que deseja finalizar este inventário? Após finalizado não poderá ser mais editado.')) {
      const resultado = await finalizarInventario(inventarioId)
      
      if (resultado.success) {
        carregarDados()
      } else {
        alert('Erro ao finalizar inventário: ' + resultado.error)
      }
    }
  }

  const startEditItem = (item: InventarioItemData) => {
    setEditingItem(item.id)
    setEditItem({
      quantidade: item.quantidade.toString(),
      quantidade_em_uso: item.quantidade_em_uso?.toString() || '0'
    })
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditItem({ quantidade: '', quantidade_em_uso: '' })
  }

  const selectProduto = (produto: Produto) => {
    setNovoItem(prev => ({ ...prev, produto_id: produto.id }))
    setSearchProduto(produto.descricao)
    setProdutos([])
  }

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">📝 Em Andamento</Badge>
      case 'finalizado':
        return <Badge className="bg-green-100 text-green-700 border-green-200">✅ Finalizado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Função para filtrar itens por termo de pesquisa
  const filterItens = (itens: InventarioItemData[], searchTerm: string) => {
    if (!searchTerm.trim()) return itens
    
    const lowerSearch = searchTerm.toLowerCase()
    return itens.filter(item => 
      item.produto_descricao.toLowerCase().includes(lowerSearch) ||
      item.codigo_produto.toLowerCase().includes(lowerSearch) ||
      item.produto_grupo.toLowerCase().includes(lowerSearch) ||
      item.produto_subgrupo.toLowerCase().includes(lowerSearch)
    )
  }

  // Função para agrupar itens por subgrupo
  const agruparItensPorSubgrupo = (itens: InventarioItemData[]) => {
    const agrupados = itens.reduce((acc, item) => {
      const chaveUnica = `${item.produto_grupo}|${item.produto_subgrupo}`
      if (!acc[chaveUnica]) {
        acc[chaveUnica] = {
          subgrupo: item.produto_subgrupo,
          grupo: item.produto_grupo,
          itens: []
        }
      }
      acc[chaveUnica].itens.push(item)
      return acc
    }, {} as Record<string, { subgrupo: string, grupo: string, itens: InventarioItemData[] }>)

    // Converter para array e ordenar por grupo e depois por subgrupo
    return Object.values(agrupados).sort((a, b) => {
      if (a.grupo !== b.grupo) {
        return a.grupo.localeCompare(b.grupo)
      }
      return a.subgrupo.localeCompare(b.subgrupo)
    })
  }

  if (loading || !inventario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const podeEditar = inventario.status === 'em_andamento'

  return (
    <div className="min-h-screen">
      {/* Top Bar - Back Button, Logo Center, Add Button Right */}
      <header className="relative backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5" />
        <div className="relative container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Button variant="outline" asChild className="hover-lift glass-card">
              <Link href="/inventarios">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            
            <Image
              src="https://www.administrative.com.br/aragon/aragon.png"
              alt="Logo do Restaurante"
              width={40}
              height={40}
              className="rounded-lg shadow-lg ring-2 ring-white/50"
            />

            <div className="flex items-center gap-2">
              {podeEditar && (
                <Button
                  onClick={() => setShowAddItem(true)}
                  disabled={showAddItem}
                  className="gradient-primary text-white border-0 hover:shadow-lg hover-lift"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <Sparkles className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Adicionar Item</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Info Section - Below top bar */}
      <div className="container mx-auto px-4 py-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {inventario.numero_inventario}
            </h1>
            <p className="text-sm text-gray-500 font-medium">📍 {inventario.praca_nome}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusBadge(inventario.status)}
            {podeEditar && (
              <Button
                variant="outline"
                onClick={handleFinalizar}
                className="text-green-600 hover:text-green-700 hover-lift glass-card border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Finalizar Inventário</span>
                <span className="sm:hidden">Finalizar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Informações do Inventário */}
        <div className="mb-8 animate-fade-in">
          <Card className="glass-card border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                📋 Informações do Inventário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300">
                  <div className="p-2 rounded-lg bg-gray-500 shadow-sm">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Data de Contagem</span>
                    <p className="font-bold text-gray-800">{formatarData(inventario.data_contagem)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300">
                  <div className="p-2 rounded-lg bg-gray-500 shadow-sm">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Responsável</span>
                    <p className="font-bold text-gray-800">{inventario.responsavel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300">
                  <div className="p-2 rounded-lg bg-gray-500 shadow-sm">
                    <Hash className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Total de Itens</span>
                    <p className="font-bold text-gray-800">{inventario.total_itens}</p>
                  </div>
                </div>
              </div>
              {inventario.observacoes && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                  <span className="text-gray-600 text-sm font-semibold">💬 Observações:</span>
                  <p className="font-medium text-gray-700 mt-2 leading-relaxed">{inventario.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário para Adicionar Item */}
        {showAddItem && podeEditar && (
          <div className="mb-8 animate-slide-up">
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    ➕ Adicionar Item ao Inventário
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddItem(false)
                      setNovoItem({ produto_id: '', quantidade: '', quantidade_em_uso: '' })
                      setSearchProduto('')
                      setProdutos([])
                    }}
                    className="hover-lift glass-card border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-3 text-gray-700">🔍 Produto *</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Pesquisar produto..."
                        value={searchProduto}
                        onChange={(e) => setSearchProduto(e.target.value)}
                        className="pl-12 h-12 text-base focus-ring rounded-xl border-0 bg-white/50"
                      />
                    </div>
                    {produtos.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 glass-card rounded-xl shadow-xl max-h-60 overflow-auto">
                        {produtos.map((produto) => (
                          <div
                            key={produto.id}
                            className="p-4 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors hover-lift"
                            onClick={() => selectProduto(produto)}
                          >
                            <div className="font-semibold text-gray-800">{produto.descricao}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{produto.produto_id}</code>
                              <span className="mx-2">|</span>
                              <span>{produto.grupo} › {produto.subgrupo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">📊 Quantidade *</label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={novoItem.quantidade}
                        onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: e.target.value }))}
                        className="h-12 text-base focus-ring rounded-xl border-0 bg-white/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">🔄 Quantidade em Uso</label>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={novoItem.quantidade_em_uso}
                        onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade_em_uso: e.target.value }))}
                        className="h-12 text-base focus-ring rounded-xl border-0 bg-white/50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleAddItem}
                      disabled={!novoItem.produto_id || !novoItem.quantidade}
                      className="gradient-primary text-white border-0 hover:shadow-lg hover-lift h-12 px-6"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      <Sparkles className="h-4 w-4 mr-1" />
                      Salvar Item
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Itens Agrupados */}
        <div className="animate-fade-in">
          <Card className="glass-card border-0 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  📦 Itens do Inventário
                </CardTitle>
                
                {/* Search Field */}
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Buscar itens por nome, código ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base focus-ring rounded-xl border-0 bg-white/50"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {itens.length === 0 ? (
                <div className="text-center py-16">
                  <div className="glass-card p-12 rounded-3xl shadow-xl max-w-md mx-auto">
                    <div className="relative mb-6">
                      <Package className="mx-auto h-16 w-16 text-gray-300 animate-float" />
                      <div className="absolute -top-2 -right-2">
                        <Star className="h-6 w-6 text-yellow-400 fill-current animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum item adicionado</h3>
                    <p className="text-gray-500 mb-6">Comece adicionando o primeiro item ao inventário</p>
                    {podeEditar && (
                      <Button
                        onClick={() => setShowAddItem(true)}
                        className="gradient-primary text-white border-0 hover:shadow-lg hover-lift"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <Sparkles className="h-4 w-4 mr-1" />
                        Adicionar Primeiro Item
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {agruparItensPorSubgrupo(filterItens(itens, searchTerm)).map((grupo, groupIndex) => {
                    const subgroupKey = `${grupo.grupo}-${grupo.subgrupo}`
                    
                    return (
                      <div 
                        key={subgroupKey} 
                        className="mb-8 animate-slide-up"
                        style={{animationDelay: `${groupIndex * 150}ms`}}
                      >
                        {/* Group Header */}
                        <div className="flex items-center gap-4 mb-4 p-4 glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{grupo.grupo}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-gray-400">›</span>
                              <span className="text-md font-medium text-gray-600">{grupo.subgrupo}</span>
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 px-3 py-1">
                            {grupo.itens.length} {grupo.itens.length === 1 ? 'item' : 'itens'}
                          </Badge>
                        </div>

                        {/* Responsive Layout - Desktop Table / Mobile Cards */}
                        
                        {/* Desktop Table - Hidden on Mobile */}
                        <div className="hidden md:block glass-card rounded-2xl shadow-lg overflow-hidden border-0">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                                <tr>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700">Produto</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-700">Código</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-700">Quantidade</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-700">Em Uso</th>
                                  {podeEditar && (
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-purple-700">Ações</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {grupo.itens.map((item, itemIndex) => (
                                  <tr 
                                    key={item.id} 
                                    className="hover:bg-purple-50/50 transition-colors duration-200 animate-scale-in group"
                                    style={{animationDelay: `${(groupIndex * 150) + (itemIndex * 50)}ms`}}
                                  >
                                    <td className="px-6 py-4">
                                      <div className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                                        {item.produto_descricao}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                                        {item.codigo_produto}
                                      </code>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      {editingItem === item.id ? (
                                        <Input
                                          type="number"
                                          step="0.001"
                                          value={editItem.quantidade}
                                          onChange={(e) => setEditItem(prev => ({ ...prev, quantidade: e.target.value }))}
                                          className="w-24 h-8 text-center focus-ring rounded-lg"
                                        />
                                      ) : (
                                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-semibold text-sm">
                                          {item.quantidade}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      {editingItem === item.id ? (
                                        <Input
                                          type="number"
                                          step="0.001"
                                          value={editItem.quantidade_em_uso}
                                          onChange={(e) => setEditItem(prev => ({ ...prev, quantidade_em_uso: e.target.value }))}
                                          className="w-24 h-8 text-center focus-ring rounded-lg"
                                        />
                                      ) : (
                                        <span className={`inline-block px-3 py-1 rounded-lg font-semibold text-sm ${
                                          item.quantidade_em_uso && item.quantidade_em_uso > 0 
                                            ? 'bg-orange-100 text-orange-800' 
                                            : 'bg-gray-100 text-gray-500'
                                        }`}>
                                          {item.quantidade_em_uso || '0'}
                                        </span>
                                      )}
                                    </td>
                                    {podeEditar && (
                                      <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-center">
                                          {editingItem === item.id ? (
                                            <>
                                              <Button
                                                size="sm"
                                                onClick={() => handleEditItem(item.id)}
                                                className="h-8 bg-green-500 hover:bg-green-600 text-white hover-lift"
                                              >
                                                <Save className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={cancelEdit}
                                                className="h-8 hover:bg-red-50 hover:border-red-200 hover:text-red-700 hover-lift"
                                              >
                                                <X className="h-3.5 w-3.5" />
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEditItem(item)}
                                                className="h-8 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 hover-lift"
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteItem(item.id, item.produto_descricao)}
                                                className="h-8 hover:bg-red-50 hover:border-red-200 hover:text-red-700 hover-lift"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Mobile Cards - Visible only on Mobile */}
                        <div className="md:hidden space-y-3">
                          {grupo.itens.map((item, itemIndex) => (
                            <Card 
                              key={item.id} 
                              className="glass-card border-0 shadow-lg animate-scale-in"
                              style={{animationDelay: `${(groupIndex * 150) + (itemIndex * 50)}ms`}}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">
                                      {item.produto_descricao}
                                    </CardTitle>
                                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono mt-1 inline-block">
                                      {item.codigo_produto}
                                    </code>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                                    <span className="text-xs font-medium text-blue-600">📊 Quantidade:</span>
                                    {editingItem === item.id ? (
                                      <Input
                                        type="number"
                                        step="0.001"
                                        value={editItem.quantidade}
                                        onChange={(e) => setEditItem(prev => ({ ...prev, quantidade: e.target.value }))}
                                        className="w-full h-8 text-center focus-ring rounded-lg mt-1"
                                      />
                                    ) : (
                                      <div className="font-bold text-blue-800 text-sm mt-1">
                                        {item.quantidade}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`p-3 rounded-lg ${
                                    item.quantidade_em_uso && item.quantidade_em_uso > 0 
                                      ? 'bg-gradient-to-r from-orange-50 to-orange-100' 
                                      : 'bg-gradient-to-r from-gray-50 to-gray-100'
                                  }`}>
                                    <span className={`text-xs font-medium ${
                                      item.quantidade_em_uso && item.quantidade_em_uso > 0 
                                        ? 'text-orange-600' 
                                        : 'text-gray-600'
                                    }`}>🔄 Em Uso:</span>
                                    {editingItem === item.id ? (
                                      <Input
                                        type="number"
                                        step="0.001"
                                        value={editItem.quantidade_em_uso}
                                        onChange={(e) => setEditItem(prev => ({ ...prev, quantidade_em_uso: e.target.value }))}
                                        className="w-full h-8 text-center focus-ring rounded-lg mt-1"
                                      />
                                    ) : (
                                      <div className={`font-bold text-sm mt-1 ${
                                        item.quantidade_em_uso && item.quantidade_em_uso > 0 
                                          ? 'text-orange-800' 
                                          : 'text-gray-500'
                                      }`}>
                                        {item.quantidade_em_uso || '0'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {podeEditar && (
                                  <div className="flex gap-2">
                                    {editingItem === item.id ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleEditItem(item.id)}
                                          className="flex-1 h-9 bg-green-500 hover:bg-green-600 text-white"
                                        >
                                          <Save className="h-3.5 w-3.5 mr-1" />
                                          Salvar
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={cancelEdit}
                                          className="h-9 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => startEditItem(item)}
                                          className="flex-1 h-9 text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                                        >
                                          <Edit className="h-3.5 w-3.5 mr-1" />
                                          Editar
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteItem(item.id, item.produto_descricao)}
                                          className="h-9 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}