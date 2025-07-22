'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, MapPin, Clock, Package, FileText, Sparkles, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { buscarSolicitacaoPorId } from '@/lib/actions/solicitacoes'

interface SolicitacaoDetalhes {
  id: string
  created_at: string
  prioridade: string
  observacoes: string
  tipo: string
  status: string
  data_entrega: string
  janela_entrega: string
  loja: string
  praca_destino: {
    nome: string
    tipo: string
    responsavel: string
  }
  solicitante: string
  itens: Array<{
    id: string
    quantidade_solicitada: number
    observacoes: string
    produto: {
      produto_id: string
      descricao: string
      grupo: string
      subgrupo: string
      tipo: string
    }
  }>
}

export default function DetalhesSolicitacaoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [solicitacao, setSolicitacao] = useState<SolicitacaoDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const carregarSolicitacao = async () => {
      try {
        const resultado = await buscarSolicitacaoPorId(params.id)
        if (resultado.success && resultado.data) {
          setSolicitacao(resultado.data)
        } else {
          setError(resultado.error || 'Solicitação não encontrada')
        }
      } catch (err) {
        setError('Erro ao carregar solicitação')
      } finally {
        setLoading(false)
      }
    }

    carregarSolicitacao()
  }, [params.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'aprovada': return 'bg-green-100 text-green-800'
      case 'rejeitada': return 'bg-red-100 text-red-800'
      case 'separando': return 'bg-blue-100 text-blue-800'
      case 'separado': return 'bg-purple-100 text-purple-800'
      case 'em_entrega': return 'bg-orange-100 text-orange-800'
      case 'entregue': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-gray-100 text-gray-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'alta': return 'bg-yellow-100 text-yellow-800'
      case 'urgente': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatJanelaEntrega = (janela: string) => {
    switch (janela) {
      case 'manha': return 'Manhã'
      case 'tarde': return 'Tarde'
      case 'noite': return 'Noite'
      default: return janela
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">Carregando solicitação...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-12 rounded-3xl shadow-xl max-w-md mx-auto text-center">
          <div className="relative mb-6">
            <Package className="mx-auto h-16 w-16 text-red-300" />
            <div className="absolute -top-2 -right-2">
              <Star className="h-6 w-6 text-red-400 fill-current" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={() => router.back()} className="gradient-primary text-white border-0 hover:shadow-lg hover-lift">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  if (!solicitacao) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-12 rounded-3xl shadow-xl max-w-md mx-auto text-center">
          <div className="relative mb-6">
            <Package className="mx-auto h-16 w-16 text-gray-300" />
            <div className="absolute -top-2 -right-2">
              <Star className="h-6 w-6 text-yellow-400 fill-current" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Solicitação não encontrada</h3>
          <p className="text-gray-500 mb-6">A solicitação que você está procurando não existe</p>
          <Button onClick={() => router.back()} className="gradient-primary text-white border-0 hover:shadow-lg hover-lift">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="relative backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
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
      <div className="container mx-auto px-4 py-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              📋 Detalhes da Solicitação
            </h1>
            <p className="text-sm text-gray-500 font-medium">Visualize informações completas da solicitação</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(solicitacao.status)} px-3 py-1`}>
              {solicitacao.status.charAt(0).toUpperCase() + solicitacao.status.slice(1)}
            </Badge>
            <Badge className={`${getPrioridadeColor(solicitacao.prioridade)} px-3 py-1`}>
              {solicitacao.prioridade.charAt(0).toUpperCase() + solicitacao.prioridade.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          <div className="grid gap-8">
            {/* Informações Gerais */}
            <div className="animate-fade-in">
              <Card className="glass-card border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    📋 Informações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Data de Criação</span>
                      </div>
                      <div className="font-bold text-blue-800 text-sm">
                        {formatDate(solicitacao.created_at)}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">Solicitante</span>
                      </div>
                      <div className="font-bold text-purple-800 text-sm">
                        {solicitacao.solicitante}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Destino</span>
                      </div>
                      <div className="font-bold text-green-800 text-sm">
                        {solicitacao.praca_destino.nome}
                      </div>
                    </div>

                    {solicitacao.data_entrega && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-medium text-orange-600">Data de Entrega</span>
                        </div>
                        <div className="font-bold text-orange-800 text-sm">
                          {new Date(solicitacao.data_entrega).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-teal-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-teal-600" />
                        <span className="text-xs font-medium text-teal-600">Janela de Entrega</span>
                      </div>
                      <div className="font-bold text-teal-800 text-sm">
                        {formatJanelaEntrega(solicitacao.janela_entrega)}
                      </div>
                    </div>
                  </div>

                  {solicitacao.observacoes && (
                    <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                      <span className="text-xs font-medium text-gray-600">💬 Observações:</span>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{solicitacao.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Destino */}
            <div className="animate-fade-in">
              <Card className="glass-card border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 shadow-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    📍 Informações do Destino
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                      <span className="text-xs font-medium text-green-600">🏢 Local</span>
                      <div className="font-bold text-green-800 text-sm mt-1">
                        {solicitacao.praca_destino.nome}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                      <span className="text-xs font-medium text-blue-600">📁 Tipo</span>
                      <div className="font-bold text-blue-800 text-sm mt-1 capitalize">
                        {solicitacao.praca_destino.tipo}
                      </div>
                    </div>
                    {solicitacao.praca_destino.responsavel && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
                        <span className="text-xs font-medium text-purple-600">👤 Responsável</span>
                        <div className="font-bold text-purple-800 text-sm mt-1">
                          {solicitacao.praca_destino.responsavel}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Itens */}
            <div className="animate-fade-in">
              <Card className="glass-card border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    📦 Itens Solicitados
                  </CardTitle>
                  <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200 px-3 py-1">
                    {solicitacao.itens.length} {solicitacao.itens.length === 1 ? 'item' : 'itens'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {solicitacao.itens.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="glass-card rounded-xl p-4 shadow-lg animate-scale-in"
                        style={{animationDelay: `${index * 100}ms`}}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 shadow-sm">
                              <Package className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{item.produto.descricao}</h4>
                              <p className="text-sm text-gray-500">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{item.produto.produto_id}</code>
                                <span className="mx-2">•</span>
                                <span>{item.produto.grupo}</span>
                                <span className="mx-2">•</span>
                                <span>{item.produto.subgrupo}</span>
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200">
                            {item.produto.tipo}
                          </Badge>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                          <span className="text-xs font-medium text-blue-600">📊 Quantidade solicitada:</span>
                          <div className="font-bold text-blue-800 text-sm mt-1">
                            {item.quantidade_solicitada}
                          </div>
                        </div>

                        {item.observacoes && (
                          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                            <span className="text-xs font-medium text-gray-600">💬 Observações:</span>
                            <p className="text-sm text-gray-700 mt-1 leading-relaxed">{item.observacoes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}