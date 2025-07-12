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
  X
} from 'lucide-react'
import Link from 'next/link'
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
        return <Badge variant="secondary">Em Andamento</Badge>
      case 'finalizado':
        return <Badge className="bg-green-100 text-green-800">Finalizado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading || !inventario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const podeEditar = inventario.status === 'em_andamento'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/inventarios">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{inventario.numero_inventario}</h1>
            <p className="text-gray-600">{inventario.praca_nome}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(inventario.status)}
          {podeEditar && (
            <>
              <Button
                onClick={() => setShowAddItem(true)}
                disabled={showAddItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
              <Button
                variant="outline"
                onClick={handleFinalizar}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Informações do Inventário */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Inventário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Data:</span>
              <span className="font-medium">{formatarData(inventario.data_contagem)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Responsável:</span>
              <span className="font-medium">{inventario.responsavel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Total de Itens:</span>
              <span className="font-medium">{inventario.total_itens}</span>
            </div>
          </div>
          {inventario.observacoes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600 text-sm">Observações:</span>
              <p className="font-medium text-gray-700 mt-1">{inventario.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário para Adicionar Item */}
      {showAddItem && podeEditar && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Adicionar Item ao Inventário</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddItem(false)
                  setNovoItem({ produto_id: '', quantidade: '', quantidade_em_uso: '' })
                  setSearchProduto('')
                  setProdutos([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Produto *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Pesquisar produto..."
                    value={searchProduto}
                    onChange={(e) => setSearchProduto(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {produtos.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {produtos.map((produto) => (
                      <div
                        key={produto.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                        onClick={() => selectProduto(produto)}
                      >
                        <div className="font-medium">{produto.descricao}</div>
                        <div className="text-sm text-gray-500">
                          {produto.produto_id} | {produto.grupo} › {produto.subgrupo}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quantidade *</label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantidade em Uso</label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={novoItem.quantidade_em_uso}
                    onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade_em_uso: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddItem}
                  disabled={!novoItem.produto_id || !novoItem.quantidade}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Inventário</CardTitle>
        </CardHeader>
        <CardContent>
          {itens.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum item adicionado ao inventário</p>
              {podeEditar && (
                <Button
                  onClick={() => setShowAddItem(true)}
                  className="mt-4"
                >
                  Adicionar Primeiro Item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {itens.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.produto_descricao}</h3>
                      <p className="text-sm text-gray-500">
                        {item.codigo_produto} | {item.produto_grupo} › {item.produto_subgrupo}
                      </p>
                      
                      {editingItem === item.id ? (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Quantidade</label>
                            <Input
                              type="number"
                              step="0.001"
                              value={editItem.quantidade}
                              onChange={(e) => setEditItem(prev => ({ ...prev, quantidade: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Quantidade em Uso</label>
                            <Input
                              type="number"
                              step="0.001"
                              value={editItem.quantidade_em_uso}
                              onChange={(e) => setEditItem(prev => ({ ...prev, quantidade_em_uso: e.target.value }))}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex gap-4 text-sm">
                          <span>
                            <strong>Quantidade:</strong> {item.quantidade}
                          </span>
                          {item.quantidade_em_uso && item.quantidade_em_uso > 0 && (
                            <span>
                              <strong>Em Uso:</strong> {item.quantidade_em_uso}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {podeEditar && (
                      <div className="flex gap-2 ml-4">
                        {editingItem === item.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleEditItem(item.id)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteItem(item.id, item.produto_descricao)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}