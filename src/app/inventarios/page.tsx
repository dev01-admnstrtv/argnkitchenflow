'use client'

import { useEffect, useState, useCallback } from 'react'
import { buscarInventarios, deletarInventario, finalizarInventario } from '@/lib/actions/inventarios'
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
  ClipboardList,
  Filter,
  CheckCircle,
  Calendar,
  MapPin,
  User,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { InventarioData } from '@/lib/actions/inventarios'

export default function InventariosPage() {
  const [inventarios, setInventarios] = useState<InventarioData[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [total, setTotal] = useState(0)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const resultado = await buscarInventarios(
        filtro || undefined, 
        statusFiltro || undefined, 
        1, 
        1000
      )

      if (resultado.success) {
        setInventarios(resultado.data || [])
        setTotal(resultado.total || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar inventários:', error)
    } finally {
      setLoading(false)
    }
  }, [filtro, statusFiltro])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const handleDelete = async (id: string, numeroInventario: string) => {
    if (confirm(`Tem certeza que deseja deletar o inventário "${numeroInventario}"?`)) {
      const resultado = await deletarInventario(id)
      if (resultado.success) {
        carregarDados()
      } else {
        alert('Erro ao deletar inventário: ' + resultado.error)
      }
    }
  }

  const handleFinalizar = async (id: string, numeroInventario: string) => {
    if (confirm(`Tem certeza que deseja finalizar o inventário "${numeroInventario}"? Após finalizado não poderá ser mais editado.`)) {
      const resultado = await finalizarInventario(id)
      if (resultado.success) {
        carregarDados()
      } else {
        alert('Erro ao finalizar inventário: ' + resultado.error)
      }
    }
  }

  const limparFiltros = () => {
    setFiltro('')
    setStatusFiltro('')
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

  if (loading && inventarios.length === 0) {
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
            <h1 className="text-3xl font-bold">Inventários</h1>
            <p className="text-gray-600">Total: {total} inventários</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/inventarios/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Inventário
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
              placeholder="Pesquisar inventários..."
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
          {statusFiltro && (
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>

        {showFiltros && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todos os status</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Inventários */}
      {inventarios.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Nenhum inventário encontrado</p>
          <Button asChild className="mt-4">
            <Link href="/inventarios/novo">
              Criar primeiro inventário
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inventarios.map((inventario) => (
            <Card key={inventario.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {inventario.numero_inventario}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {inventario.praca_nome}
                    </p>
                  </div>
                  {getStatusBadge(inventario.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{formatarData(inventario.data_contagem)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Responsável:</span>
                    <span className="font-medium">{inventario.responsavel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Itens:</span>
                    <span className="font-medium">{inventario.total_itens}</span>
                  </div>
                  {inventario.observacoes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Obs:</span>
                      <p className="font-medium text-gray-700 mt-1 line-clamp-2">
                        {inventario.observacoes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/inventarios/${inventario.id}`}>
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Ver
                    </Link>
                  </Button>
                  
                  {inventario.status === 'em_andamento' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/inventarios/${inventario.id}/editar`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFinalizar(inventario.id, inventario.numero_inventario)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(inventario.id, inventario.numero_inventario)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
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