'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarFichaTecnica, adicionarIngrediente, adicionarPassoPreparo, vincularPraca } from '@/lib/actions/fichastecnicas'
import { buscarProdutos } from '@/lib/actions/produtos'
import { buscarPracas } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Stepper } from '@/components/ui/stepper'
import { SimpleCombobox, type ComboboxOption } from '@/components/ui/simple-combobox'
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  ChefHat,
  Clock,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  GripVertical
} from 'lucide-react'
import Link from 'next/link'
import { 
  FichaTecnicaInsert, 
  FichaTecnicaIngredienteInsert, 
  FichaTecnicaPreparoInsert,
  FichaTecnicaPracaInsert,
  Produto, 
  PracaDestino,
  CategoriaFicha,
  DificuldadeFicha
} from '@/types'
import { 
  fichaTecnicaSchema, 
  fichaTecnicaIngredienteSchema, 
  fichaTecnicaPreparoSchema 
} from '@/lib/validations'

interface IngredienteFormData extends Omit<FichaTecnicaIngredienteInsert, 'ficha_tecnica_id'> {
  tempId: string
}

interface PreparoFormData extends Omit<FichaTecnicaPreparoInsert, 'ficha_tecnica_id'> {
  tempId: string
}

export default function NovaFichaTecnicaPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pracas, setPracas] = useState<PracaDestino[]>([])
  
  // Etapa 1: Informações Básicas
  const [fichaTecnica, setFichaTecnica] = useState<FichaTecnicaInsert>({
    nome: '',
    descricao: '',
    categoria: 'prato',
    tempo_preparo: undefined,
    rendimento: undefined,
    dificuldade: undefined,
    custo_estimado: undefined,
    observacoes: '',
    ativo: true,
  })

  // Etapa 2: Ingredientes
  const [ingredientes, setIngredientes] = useState<IngredienteFormData[]>([])
  const [novoIngrediente, setNovoIngrediente] = useState<IngredienteFormData>({
    tempId: '',
    produto_id: '',
    quantidade: 0,
    unidade: '',
    fator_correcao: 1.0,
    opcional: false,
    observacoes: '',
  })

  // Etapa 3: Modo de Preparo
  const [preparo, setPreparo] = useState<PreparoFormData[]>([])
  const [novoPasso, setNovoPasso] = useState<PreparoFormData>({
    tempId: '',
    passo: 1,
    descricao: '',
    tempo_estimado: undefined,
    temperatura: undefined,
    observacoes: '',
  })

  // Etapa 4: Praças
  const [pracasSelecionadas, setPracasSelecionadas] = useState<string[]>([])

  const steps = ['Informações Básicas', 'Ingredientes', 'Modo de Preparo', 'Praças']

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const [resultadoProdutos, resultadoPracas] = await Promise.all([
        buscarProdutos(undefined, undefined, undefined, 1, 1000), // Aumentar limite para carregar todos
        buscarPracas()
      ])

      if (resultadoProdutos.success) {
        setProdutos(resultadoProdutos.data || [])
      }

      if (resultadoPracas.success) {
        setPracas(resultadoPracas.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const validarEtapa = (etapa: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (etapa) {
      case 1:
        try {
          fichaTecnicaSchema.parse(fichaTecnica)
        } catch (error: any) {
          error.errors?.forEach((err: any) => {
            newErrors[err.path[0]] = err.message
          })
        }
        break

      case 2:
        if (ingredientes.length === 0) {
          newErrors.ingredientes = 'Adicione pelo menos um ingrediente'
        } else {
          ingredientes.forEach((ingrediente, index) => {
            try {
              fichaTecnicaIngredienteSchema.parse({
                produto_id: ingrediente.produto_id,
                quantidade: ingrediente.quantidade,
                unidade: ingrediente.unidade,
                fator_correcao: ingrediente.fator_correcao,
                opcional: ingrediente.opcional,
                observacoes: ingrediente.observacoes,
              })
            } catch (error: any) {
              error.errors?.forEach((err: any) => {
                newErrors[`ingrediente_${index}_${err.path[0]}`] = err.message
              })
            }
          })
        }
        break

      case 3:
        if (preparo.length === 0) {
          newErrors.preparo = 'Adicione pelo menos um passo de preparo'
        } else {
          preparo.forEach((passo, index) => {
            try {
              fichaTecnicaPreparoSchema.parse({
                passo: passo.passo,
                descricao: passo.descricao,
                tempo_estimado: passo.tempo_estimado,
                temperatura: passo.temperatura,
                observacoes: passo.observacoes,
              })
            } catch (error: any) {
              error.errors?.forEach((err: any) => {
                newErrors[`preparo_${index}_${err.path[0]}`] = err.message
              })
            }
          })
        }
        break

      case 4:
        // Praças são opcionais
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const proximaEtapa = () => {
    if (validarEtapa(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const etapaAnterior = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const calcularCustoEstimado = () => {
    const custoIngredientes = ingredientes.reduce((total, ingrediente) => {
      const produto = produtos.find(p => p.id === ingrediente.produto_id)
      if (produto && produto.custo) {
        const custoReal = (ingrediente.quantidade * ingrediente.fator_correcao * produto.custo)
        return total + custoReal
      }
      return total
    }, 0)

    setFichaTecnica(prev => ({
      ...prev,
      custo_estimado: custoIngredientes > 0 ? custoIngredientes : undefined
    }))
  }

  const adicionarNovoIngrediente = () => {
    if (!novoIngrediente.produto_id || !novoIngrediente.quantidade || !novoIngrediente.unidade) {
      return
    }

    const tempId = `temp_${Date.now()}`
    setIngredientes(prev => [...prev, { ...novoIngrediente, tempId }])
    setNovoIngrediente({
      tempId: '',
      produto_id: '',
      quantidade: 0,
      unidade: '',
      fator_correcao: 1.0,
      opcional: false,
      observacoes: '',
    })
    calcularCustoEstimado()
  }

  const removerIngrediente = (tempId: string) => {
    setIngredientes(prev => prev.filter(ing => ing.tempId !== tempId))
    calcularCustoEstimado()
  }

  const adicionarNovoPasso = () => {
    if (!novoPasso.descricao) {
      return
    }

    const tempId = `temp_${Date.now()}`
    const proximoPasso = preparo.length + 1
    setPreparo(prev => [...prev, { ...novoPasso, tempId, passo: proximoPasso }])
    setNovoPasso({
      tempId: '',
      passo: proximoPasso + 1,
      descricao: '',
      tempo_estimado: undefined,
      temperatura: undefined,
      observacoes: '',
    })
  }

  const removerPasso = (tempId: string) => {
    setPreparo(prev => {
      const filtrado = prev.filter(p => p.tempId !== tempId)
      return filtrado.map((passo, index) => ({ ...passo, passo: index + 1 }))
    })
    setNovoPasso(prev => ({ ...prev, passo: preparo.length }))
  }

  const reordenarPasso = (tempId: string, direcao: 'up' | 'down') => {
    const index = preparo.findIndex(p => p.tempId === tempId)
    if (index === -1) return

    const novoIndex = direcao === 'up' ? index - 1 : index + 1
    if (novoIndex < 0 || novoIndex >= preparo.length) return

    const novosPreparo = [...preparo]
    const [passoMovido] = novosPreparo.splice(index, 1)
    novosPreparo.splice(novoIndex, 0, passoMovido)

    const reordenados = novosPreparo.map((passo, idx) => ({ ...passo, passo: idx + 1 }))
    setPreparo(reordenados)
  }

  const alternarPraca = (pracaId: string) => {
    setPracasSelecionadas(prev => 
      prev.includes(pracaId) 
        ? prev.filter(id => id !== pracaId)
        : [...prev, pracaId]
    )
  }

  // Gerar opções do combobox para produtos
  const produtoOptions: ComboboxOption[] = produtos.map(produto => ({
    value: produto.id,
    label: produto.descricao,
    search: `${produto.descricao} ${produto.grupo} ${produto.subgrupo} ${produto.produto_id}`.toLowerCase()
  }))

  const salvarFichaTecnica = async () => {
    if (!validarEtapa(currentStep)) return

    setLoading(true)
    try {
      // 1. Criar ficha técnica
      const resultadoFicha = await criarFichaTecnica(fichaTecnica)
      if (!resultadoFicha.success) {
        setErrors({ submit: resultadoFicha.error || 'Erro ao criar ficha técnica' })
        return
      }

      const fichaId = resultadoFicha.data!.id

      // 2. Adicionar ingredientes
      for (const ingrediente of ingredientes) {
        const ingredienteData: FichaTecnicaIngredienteInsert = {
          ficha_tecnica_id: fichaId,
          produto_id: ingrediente.produto_id,
          quantidade: ingrediente.quantidade,
          unidade: ingrediente.unidade,
          fator_correcao: ingrediente.fator_correcao,
          opcional: ingrediente.opcional,
          observacoes: ingrediente.observacoes,
        }
        
        const resultado = await adicionarIngrediente(ingredienteData)
        if (!resultado.success) {
          console.error('Erro ao adicionar ingrediente:', resultado.error)
        }
      }

      // 3. Adicionar passos de preparo
      for (const passo of preparo) {
        const passoData: FichaTecnicaPreparoInsert = {
          ficha_tecnica_id: fichaId,
          passo: passo.passo,
          descricao: passo.descricao,
          tempo_estimado: passo.tempo_estimado,
          temperatura: passo.temperatura,
          observacoes: passo.observacoes,
        }
        
        const resultado = await adicionarPassoPreparo(passoData)
        if (!resultado.success) {
          console.error('Erro ao adicionar passo:', resultado.error)
        }
      }

      // 4. Vincular praças
      for (const pracaId of pracasSelecionadas) {
        const vinculoData: FichaTecnicaPracaInsert = {
          ficha_tecnica_id: fichaId,
          praca_destino_id: pracaId,
          ativo: true,
        }
        
        const resultado = await vincularPraca(vinculoData)
        if (!resultado.success) {
          console.error('Erro ao vincular praça:', resultado.error)
        }
      }

      router.push('/fichastecnicas')
    } catch (error) {
      console.error('Erro ao salvar ficha técnica:', error)
      setErrors({ submit: 'Erro inesperado ao salvar ficha técnica' })
    } finally {
      setLoading(false)
    }
  }

  const renderEtapa1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          Informações Básicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome da Ficha Técnica *
            </label>
            <Input
              value={fichaTecnica.nome}
              onChange={(e) => setFichaTecnica(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Lasanha Bolonhesa"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categoria *</label>
            <select
              value={fichaTecnica.categoria}
              onChange={(e) => setFichaTecnica(prev => ({ ...prev, categoria: e.target.value as CategoriaFicha }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="prato">Prato</option>
              <option value="bebida">Bebida</option>
              <option value="sobremesa">Sobremesa</option>
              <option value="entrada">Entrada</option>
              <option value="entrada">Acompanhamento</option>
              <option value="entrada">Produção</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Tempo de Preparo (min)
            </label>
            <Input
              type="number"
              value={fichaTecnica.tempo_preparo || ''}
              onChange={(e) => setFichaTecnica(prev => ({ 
                ...prev, 
                tempo_preparo: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1">
              <Users className="h-4 w-4" />
              Rendimento (porções)
            </label>
            <Input
              type="number"
              value={fichaTecnica.rendimento || ''}
              onChange={(e) => setFichaTecnica(prev => ({ 
                ...prev, 
                rendimento: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dificuldade</label>
            <select
              value={fichaTecnica.dificuldade || ''}
              onChange={(e) => setFichaTecnica(prev => ({ 
                ...prev, 
                dificuldade: e.target.value ? e.target.value as DificuldadeFicha : undefined 
              }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecione...</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Custo Estimado (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              value={fichaTecnica.custo_estimado || ''}
              onChange={(e) => setFichaTecnica(prev => ({ 
                ...prev, 
                custo_estimado: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
              placeholder="Será calculado automaticamente"
              disabled={ingredientes.length > 0}
            />
            {ingredientes.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Custo será calculado baseado nos ingredientes
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Descrição</label>
          <Textarea
            value={fichaTecnica.descricao}
            onChange={(e) => setFichaTecnica(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Descrição detalhada da ficha técnica..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Observações</label>
          <Textarea
            value={fichaTecnica.observacoes}
            onChange={(e) => setFichaTecnica(prev => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Observações adicionais, dicas, variações..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderEtapa2 = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Ingredientes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de ingredientes adicionados */}
          {ingredientes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Ingredientes Adicionados:</h4>
              {ingredientes.map((ingrediente) => {
                const produto = produtos.find(p => p.id === ingrediente.produto_id)
                return (
                  <div key={ingrediente.tempId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{produto?.descricao}</span>
                        {ingrediente.opcional && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Opcional
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {ingrediente.quantidade} {ingrediente.unidade}
                        {ingrediente.fator_correcao !== 1 && (
                          <span className="text-orange-600 ml-2">
                            (Fator: {ingrediente.fator_correcao}x = {(ingrediente.quantidade * ingrediente.fator_correcao).toFixed(3)} {ingrediente.unidade})
                          </span>
                        )}
                      </div>
                      {ingrediente.observacoes && (
                        <div className="text-xs text-gray-500 italic mt-1">
                          {ingrediente.observacoes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removerIngrediente(ingrediente.tempId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Formulário para novo ingrediente */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Adicionar Novo Ingrediente:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Produto *</label>
                <SimpleCombobox
                  options={produtoOptions}
                  value={novoIngrediente.produto_id}
                  onValueChange={(value) => setNovoIngrediente(prev => ({ ...prev, produto_id: value }))}
                  placeholder="Buscar produto..."
                  emptyText="Nenhum produto encontrado"
                  searchPlaceholder="Digite para buscar..."
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantidade *</label>
                <Input
                  type="number"
                  step="0.001"
                  value={novoIngrediente.quantidade || ''}
                  onChange={(e) => setNovoIngrediente(prev => ({ 
                    ...prev, 
                    quantidade: e.target.value ? parseFloat(e.target.value) : 0 
                  }))}
                  placeholder="1.5"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unidade *</label>
                <Input
                  value={novoIngrediente.unidade}
                  onChange={(e) => setNovoIngrediente(prev => ({ ...prev, unidade: e.target.value }))}
                  placeholder="kg, L, unid..."
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fator de Correção</label>
                <Input
                  type="number"
                  step="0.1"
                  value={novoIngrediente.fator_correcao}
                  onChange={(e) => setNovoIngrediente(prev => ({ 
                    ...prev, 
                    fator_correcao: e.target.value ? parseFloat(e.target.value) : 1.0 
                  }))}
                  placeholder="1.0"
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para perdas/desperdícios (ex: 1.2 = +20%)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="opcional"
                  checked={novoIngrediente.opcional}
                  onChange={(e) => setNovoIngrediente(prev => ({ ...prev, opcional: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="opcional" className="text-sm font-medium">
                  Ingrediente Opcional
                </label>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <Input
                value={novoIngrediente.observacoes}
                onChange={(e) => setNovoIngrediente(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o ingrediente..."
                className="text-sm"
              />
            </div>

            <div className="mt-4">
              <Button
                type="button"
                onClick={adicionarNovoIngrediente}
                disabled={!novoIngrediente.produto_id || !novoIngrediente.quantidade || !novoIngrediente.unidade}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ingrediente
              </Button>
            </div>
          </div>

          {errors.ingredientes && (
            <p className="text-red-500 text-sm">{errors.ingredientes}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderEtapa3 = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Modo de Preparo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de passos adicionados */}
          {preparo.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Passos de Preparo:</h4>
              {preparo.map((passo, index) => (
                <div key={passo.tempId} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {passo.passo}
                    </div>
                    <div className="flex flex-col gap-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => reordenarPasso(passo.tempId, 'up')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <GripVertical className="h-3 w-3" />
                        </button>
                      )}
                      {index < preparo.length - 1 && (
                        <button
                          type="button"
                          onClick={() => reordenarPasso(passo.tempId, 'down')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <GripVertical className="h-3 w-3" />
                        </button>
                      )}
                    </div>
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removerPasso(passo.tempId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário para novo passo */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Adicionar Novo Passo:</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Passo {novoPasso.passo} - Descrição *
                </label>
                <Textarea
                  value={novoPasso.descricao}
                  onChange={(e) => setNovoPasso(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva detalhadamente este passo do preparo..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tempo Estimado (min)</label>
                  <Input
                    type="number"
                    value={novoPasso.tempo_estimado || ''}
                    onChange={(e) => setNovoPasso(prev => ({ 
                      ...prev, 
                      tempo_estimado: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Temperatura (°C)</label>
                  <Input
                    type="number"
                    value={novoPasso.temperatura || ''}
                    onChange={(e) => setNovoPasso(prev => ({ 
                      ...prev, 
                      temperatura: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="180"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <Input
                  value={novoPasso.observacoes}
                  onChange={(e) => setNovoPasso(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Dicas adicionais para este passo..."
                />
              </div>

              <Button
                type="button"
                onClick={adicionarNovoPasso}
                disabled={!novoPasso.descricao}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Passo
              </Button>
            </div>
          </div>

          {errors.preparo && (
            <p className="text-red-500 text-sm">{errors.preparo}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderEtapa4 = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Praças e Finalização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de praças */}
          <div>
            <h4 className="font-medium mb-3">Selecione as praças onde esta ficha técnica estará disponível:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pracas.map(praca => (
                <div
                  key={praca.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    pracasSelecionadas.includes(praca.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => alternarPraca(praca.id)}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={pracasSelecionadas.includes(praca.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="font-medium">{praca.nome}</div>
                      <div className="text-sm text-gray-500 capitalize">{praca.tipo}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pracasSelecionadas.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Nenhuma praça selecionada. A ficha técnica ficará disponível apenas na listagem geral.
              </p>
            )}
          </div>

          {/* Resumo */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Resumo da Ficha Técnica:</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div><strong>Nome:</strong> {fichaTecnica.nome}</div>
              <div><strong>Categoria:</strong> {fichaTecnica.categoria}</div>
              {fichaTecnica.tempo_preparo && (
                <div><strong>Tempo de Preparo:</strong> {fichaTecnica.tempo_preparo} min</div>
              )}
              {fichaTecnica.rendimento && (
                <div><strong>Rendimento:</strong> {fichaTecnica.rendimento} porções</div>
              )}
              {fichaTecnica.dificuldade && (
                <div><strong>Dificuldade:</strong> {fichaTecnica.dificuldade}</div>
              )}
              {fichaTecnica.custo_estimado && (
                <div><strong>Custo Estimado:</strong> R$ {fichaTecnica.custo_estimado.toFixed(2)}</div>
              )}
              <div><strong>Ingredientes:</strong> {ingredientes.length}</div>
              <div><strong>Passos de Preparo:</strong> {preparo.length}</div>
              <div><strong>Praças Selecionadas:</strong> {pracasSelecionadas.length}</div>
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/fichastecnicas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Nova Ficha Técnica</h1>
        </div>

        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        <div className="min-h-[500px]">
          {currentStep === 1 && renderEtapa1()}
          {currentStep === 2 && renderEtapa2()}
          {currentStep === 3 && renderEtapa3()}
          {currentStep === 4 && renderEtapa4()}
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={etapaAnterior}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentStep < steps.length ? (
              <Button onClick={proximaEtapa}>
                Próxima
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={salvarFichaTecnica}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Salvando...' : 'Criar Ficha Técnica'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}