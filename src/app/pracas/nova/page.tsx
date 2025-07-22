'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarPraca } from '@/lib/actions/pracas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovaPracaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    responsavel: '',
    tipo: 'geral' as 'cozinha' | 'salao' | 'bar' | 'estoque' | 'limpeza' | 'escritorio' | 'geral',
    capacidade_maxima: '',
    limite_produtos: '',
    ativo: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('nome', formData.nome)
      formDataToSend.append('descricao', formData.descricao)
      formDataToSend.append('responsavel', formData.responsavel)
      formDataToSend.append('tipo', formData.tipo)
      formDataToSend.append('capacidade_maxima', formData.capacidade_maxima)
      formDataToSend.append('limite_produtos', formData.limite_produtos)
      formDataToSend.append('ativo', formData.ativo.toString())

      const resultado = await criarPraca(formDataToSend)
      
      if (resultado.success) {
        router.push('/pracas')
      } else {
        setErrors({ submit: resultado.error || 'Erro ao criar praça' })
      }
    } catch (error) {
      console.error('Erro ao criar praça:', error)
      setErrors({ submit: 'Erro inesperado ao criar praça' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/pracas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Nova Praça</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações da Praça</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nome da Praça *
                  </label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: Cozinha Principal"
                    required
                  />
                  {errors.nome && (
                    <p className="text-red-600 text-sm mt-1">{errors.nome}</p>
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
                    <option value="geral">Geral</option>
                    <option value="cozinha">Cozinha</option>
                    <option value="salao">Salão</option>
                    <option value="bar">Bar</option>
                    <option value="estoque">Estoque</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="escritorio">Escritório</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Descrição da praça..."
                />
                {errors.descricao && (
                  <p className="text-red-600 text-sm mt-1">{errors.descricao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Responsável
                </label>
                <Input
                  value={formData.responsavel}
                  onChange={(e) => handleInputChange('responsavel', e.target.value)}
                  placeholder="Nome do responsável pela praça"
                />
                {errors.responsavel && (
                  <p className="text-red-600 text-sm mt-1">{errors.responsavel}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Capacidade Máxima
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacidade_maxima}
                    onChange={(e) => handleInputChange('capacidade_maxima', e.target.value)}
                    placeholder="Ex: 100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Capacidade física da praça (opcional)
                  </p>
                  {errors.capacidade_maxima && (
                    <p className="text-red-600 text-sm mt-1">{errors.capacidade_maxima}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Limite de Produtos
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.limite_produtos}
                    onChange={(e) => handleInputChange('limite_produtos', e.target.value)}
                    placeholder="Ex: 50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Limite de produtos por solicitação (opcional)
                  </p>
                  {errors.limite_produtos && (
                    <p className="text-red-600 text-sm mt-1">{errors.limite_produtos}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="text-sm font-medium">
                  Praça ativa
                </label>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/pracas">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Praça'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}