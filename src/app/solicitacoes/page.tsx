'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { buscarSolicitacoes } from '@/lib/actions/solicitacoes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { SolicitacaoCompleta } from '@/types'

export default function SolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        const resultado = await buscarSolicitacoes(user?.id)
        if (resultado.success) {
          setSolicitacoes(resultado.data || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  const solicitacoesFiltradas = solicitacoes.filter(solicitacao =>
    solicitacao.praca_destino.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    solicitacao.observacoes?.toLowerCase().includes(filtro.toLowerCase()) ||
    solicitacao.status.toLowerCase().includes(filtro.toLowerCase())
  )

  if (loading) {
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
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
        </div>
        <Button asChild>
          <Link href="/solicitacoes/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Pesquisar solicitações..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {solicitacoesFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma solicitação encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/solicitacoes/nova">
              Criar primeira solicitação
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {solicitacoesFiltradas.map((solicitacao) => (
            <Card key={solicitacao.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {solicitacao.praca_destino.nome}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(solicitacao.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(solicitacao.status)}>
                      {solicitacao.status}
                    </Badge>
                    <Badge className={getPriorityColor(solicitacao.prioridade)}>
                      {solicitacao.prioridade}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Janela de entrega:</span>
                    <span className="font-medium">{solicitacao.janela_entrega}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tipo:</span>
                    <span className="font-medium">{solicitacao.tipo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Itens:</span>
                    <span className="font-medium">{solicitacao.itens.length}</span>
                  </div>
                  {solicitacao.observacoes && (
                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Observações:</strong> {solicitacao.observacoes}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/solicitacoes/${solicitacao.id}`}>
                      Ver detalhes
                    </Link>
                  </Button>
                  {solicitacao.status === 'pendente' && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/solicitacoes/${solicitacao.id}/editar`}>
                        Editar
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}