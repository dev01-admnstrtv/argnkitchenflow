'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, MapPin, Clock, Package } from 'lucide-react'
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
  solicitante: {
    nome: string
  }
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <Button onClick={() => router.back()}>Voltar</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!solicitacao) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-gray-600 text-lg mb-4">Solicitação não encontrada</div>
            <Button onClick={() => router.back()}>Voltar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Detalhes da Solicitação</h1>
        </div>

        <div className="grid gap-6">
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(solicitacao.status)}>
                    {solicitacao.status.charAt(0).toUpperCase() + solicitacao.status.slice(1)}
                  </Badge>
                  <Badge className={getPrioridadeColor(solicitacao.prioridade)}>
                    {solicitacao.prioridade.charAt(0).toUpperCase() + solicitacao.prioridade.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Criada em: {formatDate(solicitacao.created_at)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Solicitante: {solicitacao.solicitante.nome}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Destino: {solicitacao.praca_destino.nome}</span>
                </div>

                {solicitacao.data_entrega && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Data de Entrega: {new Date(solicitacao.data_entrega).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Janela: {formatJanelaEntrega(solicitacao.janela_entrega)}</span>
                </div>
              </div>

              {solicitacao.observacoes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Observações:</h4>
                  <p className="text-sm text-gray-700">{solicitacao.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Destino */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Destino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Local</label>
                  <p className="font-medium">{solicitacao.praca_destino.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo</label>
                  <p className="font-medium capitalize">{solicitacao.praca_destino.tipo}</p>
                </div>
                {solicitacao.praca_destino.responsavel && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Responsável</label>
                    <p className="font-medium">{solicitacao.praca_destino.responsavel}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Itens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens Solicitados ({solicitacao.itens.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {solicitacao.itens.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.produto.descricao}</h4>
                        <p className="text-sm text-gray-600">
                          {item.produto.produto_id} • {item.produto.grupo} • {item.produto.subgrupo}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {item.produto.tipo}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Quantidade: </span>
                        <span className="font-medium">{item.quantidade_solicitada}</span>
                      </div>
                    </div>

                    {item.observacoes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Observações:</strong> {item.observacoes}
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
  )
}