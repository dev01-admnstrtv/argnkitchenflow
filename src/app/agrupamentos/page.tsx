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
  Filter,
  Sparkles,
  Star
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
    <div className="min-h-screen">
      {/* Modern Header */}
      <header className="relative backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="relative container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="hover-lift glass-card">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <div className="flex items-center gap-4">
                <Image
                  src="https://www.administrative.com.br/aragon/aragon.png"
                  alt="Logo do Restaurante"
                  width={48}
                  height={48}
                  className="rounded-xl shadow-lg ring-2 ring-white/50"
                />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Agrupamentos de Produtos
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">Total: {total} agrupamentos</p>
                </div>
              </div>
            </div>
            <Button asChild className="gradient-primary text-white border-0 hover:shadow-lg hover-lift">
              <Link href="/agrupamentos/novo">
                <Plus className="h-4 w-4 mr-2" />
                <Sparkles className="h-4 w-4 mr-1" />
                Novo Agrupamento
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">

        {/* Search and Filters Section */}
        <div className="mb-8 space-y-6 animate-fade-in">
          <div className="glass-card p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="🔍 Pesquisar agrupamentos (mínimo 3 caracteres)..."
                  value={filtroInput}
                  onChange={(e) => setFiltroInput(e.target.value)}
                  className="pl-12 h-12 text-base focus-ring rounded-xl border-0 bg-white/50"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFiltros(!showFiltros)}
                  className="flex items-center gap-2 hover-lift glass-card h-12 px-6"
                >
                  <Filter className="h-4 w-4" />
                  Filtros Avançados
                </Button>
                {(tipoFiltro || filtroInput) && (
                  <Button 
                    variant="outline" 
                    onClick={limparFiltros}
                    className="hover-lift glass-card h-12 px-6 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    ✨ Limpar Filtros
                  </Button>
                )}
              </div>
            </div>

            {showFiltros && (
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 animate-slide-up">
                <div className="max-w-md">
                  <label className="block text-sm font-semibold mb-3 text-gray-700">🏷️ Tipo de Produto</label>
                  <select
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus-ring bg-white shadow-sm"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="insumo">🔧 Insumo</option>
                    <option value="produzido">👨‍🍳 Produzido</option>
                    <option value="produto">📦 Produto</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Agrupamentos */}
        {agrupamentos.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="glass-card p-12 rounded-3xl shadow-xl max-w-md mx-auto">
              <div className="relative mb-6">
                <Package2 className="mx-auto h-16 w-16 text-gray-300 animate-float" />
                <div className="absolute -top-2 -right-2">
                  <Star className="h-6 w-6 text-yellow-400 fill-current animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum agrupamento encontrado</h3>
              <p className="text-gray-500 mb-6">Que tal criar o primeiro agrupamento?</p>
              <Button asChild className="gradient-primary text-white border-0 hover:shadow-lg hover-lift">
                <Link href="/agrupamentos/novo">
                  <Plus className="h-4 w-4 mr-2" />
                  <Sparkles className="h-4 w-4 mr-1" />
                  Criar Primeiro Agrupamento
                </Link>
              </Button>
            </div>
          </div>
        ) : (
        <>
          {agruparPorGrupo(agrupamentos).map((grupo, groupIndex) => {
            const groupKey = grupo.grupo
            
            return (
              <div 
                key={groupKey} 
                className="mb-8 animate-slide-up"
                style={{animationDelay: `${groupIndex * 150}ms`}}
              >
                {/* Group Header */}
                <div className="flex items-center gap-4 mb-4 p-4 glass-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">{grupo.grupo}</h2>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 px-3 py-1">
                    {grupo.agrupamentos.length} {grupo.agrupamentos.length === 1 ? 'agrupamento' : 'agrupamentos'}
                  </Badge>
                </div>

                {/* Responsive Layout - Desktop Table / Mobile Cards */}
                
                {/* Desktop Table - Hidden on Mobile */}
                <div className="hidden md:block glass-card rounded-2xl shadow-lg overflow-hidden border-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700">Subgrupo</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700">Código</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-blue-700">Descrição</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700">Tipo</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700">Status</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {grupo.agrupamentos.map((agrupamento, agrupIndex) => (
                          <tr 
                            key={agrupamento.id} 
                            className="hover:bg-blue-50/50 transition-colors duration-200 animate-scale-in group"
                            style={{animationDelay: `${(groupIndex * 150) + (agrupIndex * 50)}ms`}}
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                                {agrupamento.subgrupo}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                                {agrupamento.cod_agrupamento}
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-xs">
                                {agrupamento.descricao || 'Sem descrição'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="outline" className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200">
                                {agrupamento.tipo}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge 
                                variant={agrupamento.ativo ? "default" : "secondary"} 
                                className={agrupamento.ativo 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                                }
                              >
                                {agrupamento.ativo ? '✅ Ativo' : '❌ Inativo'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="h-8 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 hover-lift"
                                >
                                  <Link href={`/agrupamentos/${agrupamento.id}/editar`}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(agrupamento.id, `${agrupamento.grupo} › ${agrupamento.subgrupo}`)}
                                  className="h-8 hover:bg-red-50 hover:border-red-200 hover:text-red-700 hover-lift"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Cards - Visible only on Mobile */}
                <div className="md:hidden space-y-3">
                  {grupo.agrupamentos.map((agrupamento, agrupIndex) => (
                    <Card 
                      key={agrupamento.id} 
                      className="glass-card border-0 shadow-lg animate-scale-in"
                      style={{animationDelay: `${(groupIndex * 150) + (agrupIndex * 50)}ms`}}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-semibold text-gray-800 leading-tight">
                              {agrupamento.subgrupo}
                            </CardTitle>
                            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono mt-1 inline-block">
                              {agrupamento.cod_agrupamento}
                            </code>
                          </div>
                          <div className="flex flex-col gap-1 ml-2">
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200">
                              {agrupamento.tipo}
                            </Badge>
                            <Badge 
                              variant={agrupamento.ativo ? "default" : "secondary"} 
                              className={`text-xs ${agrupamento.ativo 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              {agrupamento.ativo ? '✅ Ativo' : '❌ Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {agrupamento.descricao && (
                          <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                            <span className="text-xs font-medium text-gray-600">📄 Descrição:</span>
                            <p className="text-sm text-gray-700 mt-1">
                              {agrupamento.descricao}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 h-9 text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                          >
                            <Link href={`/agrupamentos/${agrupamento.id}/editar`}>
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(agrupamento.id, `${agrupamento.grupo} › ${agrupamento.subgrupo}`)}
                            className="h-9 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  )
}