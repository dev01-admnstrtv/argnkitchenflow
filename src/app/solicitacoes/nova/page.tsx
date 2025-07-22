'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buscarProdutos, buscarProdutoPorId } from '@/lib/actions/produtos'
import { buscarPracasDestino } from '@/lib/actions/pracas'
import { criarSolicitacao } from '@/lib/actions/solicitacoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Search, ArrowLeft, Package, FileText, Sparkles, Star, Calendar, MapPin, Clock, MessageSquare, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Produto, PracaDestino } from '@/types'

interface ItemSolicitacao {
  produto_id: string
  quantidade_solicitada: number
  observacoes?: string
  produto?: Produto
  timestamp?: number // Para controlar a ordem de adição
}

function NovaSolicitacaoPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const produtoPreSelecionado = searchParams.get('produto')
  
  const [pracas, setPracas] = useState<PracaDestino[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([])
  const [searchProduto, setSearchProduto] = useState('')
  const [loading, setLoading] = useState(false)
  const [showProdutos, setShowProdutos] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    praca_destino_id: '',
    solicitante: '',
    prioridade: 'normal' as 'baixa' | 'normal' | 'alta' | 'urgente',
    observacoes: '',
    tipo: 'saida' as 'entrada' | 'saida',
    data_entrega: new Date().toISOString().split('T')[0], // Data de hoje como padrão
    janela_entrega: 'manha' as 'manha' | 'tarde' | 'noite',
    itens: [] as ItemSolicitacao[],
  })

  useEffect(() => {
    const carregarDados = async () => {
      const [resultadoPracas, resultadoProdutos] = await Promise.all([
        buscarPracasDestino(),
        buscarProdutos('', '', '', 1, 1000) // Carregar até 1000 produtos
      ])

      if (resultadoPracas.success) {
        setPracas(resultadoPracas.data || [])
      }

      if (resultadoProdutos.success) {
        setProdutos(resultadoProdutos.data || [])
        setProdutosFiltrados(resultadoProdutos.data || [])
      }

      // Se há um produto pré-selecionado na URL, adicioná-lo automaticamente
      if (produtoPreSelecionado) {
        const resultadoProduto = await buscarProdutoPorId(produtoPreSelecionado)
        if (resultadoProduto.success && resultadoProduto.data) {
          const novoItem: ItemSolicitacao = {
            produto_id: resultadoProduto.data.id,
            quantidade_solicitada: 1,
            observacoes: '',
            produto: resultadoProduto.data,
            timestamp: Date.now(),
          }
          
          setFormData(prev => ({
            ...prev,
            itens: [novoItem],
            observacoes: 'Solicitação direta de produto' // Observação obrigatória
          }))
        }
      }
    }

    carregarDados()
  }, [produtoPreSelecionado])

  // Função para realizar a busca manualmente
  const realizarBusca = () => {
    const filtrados = produtos.filter(produto =>
      produto.descricao.toLowerCase().includes(searchProduto.toLowerCase()) ||
      produto.produto_id.toLowerCase().includes(searchProduto.toLowerCase())
    )
    setProdutosFiltrados(filtrados)
  }

  // Carregar todos os produtos inicialmente
  useEffect(() => {
    setProdutosFiltrados([])
  }, [produtos])

  // Auto search quando o usuário digita acima de 3 caracteres
  useEffect(() => {
    if (searchProduto.length >= 3) {
      const timeoutId = setTimeout(() => {
        realizarBusca()
      }, 500) // Debounce de 500ms
      
      return () => clearTimeout(timeoutId)
    } else {
      setProdutosFiltrados([])
    }
  }, [searchProduto]) // eslint-disable-line react-hooks/exhaustive-deps

  const adicionarItem = (produto: Produto) => {
    const novoItem: ItemSolicitacao = {
      produto_id: produto.id,
      quantidade_solicitada: 1,
      observacoes: '',
      produto: produto,
      timestamp: Date.now(), // Adiciona timestamp para ordenação
    }

    setFormData(prev => ({
      ...prev,
      itens: [novoItem, ...prev.itens] // Adiciona no início da lista
    }))

    setShowProdutos(false)
    setSearchProduto('')
  }

  const removerItem = (timestamp: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter(item => item.timestamp !== timestamp)
    }))
  }

  const atualizarItem = (timestamp: number, campo: string, valor: any) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map(item => 
        item.timestamp === timestamp ? { ...item, [campo]: valor } : item
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (submitted) return // Evita envio duplo
    
    setLoading(true)
    setSubmitted(true)

    try {
      // Validação especial: se produto foi pré-selecionado, observação é obrigatória
      if (produtoPreSelecionado && !formData.observacoes.trim()) {
        alert('Para solicitação direta de produto, a observação é obrigatória!')
        setLoading(false)
        setSubmitted(false)
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append('praca_destino_id', formData.praca_destino_id)
      formDataToSend.append('solicitante', formData.solicitante)
      formDataToSend.append('prioridade', formData.prioridade)
      formDataToSend.append('observacoes', formData.observacoes)
      formDataToSend.append('tipo', formData.tipo)
      formDataToSend.append('data_entrega', formData.data_entrega)
      formDataToSend.append('janela_entrega', formData.janela_entrega)
      formDataToSend.append('itens', JSON.stringify(formData.itens))

      const resultado = await criarSolicitacao(formDataToSend)
      
      if (resultado.success) {
        router.push('/solicitacoes')
      } else {
        alert('Erro ao criar solicitação: ' + resultado.error)
        setSubmitted(false)
      }
    } catch (error) {
      console.error('Erro ao criar solicitação:', error)
      alert('Erro ao criar solicitação')
      setSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="relative backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5" />
        <div className="relative container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Button variant="outline" asChild className="hover-lift glass-card">
              <Link href="/solicitacoes">
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

            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Info Section */}
      <div className="container mx-auto px-4 py-4 bg-gradient-to-r from-green-50/50 to-blue-50/50">
        <div className="text-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            ➕ Nova Solicitação
          </h1>
          <p className="text-sm text-gray-500 font-medium">Crie uma nova solicitação de produtos</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informações Básicas */}
            <div className="animate-fade-in">
              <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg border border-blue-200">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    📝 Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                      <MapPin className="h-4 w-4" />
                      Praça de Destino *
                    </label>
                    <select
                      value={formData.praca_destino_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, praca_destino_id: e.target.value }))}
                      required
                      className="w-full p-3 border-2 border-gray-300 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base shadow-sm"
                    >
                      <option value="">Selecione uma praça</option>
                      {pracas.map(praca => (
                        <option key={praca.id} value={praca.id}>
                          {praca.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                      <User className="h-4 w-4" />
                      Solicitante *
                    </label>
                    <Input
                      type="text"
                      value={formData.solicitante}
                      onChange={(e) => setFormData(prev => ({ ...prev, solicitante: e.target.value }))}
                      required
                      className="w-full p-3 border-2 border-gray-300 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base shadow-sm"
                      placeholder="Digite seu nome"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                        <Star className="h-4 w-4" />
                        Prioridade
                      </label>
                      <select
                        value={formData.prioridade}
                        onChange={(e) => setFormData(prev => ({ ...prev, prioridade: e.target.value as any }))}
                        className="w-full p-3 border-2 border-gray-300 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base shadow-sm"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                        <Calendar className="h-4 w-4" />
                        Data de Entrega *
                      </label>
                      <Input
                        type="date"
                        value={formData.data_entrega}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_entrega: e.target.value }))}
                        required
                        className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                        <Clock className="h-4 w-4" />
                        Janela de Entrega
                      </label>
                      <select
                        value={formData.janela_entrega}
                        onChange={(e) => setFormData(prev => ({ ...prev, janela_entrega: e.target.value as any }))}
                        className="w-full p-3 border-2 border-gray-300 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base shadow-sm"
                      >
                        <option value="manha">Manhã</option>
                        <option value="tarde">Tarde</option>
                        <option value="noite">Noite</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-700">
                      <MessageSquare className="h-4 w-4" />
                      Observações
                    </label>
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                      rows={3}
                      className="w-full p-3 border-2 border-gray-300 bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base resize-none shadow-sm"
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Itens da Solicitação */}
            <div className="animate-fade-in">
              <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 shadow-lg border border-green-200">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      📦 Itens da Solicitação
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProdutos(!showProdutos)}
                      className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <Sparkles className="h-4 w-4 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {showProdutos && (
                    <div className="mb-6 p-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg animate-slide-up">
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                          <Input
                            type="text"
                            placeholder="Pesquisar produtos por nome ou código..."
                            value={searchProduto}
                            onChange={(e) => setSearchProduto(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && realizarBusca()}
                            className="pl-12 h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white shadow-sm"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {produtosFiltrados.map(produto => (
                          <div
                            key={produto.id}
                            className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200 border border-gray-200 hover:border-blue-300"
                            onClick={() => adicionarItem(produto)}
                          >
                            <div>
                              <div className="font-semibold text-gray-800">{produto.descricao}</div>
                              <div className="text-sm text-gray-600">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs border">{produto.produto_id}</code>
                                <span className="mx-2">|</span>
                                <span>{produto.grupo}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300">{produto.tipo}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.itens.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-white border-2 border-gray-200 p-12 rounded-2xl shadow-lg max-w-md mx-auto">
                        <div className="relative mb-6">
                          <Package className="mx-auto h-16 w-16 text-gray-400" />
                          <div className="absolute -top-2 -right-2">
                            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Star className="h-3 w-3 text-white fill-current" />
                            </div>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum item adicionado</h3>
                        <p className="text-gray-600 mb-6">Clique em &quot;Adicionar Item&quot; para começar a montar sua solicitação</p>
                        <Button
                          type="button"
                          onClick={() => setShowProdutos(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:shadow-xl hover:scale-105 transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <Sparkles className="h-4 w-4 mr-1" />
                          Adicionar Primeiro Item
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.itens
                        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) // Ordena por timestamp, mais recentes primeiro
                        .map((item, index) => (
                        <div key={item.timestamp || index} className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{animationDelay: `${index * 100}ms`}}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-sm border border-blue-200">
                                <Package className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{item.produto?.descricao}</div>
                                <div className="text-sm text-gray-600">
                                  <code className="bg-gray-100 px-2 py-1 rounded text-xs border">{item.produto?.produto_id}</code>
                                  <span className="mx-2">|</span>
                                  <span>{item.produto?.grupo}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removerItem(item.timestamp || 0)}
                              className="border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-700">
                                📊 Quantidade *
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.quantidade_solicitada}
                                onChange={(e) => atualizarItem(item.timestamp || 0, 'quantidade_solicitada', parseFloat(e.target.value) || 0)}
                                required
                                className="h-10 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg bg-white shadow-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2 text-gray-700">
                                💬 Observações
                              </label>
                              <Input
                                type="text"
                                value={item.observacoes || ''}
                                onChange={(e) => atualizarItem(item.timestamp || 0, 'observacoes', e.target.value)}
                                placeholder="Observações do item..."
                                className="h-10 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg bg-white shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ações */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()} 
                className="border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || formData.itens.length === 0 || submitted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Criar Solicitação
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NovaSolicitacaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">Carregando...</p>
        </div>
      </div>
    }>
      <NovaSolicitacaoPageContent />
    </Suspense>
  )
}