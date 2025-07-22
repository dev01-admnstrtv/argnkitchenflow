'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { buscarFichaTecnicaPorId } from '@/lib/actions/fichastecnicas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  Users, 
  Star, 
  DollarSign,
  ChefHat,
  MapPin,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { FichaTecnicaCompleta, CategoriaFicha, DificuldadeFicha } from '@/types'
import Image from 'next/image'

export default function FichaTecnicaDetalhesPage() {
  const params = useParams()
  const id = params.id as string
  const [ficha, setFicha] = useState<FichaTecnicaCompleta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      carregarFicha()
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const carregarFicha = async () => {
    setLoading(true)
    try {
      const resultado = await buscarFichaTecnicaPorId(id)
      if (resultado.success) {
        setFicha(resultado.data || null)
      } else {
        console.error('Erro ao carregar ficha:', resultado.error)
      }
    } catch (error) {
      console.error('Erro ao carregar ficha:', error)
    } finally {
      setLoading(false)
    }
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

  const calcularQuantidadeReal = (quantidade: number, fatorCorrecao: number) => {
    return (quantidade * fatorCorrecao).toFixed(3)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!ficha) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Ficha técnica não encontrada</p>
          <Button asChild className="mt-4">
            <Link href="/fichastecnicas">
              Voltar para fichas técnicas
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const fotosPrincipais = ficha.fotos.filter(foto => foto.principal)
  const fotosSecundarias = ficha.fotos.filter(foto => !foto.principal).sort((a, b) => a.ordem - b.ordem)
  const ingredientesObrigatorios = ficha.ingredientes.filter(ing => !ing.opcional)
  const ingredientesOpcionais = ficha.ingredientes.filter(ing => ing.opcional)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/fichastecnicas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-3xl">{getCategoriaIcon(ficha.categoria)}</span>
              {ficha.nome}
            </h1>
            <p className="text-gray-600">{getCategoriaLabel(ficha.categoria)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={ficha.ativo ? "default" : "secondary"}>
            {ficha.ativo ? "Ativo" : "Inativo"}
          </Badge>
          <Button asChild>
            <Link href={`/fichastecnicas/${ficha.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ficha.descricao && (
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-gray-600">{ficha.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ficha.tempo_preparo && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Tempo</p>
                      <p className="font-medium">{ficha.tempo_preparo} min</p>
                    </div>
                  </div>
                )}

                {ficha.rendimento && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Rendimento</p>
                      <p className="font-medium">{ficha.rendimento} porções</p>
                    </div>
                  </div>
                )}

                {ficha.dificuldade && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Dificuldade</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDificuldadeColor(ficha.dificuldade)}`}>
                        {getDificuldadeLabel(ficha.dificuldade)}
                      </span>
                    </div>
                  </div>
                )}

                {ficha.custo_estimado && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Custo</p>
                      <p className="font-medium">R$ {ficha.custo_estimado.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {ficha.observacoes && (
                <div>
                  <h4 className="font-medium mb-2">Observações</h4>
                  <p className="text-gray-600">{ficha.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fotos */}
          {ficha.fotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Fotos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fotosPrincipais.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Foto Principal</h4>
                    <div className="grid gap-4">
                      {fotosPrincipais.map((foto) => (
                        <div key={foto.id} className="relative">
                          <Image
                            src={foto.url}
                            alt={foto.descricao || ficha.nome}
                            width={400}
                            height={300}
                            className="rounded-lg object-cover w-full h-64"
                          />
                          {foto.descricao && (
                            <p className="text-sm text-gray-600 mt-2">{foto.descricao}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {fotosSecundarias.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Outras Fotos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {fotosSecundarias.map((foto) => (
                        <div key={foto.id} className="relative">
                          <Image
                            src={foto.url}
                            alt={foto.descricao || ficha.nome}
                            width={200}
                            height={150}
                            className="rounded-lg object-cover w-full h-32"
                          />
                          {foto.descricao && (
                            <p className="text-xs text-gray-600 mt-1">{foto.descricao}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Modo de Preparo */}
          {ficha.preparo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Modo de Preparo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ficha.preparo.map((passo, index) => (
                    <div key={passo.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {passo.passo}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          {passo.tempo_estimado && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              {passo.tempo_estimado} min
                            </div>
                          )}
                          {passo.temperatura && (
                            <div className="text-sm text-gray-600">
                              🌡️ {passo.temperatura}°C
                            </div>
                          )}
                        </div>
                        <p className="text-gray-800">{passo.descricao}</p>
                        {passo.observacoes && (
                          <p className="text-sm text-gray-600 mt-1 italic">{passo.observacoes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Ingredientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Ingredientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredientesObrigatorios.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Obrigatórios</h4>
                  <div className="space-y-2">
                    {ingredientesObrigatorios.map((ingrediente) => (
                      <div key={ingrediente.id} className="flex justify-between items-start text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{ingrediente.produto.descricao}</p>
                          <div className="text-gray-600 space-y-1">
                            <p>
                              Quantidade: {ingrediente.quantidade} {ingrediente.unidade}
                              {ingrediente.fator_correcao !== 1 && (
                                <span className="text-orange-600">
                                  {' '}(Real: {calcularQuantidadeReal(ingrediente.quantidade, ingrediente.fator_correcao)} {ingrediente.unidade})
                                </span>
                              )}
                            </p>
                            {ingrediente.fator_correcao !== 1 && (
                              <p className="text-xs text-orange-600">
                                Fator de correção: {ingrediente.fator_correcao}x
                              </p>
                            )}
                          </div>
                          {ingrediente.observacoes && (
                            <p className="text-xs text-gray-500 italic mt-1">{ingrediente.observacoes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ingredientesOpcionais.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Opcionais</h4>
                  <div className="space-y-2">
                    {ingredientesOpcionais.map((ingrediente) => (
                      <div key={ingrediente.id} className="flex justify-between items-start text-sm opacity-75">
                        <div className="flex-1">
                          <p className="font-medium">{ingrediente.produto.descricao} (opcional)</p>
                          <div className="text-gray-600 space-y-1">
                            <p>
                              Quantidade: {ingrediente.quantidade} {ingrediente.unidade}
                              {ingrediente.fator_correcao !== 1 && (
                                <span className="text-orange-600">
                                  {' '}(Real: {calcularQuantidadeReal(ingrediente.quantidade, ingrediente.fator_correcao)} {ingrediente.unidade})
                                </span>
                              )}
                            </p>
                          </div>
                          {ingrediente.observacoes && (
                            <p className="text-xs text-gray-500 italic mt-1">{ingrediente.observacoes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Praças */}
          {ficha.pracas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Praças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ficha.pracas.map((pracaVinculo) => (
                    <div key={pracaVinculo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{pracaVinculo.praca_destino.nome}</span>
                      <Badge variant={pracaVinculo.ativo ? "default" : "secondary"} size="sm">
                        {pracaVinculo.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}