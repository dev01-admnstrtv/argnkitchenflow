'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { buscarAgrupamentoPorId, atualizarAgrupamento } from '@/lib/actions/produtos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Agrupamento } from '@/types'

interface EditarAgrupamentoPageProps {
  params: { id: string }
}

export default function EditarAgrupamentoPage({ params }: EditarAgrupamentoPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agrupamento, setAgrupamento] = useState<Agrupamento | null>(null)
  
  const [formData, setFormData] = useState({
    cod_agrupamento: '',
    grupo: '',
    subgrupo: '',
    descricao: '',
    tipo: 'insumo' as 'insumo' | 'produzido' | 'produto',
    ativo: true,
  })

  useEffect(() => {
    const carregarAgrupamento = async () => {
      try {
        const resultado = await buscarAgrupamentoPorId(params.id)
        if (resultado.success && resultado.data) {
          setAgrupamento(resultado.data)
          setFormData({
            cod_agrupamento: resultado.data.cod_agrupamento,
            grupo: resultado.data.grupo,
            subgrupo: resultado.data.subgrupo,
            descricao: resultado.data.descricao || '',
            tipo: resultado.data.tipo,
            ativo: resultado.data.ativo,
          })
        } else {
          setErrors({ load: 'Agrupamento não encontrado' })
        }
      } catch (error) {
        console.error('Erro ao carregar agrupamento:', error)
        setErrors({ load: 'Erro ao carregar agrupamento' })
      } finally {
        setLoading(false)
      }
    }

    carregarAgrupamento()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('cod_agrupamento', formData.cod_agrupamento)
      formDataToSend.append('grupo', formData.grupo)
      formDataToSend.append('subgrupo', formData.subgrupo)
      formDataToSend.append('descricao', formData.descricao)
      formDataToSend.append('tipo', formData.tipo)
      formDataToSend.append('ativo', formData.ativo.toString())

      const resultado = await atualizarAgrupamento(params.id, formDataToSend)
      
      if (resultado.success) {
        router.push('/agrupamentos')
      } else {
        setErrors({ submit: resultado.error || 'Erro ao atualizar agrupamento' })
      }
    } catch (error) {
      console.error('Erro ao atualizar agrupamento:', error)
      setErrors({ submit: 'Erro inesperado ao atualizar agrupamento' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (errors.load) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Erro</h1>
          <p className="text-gray-600 mb-6">{errors.load}</p>
          <Button asChild>
            <Link href="/agrupamentos">Voltar para Agrupamentos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/agrupamentos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Agrupamento</h1>
            <p className="text-gray-600">{agrupamento?.grupo} › {agrupamento?.subgrupo}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Agrupamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Código do Agrupamento *
                </label>
                <Input
                  value={formData.cod_agrupamento}
                  onChange={(e) => handleInputChange('cod_agrupamento', e.target.value)}
                  placeholder="Ex: AG001, AGC001, AGI001"
                  required
                />
                {errors.cod_agrupamento && (
                  <p className="text-red-600 text-sm mt-1">{errors.cod_agrupamento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="insumo">Insumo</option>
                  <option value="produzido">Produzido</option>
                  <option value="produto">Produto</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Grupo *
                  </label>
                  <Input
                    value={formData.grupo}
                    onChange={(e) => handleInputChange('grupo', e.target.value)}
                    placeholder="Ex: Cereais, Carnes, Bebidas"
                    required
                  />
                  {errors.grupo && (
                    <p className="text-red-600 text-sm mt-1">{errors.grupo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subgrupo *
                  </label>
                  <Input
                    value={formData.subgrupo}
                    onChange={(e) => handleInputChange('subgrupo', e.target.value)}
                    placeholder="Ex: Arroz, Frango, Refrigerantes"
                    required
                  />
                  {errors.subgrupo && (
                    <p className="text-red-600 text-sm mt-1">{errors.subgrupo}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição adicional do agrupamento..."
                  rows={3}
                />
                {errors.descricao && (
                  <p className="text-red-600 text-sm mt-1">{errors.descricao}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Ativo</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Agrupamentos inativos não aparecerão nas opções de seleção
                </p>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/agrupamentos">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}