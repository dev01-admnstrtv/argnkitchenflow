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
  Package,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { Agrupamento } from '@/types'
import Image from 'next/image'

export default function AgrupamentosPage() {
  const [agrupamentos, setAgrupamentos] = useState<Agrupamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [total, setTotal] = useState(0)
  const [filtroInput, setFiltroInput] = useState('')

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const filtroEfetivo = filtro.length >= 3 ? filtro : undefined
      const resultado = await buscarAgrupamentos(filtroEfetivo, tipoFiltro || undefined, 1, 1000)
      
      if (resultado.success) {
        setAgrupamentos(resultado.data || [])
        setTotal(resultado.total || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar agrupamentos:', error)
    } finally {
      setLoading(false)
    }
  }, [filtro, tipoFiltro])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Debounce para o filtro de pesquisa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFiltro(filtroInput)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filtroInput])

  const handleDelete = async (id: string, descricao: string) => {
    if (confirm(`Tem certeza que deseja deletar o agrupamento "${descricao}"?`)) {
      const resultado = await deletarAgrupamento(id)
      if (resultado.success) {
        carregarDados()
      } else {
        alert('Erro ao deletar agrupamento: ' + resultado.error)
      }
    }
  }


  const limparFiltros = () => {
    setFiltro('')
    setFiltroInput('')
    setTipoFiltro('')
  }

  // Função para agrupar agrupamentos por grupo
  const agruparPorGrupo = (agrupamentos: Agrupamento[]) => {
    const agrupados = agrupamentos.reduce((acc, agrupamento) => {
      const grupo = agrupamento.grupo
      if (!acc[grupo]) {
        acc[grupo] = {
          grupo: grupo,
          agrupamentos: []
        }
      }
      acc[grupo].agrupamentos.push(agrupamento)
      return acc
    }, {} as Record<string, { grupo: string, agrupamentos: Agrupamento[] }>)

    // Converter para array e ordenar por grupo
    return Object.values(agrupados).sort((a, b) => {
      return a.grupo.localeCompare(b.grupo)
    })
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
          <div className="flex items-center gap-4">
            <Image
              src="https://www.administrative.com.br/aragon/aragon.png"
              alt="Logo do Restaurante"
              width={60}
              height={60}
              className="rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-3xl font-bold">Agrupamentos</h1>
              <p className="text-gray-600">Total: {total} agrupamentos</p>
            </div>
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
              placeholder="Pesquisar agrupamentos (mínimo 3 caracteres)..."
              value={filtroInput}
              onChange={(e) => setFiltroInput(e.target.value)}
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
          {(tipoFiltro || filtroInput) && (
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
          {agruparPorGrupo(agrupamentos).map((grupo) => {
            const groupKey = grupo.grupo
            
            return (
              <div key={groupKey} className="mb-8">
                {/* Cabeçalho do Grupo */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">{grupo.grupo}</h2>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {grupo.agrupamentos.length} {grupo.agrupamentos.length === 1 ? 'agrupamento' : 'agrupamentos'}
                  </Badge>
                </div>

                {/* Grid de Agrupamentos do Grupo - Sempre visível */}
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {grupo.agrupamentos.map((agrupamento) => (
                    <Card key={agrupamento.id} className="hover:shadow-md transition-all duration-200 hover:scale-105">
                      <CardHeader className="pb-2">
                        <div className="space-y-2">
                          <CardTitle className="text-sm font-medium">
                            {agrupamento.subgrupo}
                          </CardTitle>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                              {agrupamento.cod_agrupamento}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {agrupamento.tipo}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="space-y-1">
                          {agrupamento.descricao && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {agrupamento.descricao}
                            </p>
                          )}
                          <div className="flex justify-end">
                            <Badge variant={agrupamento.ativo ? "default" : "secondary"} className="text-xs">
                              {agrupamento.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 h-8 text-xs"
                          >
                            <Link href={`/agrupamentos/${agrupamento.id}/editar`}>
                              <Edit className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(agrupamento.id, `${agrupamento.grupo} › ${agrupamento.subgrupo}`)}
                            className="h-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}