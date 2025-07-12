'use client'

import { useEffect, useState, useCallback } from 'react'
import { buscarAgrupamentos, deletarAgrupamento } from '@/lib/actions/produtos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Package2,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { Agrupamento } from '@/types'

export default function AgrupamentosPage() {
  const [agrupamentos, setAgrupamentos] = useState<Agrupamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const carregarDados = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const resultado = await buscarAgrupamentos(filtro || undefined, tipoFiltro || undefined, page)
      
      if (resultado.success) {
        setAgrupamentos(resultado.data || [])
        setTotalPages(resultado.totalPages || 1)
        setTotal(resultado.total || 0)
        setCurrentPage(resultado.currentPage || 1)
      }
    } catch (error) {
      console.error('Erro ao carregar agrupamentos:', error)
    } finally {
      setLoading(false)
    }
  }, [filtro, tipoFiltro])

  useEffect(() => {
    carregarDados(1)
  }, [carregarDados])

  const handleDelete = async (id: string, descricao: string) => {
    if (confirm(`Tem certeza que deseja deletar o agrupamento "${descricao}"?`)) {
      const resultado = await deletarAgrupamento(id)
      if (resultado.success) {
        carregarDados(currentPage)
      } else {
        alert('Erro ao deletar agrupamento: ' + resultado.error)
      }
    }
  }

  const handlePageChange = (page: number) => {
    carregarDados(page)
  }

  const limparFiltros = () => {
    setFiltro('')
    setTipoFiltro('')
    setCurrentPage(1)
  }

  if (loading && agrupamentos.length === 0) {
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
            <h1 className="text-3xl font-bold">Agrupamentos</h1>
            <p className="text-gray-600">Total: {total} agrupamentos</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/agrupamentos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agrupamento
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
              placeholder="Pesquisar agrupamentos..."
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
          {tipoFiltro && (
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>

        {showFiltros && (
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="max-w-md">
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
          </div>
        )}
      </div>

      {/* Lista de Agrupamentos */}
      {agrupamentos.length === 0 ? (
        <div className="text-center py-12">
          <Package2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhum agrupamento encontrado</p>
          <Button asChild className="mt-4">
            <Link href="/agrupamentos/novo">
              Criar primeiro agrupamento
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agrupamentos.map((agrupamento) => (
              <Card key={agrupamento.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {agrupamento.grupo} › {agrupamento.subgrupo}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {agrupamento.cod_agrupamento}
                      </p>
                      {agrupamento.descricao && (
                        <p className="text-sm text-gray-600 mt-1">
                          {agrupamento.descricao}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">
                        {agrupamento.tipo}
                      </Badge>
                      <Badge variant={agrupamento.ativo ? "default" : "secondary"}>
                        {agrupamento.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href={`/agrupamentos/${agrupamento.id}/editar`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(agrupamento.id, `${agrupamento.grupo} › ${agrupamento.subgrupo}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}