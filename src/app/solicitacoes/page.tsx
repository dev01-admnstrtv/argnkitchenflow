'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { buscarSolicitacoes, deletarSolicitacao } from '@/lib/actions/solicitacoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils'
import { Plus, Search, Trash2, ArrowLeft, Package, FileText, Sparkles, Star, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { SolicitacaoCompleta } from '@/types'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleGroup } from '@/components/ui/collapsible'

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [filtro, setFiltro] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)

  const carregarDados = useCallback(async (pagina = 1) => {
    if (pagina === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const resultado = await buscarSolicitacoes(user?.id, pagina, 30)
      if (resultado.success) {
        if (pagina === 1) {
          setSolicitacoes(resultado.data || [])
        } else {
          setSolicitacoes(prev => [...prev, ...(resultado.data || [])])
        }
        setHasMore((resultado.data || []).length > 0)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    carregarDados(1)
  }, [carregarDados])

  const lastElementRef = useCallback(node => {
    if (loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1)
      }
    })
    if (node) observer.current.observe(node)
  }, [loadingMore, hasMore])

  useEffect(() => {
    if (page > 1) {
      carregarDados(page)
    }
  }, [page, carregarDados])

  const handleExcluirSolicitacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) {
      return
    }

    try {
      const resultado = await deletarSolicitacao(id)
      if (resultado.success) {
        carregarDados(1)
      } else {
        alert('Erro ao excluir solicitação: ' + resultado.error)
      }
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error)
      alert('Erro ao excluir solicitação')
    }
  }

  const podeExcluirSolicitacao = (solicitacao: SolicitacaoCompleta) => {
    return solicitacao.itens.every((item: any) => 
      item.status_separacao === 'aguardando' || !item.status_separacao
    )
  }

  const solicitacoesFiltradas = useMemo(() => {
    return solicitacoes.filter(solicitacao =>
      solicitacao.praca_destino.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      solicitacao.observacoes?.toLowerCase().includes(filtro.toLowerCase()) ||
      solicitacao.status.toLowerCase().includes(filtro.toLowerCase()) ||
      solicitacao.solicitante?.toLowerCase().includes(filtro.toLowerCase())
    )
  }, [solicitacoes, filtro])

  const solicitacoesAgrupadas = useMemo(() => {
    return solicitacoesFiltradas.reduce((acc, solicitacao) => {
      const data = formatDate(solicitacao.data_entrega, true)
      if (!acc[data]) {
        acc[data] = []
      }
      acc[data].push(solicitacao)
      return acc
    }, {} as Record<string, SolicitacaoCompleta[]>)
  }, [solicitacoesFiltradas])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="relative backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="relative container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Button variant="outline" asChild className="hover-lift glass-card">
              <Link href="/dashboard">
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

            <Button asChild className="gradient-primary text-white border-0 hover:shadow-lg hover-lift">
              <Link href="/solicitacoes/nova">
                <Plus className="h-4 w-4 mr-2" />
                <Sparkles className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Nova Solicitação</span>
                <span className="sm:hidden">Nova</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Info Section */}
      <div className="container mx-auto px-4 py-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="text-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📋 Minhas Solicitações
          </h1>
          <p className="text-sm text-gray-500 font-medium">Gerencie suas solicitações de produtos</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Field */}
        <div className="mb-8 animate-fade-in">
          <Card className="bg-white border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-lg text-gray-800">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                  <Search className="h-4 w-4 text-white" />
                </div>
                🔍 Buscar Solicitações
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Pesquisar por praça, observações, status ou solicitante..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-12 h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white shadow-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Solicitações List */}
        <div className="animate-fade-in">
          {Object.keys(solicitacoesAgrupadas).length === 0 ? (
            <Card className="bg-white border-2 border-gray-200 shadow-xl">
              <CardContent className="pt-6">
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
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma solicitação encontrada</h3>
                    <p className="text-gray-600 mb-6">
                      {filtro ? 'Tente ajustar os filtros de busca' : 'Comece criando sua primeira solicitação'}
                    </p>
                    <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:shadow-xl hover:scale-105 transition-all duration-200">
                      <Link href="/solicitacoes/nova">
                        <Plus className="h-4 w-4 mr-2" />
                        <Sparkles className="h-4 w-4 mr-1" />
                        Criar Primeira Solicitação
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CollapsibleGroup>
              {Object.entries(solicitacoesAgrupadas).map(([data, solicitacoesDoDia], index) => (
                <Collapsible key={data} title={data} itemCount={solicitacoesDoDia.length} defaultOpen={index === 0}>
                  <div className="grid gap-6">
                    {solicitacoesDoDia.map((solicitacao, idx) => (
                      <Card 
                        ref={index === Object.keys(solicitacoesAgrupadas).length - 1 && idx === solicitacoesDoDia.length - 1 ? lastElementRef : null}
                        key={solicitacao.id} 
                        className="bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                        style={{animationDelay: `${idx * 100}ms`}}
                      >
                        <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg border border-blue-200">
                                <Package className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold text-gray-800">
                                  📍 {solicitacao.praca_destino.nome}
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                  Solicitante: {solicitacao.solicitante}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge className={`${getStatusColor(solicitacao.status)} px-3 py-1 border font-medium`}>
                                {solicitacao.status}
                              </Badge>
                              <Badge className={`${getPriorityColor(solicitacao.prioridade)} px-3 py-1 border font-medium`}>
                                {solicitacao.prioridade}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300">
                              <span className="text-xs font-semibold text-blue-700">🕐 Janela de entrega:</span>
                              <div className="font-bold text-blue-900 text-sm mt-1">
                                {solicitacao.janela_entrega}
                              </div>
                            </div>
                            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-300">
                              <span className="text-xs font-semibold text-purple-700">📦 Total de itens:</span>
                              <div className="font-bold text-purple-900 text-sm mt-1">
                                {solicitacao.itens.length} {solicitacao.itens.length === 1 ? 'item' : 'itens'}
                              </div>
                            </div>
                          </div>
                          
                          {solicitacao.observacoes && (
                            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300">
                              <span className="text-xs font-semibold text-gray-700">💬 Observações:</span>
                              <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                                {solicitacao.observacoes}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex gap-2 pt-2 flex-wrap border-t border-gray-200">
                            <Button variant="outline" size="sm" asChild className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200">
                              <Link href={`/solicitacoes/${solicitacao.id}`}>
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                Ver detalhes
                              </Link>
                            </Button>
                            {solicitacao.status === 'pendente' && (
                              <Button variant="outline" size="sm" asChild className="border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                                <Link href={`/solicitacoes/${solicitacao.id}/editar`}>
                                  ✏️ Editar
                                </Link>
                              </Button>
                            )}
                            {podeExcluirSolicitacao(solicitacao) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleExcluirSolicitacao(solicitacao.id)}
                                className="border-2 border-gray-300 text-red-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </Collapsible>
              ))}
            </CollapsibleGroup>
          )}
          {loadingMore && 
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-4 text-gray-600">Carregando mais...</p>
            </div>
          }
        </div>
      </div>
    </div>
  )
}