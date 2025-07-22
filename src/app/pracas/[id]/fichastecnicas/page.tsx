'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { buscarFichasPorPraca } from '@/lib/actions/fichastecnicas'
import { buscarPracaPorId } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Search,
  ChefHat,
  Clock,
  Users,
  Star,
  Eye,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { FichaTecnica, PracaDestino, CategoriaFicha, DificuldadeFicha } from '@/types'

export default function PracaFichasTecnicasPage() {
  const params = useParams()
  const pracaId = params.id as string
  const [praca, setPraca] = useState<PracaDestino | null>(null)
  const [fichas, setFichas] = useState<FichaTecnica[]>([])
  const [fichasFiltradas, setFichasFiltradas] = useState<FichaTecnica[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFicha | ''>('')
  const [dificuldadeFiltro, setDificuldadeFiltro] = useState<DificuldadeFicha | ''>('')
  const [showFiltros, setShowFiltros] = useState(false)

  useEffect(() => {
    if (pracaId) {
      carregarDados()
    }
  }, [pracaId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    aplicarFiltros()
  }, [fichas, filtro, categoriaFiltro, dificuldadeFiltro]) // eslint-disable-line react-hooks/exhaustive-deps

  const carregarDados = async () => {
    setLoading(true)
    try {
      const [resultadoPraca, resultadoFichas] = await Promise.all([
        buscarPracaPorId(pracaId),
        buscarFichasPorPraca(pracaId)
      ])

      if (resultadoPraca.success) {
        setPraca(resultadoPraca.data)
      }

      if (resultadoFichas.success) {
        setFichas(resultadoFichas.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let resultado = [...fichas]

    if (filtro) {
      const filtroLower = filtro.toLowerCase()
      resultado = resultado.filter(ficha => 
        ficha.nome.toLowerCase().includes(filtroLower) ||
        ficha.descricao?.toLowerCase().includes(filtroLower)
      )
    }

    if (categoriaFiltro) {
      resultado = resultado.filter(ficha => ficha.categoria === categoriaFiltro)
    }

    if (dificuldadeFiltro) {
      resultado = resultado.filter(ficha => ficha.dificuldade === dificuldadeFiltro)
    }

    setFichasFiltradas(resultado)
  }

  const limparFiltros = () => {
    setFiltro('')
    setCategoriaFiltro('')
    setDificuldadeFiltro('')
  }

  const getCategoriaIcon = (categoria: CategoriaFicha) => {
    const icons = {
      'prato': '🍽️',
      'bebida': '🥤',
      'sobremesa': '🍰',
      'entrada': '🥗'
    }
    return icons[categoria] || '🍽️'
  }

  const getCategoriaLabel = (categoria: CategoriaFicha) => {
    const labels = {
      'prato': 'Prato',
      'bebida': 'Bebida',
      'sobremesa': 'Sobremesa',
      'entrada': 'Entrada'
    }
    return labels[categoria] || 'Prato'
  }

  const getDificuldadeColor = (dificuldade: DificuldadeFicha) => {
    const colors = {
      'facil': 'bg-green-100 text-green-800',
      'medio': 'bg-yellow-100 text-yellow-800',
      'dificil': 'bg-red-100 text-red-800'
    }
    return colors[dificuldade] || 'bg-gray-100 text-gray-800'
  }

  const getDificuldadeLabel = (dificuldade: DificuldadeFicha) => {
    const labels = {
      'facil': 'Fácil',
      'medio': 'Médio',
      'dificil': 'Difícil'
    }
    return labels[dificuldade] || 'Médio'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!praca) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Praça não encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/pracas">
              Voltar para praças
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href={`/pracas/${pracaId}/solicitacoes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Fichas Técnicas</h1>
            <p className="text-gray-600">Praça: {praca.nome}</p>
            <p className="text-sm text-gray-500">Total: {fichasFiltradas.length} fichas disponíveis</p>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Pesquisar fichas técnicas..."
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
          {(categoriaFiltro || dificuldadeFiltro) && (
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          )}
        </div>

        {showFiltros && (
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value as CategoriaFicha | '')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todas as categorias</option>
                  <option value="prato">Prato</option>
                  <option value="bebida">Bebida</option>
                  <option value="sobremesa">Sobremesa</option>
                  <option value="entrada">Entrada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Dificuldade</label>
                <select
                  value={dificuldadeFiltro}
                  onChange={(e) => setDificuldadeFiltro(e.target.value as DificuldadeFicha | '')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todas as dificuldades</option>
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Fichas */}
      {fichasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            {fichas.length === 0 
              ? 'Nenhuma ficha técnica vinculada a esta praça'
              : 'Nenhuma ficha encontrada com os filtros aplicados'
            }
          </p>
          {fichas.length === 0 && (
            <div className="mt-4 space-y-2">
              <Button asChild>
                <Link href="/fichastecnicas">
                  Ver todas as fichas técnicas
                </Link>
              </Button>
              <p className="text-sm text-gray-500">
                Para vincular fichas a esta praça, edite as fichas técnicas
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fichasFiltradas.map((ficha) => (
            <Card key={ficha.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-2xl">{getCategoriaIcon(ficha.categoria)}</span>
                    <div>
                      <CardTitle className="text-lg line-clamp-2">
                        {ficha.nome}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {getCategoriaLabel(ficha.categoria)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">Disponível</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ficha.descricao && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {ficha.descricao}
                  </p>
                )}

                <div className="space-y-2">
                  {ficha.tempo_preparo && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Tempo:</span>
                      <span className="font-medium">{ficha.tempo_preparo} min</span>
                    </div>
                  )}

                  {ficha.rendimento && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Rendimento:</span>
                      <span className="font-medium">{ficha.rendimento} porções</span>
                    </div>
                  )}

                  {ficha.dificuldade && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Dificuldade:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDificuldadeColor(ficha.dificuldade)}`}>
                        {getDificuldadeLabel(ficha.dificuldade)}
                      </span>
                    </div>
                  )}

                  {ficha.custo_estimado && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Custo estimado:</span>
                      <span className="font-medium">R$ {ficha.custo_estimado.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <Link href={`/fichastecnicas/${ficha.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estatísticas por Categoria */}
      {fichas.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Resumo por Categoria</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['prato', 'bebida', 'sobremesa', 'entrada'] as CategoriaFicha[]).map(categoria => {
              const count = fichas.filter(f => f.categoria === categoria).length
              if (count === 0) return null
              
              return (
                <Card key={categoria}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{getCategoriaIcon(categoria)}</div>
                    <div className="font-semibold text-lg">{count}</div>
                    <div className="text-sm text-gray-600">{getCategoriaLabel(categoria)}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}