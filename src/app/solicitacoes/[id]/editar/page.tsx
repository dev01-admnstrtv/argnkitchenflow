'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { buscarSolicitacaoPorId, atualizarSolicitacao } from '@/lib/actions/solicitacoes'
import { buscarProdutos } from '@/lib/actions/produtos'
import { buscarPracasDestino } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Search } from 'lucide-react'
import { Produto, PracaDestino, SolicitacaoCompleta } from '@/types'

interface ItemSolicitacao {
  id?: string
  produto_id: string
  quantidade_solicitada: number
  observacoes?: string
  produto?: Produto
}

export default function EditarSolicitacaoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [solicitacao, setSolicitacao] = useState<SolicitacaoCompleta | null>(null)
  const [pracas, setPracas] = useState<PracaDestino[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([])
  const [searchProduto, setSearchProduto] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showProdutos, setShowProdutos] = useState(false)
  
  const [formData, setFormData] = useState({
    praca_destino_id: '',
    prioridade: 'normal' as 'baixa' | 'normal' | 'alta' | 'urgente',
    observacoes: '',
    tipo: 'saida' as 'entrada' | 'saida',
    data_entrega: '',
    janela_entrega: 'manha' as 'manha' | 'tarde' | 'noite',
    itens: [] as ItemSolicitacao[],
  })

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [resultadoSolicitacao, resultadoPracas, resultadoProdutos] = await Promise.all([
          buscarSolicitacaoPorId(id),
          buscarPracasDestino(),
          buscarProdutos()
        ])

        if (resultadoSolicitacao.success && resultadoSolicitacao.data) {
          const sol = resultadoSolicitacao.data
          setSolicitacao(sol)
          
          setFormData({
            praca_destino_id: sol.praca_destino_id,
            prioridade: sol.prioridade,
            observacoes: sol.observacoes || '',
            tipo: sol.tipo,
            data_entrega: sol.data_entrega,
            janela_entrega: sol.janela_entrega,
            itens: sol.itens.map((item: any) => ({
              id: item.id,
              produto_id: item.produto_id,
              quantidade_solicitada: item.quantidade_solicitada,
              observacoes: item.observacoes || '',
              produto: item.produto
            }))
          })
        }

        if (resultadoPracas.success) {
          setPracas(resultadoPracas.data || [])
        }

        if (resultadoProdutos.success) {
          setProdutos(resultadoProdutos.data || [])
          setProdutosFiltrados(resultadoProdutos.data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [id])

  useEffect(() => {
    const filtrados = produtos.filter(produto =>
      produto.descricao.toLowerCase().includes(searchProduto.toLowerCase()) ||
      produto.produto_id.toLowerCase().includes(searchProduto.toLowerCase())
    )
    setProdutosFiltrados(filtrados)
  }, [searchProduto, produtos])

  const adicionarItem = (produto: Produto) => {
    const novoItem: ItemSolicitacao = {
      produto_id: produto.id,
      quantidade_solicitada: 1,
      observacoes: '',
      produto: produto,
    }

    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, novoItem]
    }))

    setShowProdutos(false)
    setSearchProduto('')
  }

  const removerItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }))
  }

  const atualizarItem = (index: number, campo: string, valor: any) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map((item, i) => 
        i === index ? { ...item, [campo]: valor } : item
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('praca_destino_id', formData.praca_destino_id)
      formDataToSend.append('prioridade', formData.prioridade)
      formDataToSend.append('observacoes', formData.observacoes)
      formDataToSend.append('tipo', formData.tipo)
      formDataToSend.append('data_entrega', formData.data_entrega)
      formDataToSend.append('janela_entrega', formData.janela_entrega)
      formDataToSend.append('itens', JSON.stringify(formData.itens))

      const resultado = await atualizarSolicitacao(id, formDataToSend)
      
      if (resultado.success) {
        router.push('/solicitacoes')
      } else {
        alert('Erro ao atualizar solicitação: ' + resultado.error)
      }
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error)
      alert('Erro ao atualizar solicitação')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!solicitacao) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Solicitação não encontrada</h1>
          <Button className="mt-4" onClick={() => router.push('/solicitacoes')}>
            Voltar para solicitações
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Editar Solicitação</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Praça de Destino *
                </label>
                <select
                  value={formData.praca_destino_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, praca_destino_id: e.target.value }))}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione uma praça</option>
                  {pracas.map(praca => (
                    <option key={praca.id} value={praca.id}>
                      {praca.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) => setFormData(prev => ({ ...prev, prioridade: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data de Entrega *
                  </label>
                  <Input
                    type="date"
                    value={formData.data_entrega}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_entrega: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Janela de Entrega
                  </label>
                  <select
                    value={formData.janela_entrega}
                    onChange={(e) => setFormData(prev => ({ ...prev, janela_entrega: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="noite">Noite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Observações adicionais..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Itens da Solicitação</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProdutos(!showProdutos)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showProdutos && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Pesquisar produtos..."
                      value={searchProduto}
                      onChange={(e) => setSearchProduto(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {produtosFiltrados.map(produto => (
                      <div
                        key={produto.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => adicionarItem(produto)}
                      >
                        <div>
                          <div className="font-medium">{produto.descricao}</div>
                          <div className="text-sm text-gray-500">
                            {produto.produto_id} - {produto.grupo}
                          </div>
                        </div>
                        <Badge variant="outline">{produto.tipo}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.itens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item adicionado. Clique em &quot;Adicionar Item&quot; para começar.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.itens.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{item.produto?.descricao}</div>
                          <div className="text-sm text-gray-500">
                            {item.produto?.produto_id} - {item.produto?.grupo}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removerItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Quantidade *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantidade_solicitada}
                            onChange={(e) => atualizarItem(index, 'quantidade_solicitada', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Observações
                          </label>
                          <Input
                            type="text"
                            value={item.observacoes || ''}
                            onChange={(e) => atualizarItem(index, 'observacoes', e.target.value)}
                            placeholder="Observações do item..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || formData.itens.length === 0}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}