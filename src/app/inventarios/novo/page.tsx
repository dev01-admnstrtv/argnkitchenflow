'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { criarInventario, buscarPracas } from '@/lib/actions/inventarios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Calendar, MapPin, User, FileText } from 'lucide-react'
import Link from 'next/link'

interface Praca {
  id: string
  nome: string
}

export default function NovoInventarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pracas, setPracas] = useState<Praca[]>([])
  const [formData, setFormData] = useState({
    praca_id: '',
    data_contagem: new Date().toISOString().split('T')[0],
    responsavel: '',
    observacoes: ''
  })

  useEffect(() => {
    const carregarPracas = async () => {
      const resultado = await buscarPracas()
      if (resultado.success && resultado.data) {
        setPracas(resultado.data)
      }
    }
    carregarPracas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('praca_id', formData.praca_id)
      formDataObj.append('data_contagem', formData.data_contagem)
      formDataObj.append('responsavel', formData.responsavel)
      formDataObj.append('observacoes', formData.observacoes)

      const resultado = await criarInventario(formDataObj)
      
      if (resultado.success) {
        router.push(`/inventarios/${resultado.data.id}`)
      } else {
        alert('Erro ao criar inventário: ' + resultado.error)
      }
    } catch (error) {
      console.error('Erro ao criar inventário:', error)
      alert('Erro ao criar inventário')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href="/inventarios">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Inventário</h1>
          <p className="text-gray-600">Criar um novo inventário de contagem</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informações do Inventário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Praça *
                </label>
                <select
                  value={formData.praca_id}
                  onChange={(e) => handleChange('praca_id', e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma praça</option>
                  {pracas.map(praca => (
                    <option key={praca.id} value={praca.id}>
                      {praca.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Data da Contagem *
                </label>
                <Input
                  type="date"
                  value={formData.data_contagem}
                  onChange={(e) => handleChange('data_contagem', e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Responsável pela Contagem *
                </label>
                <Input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) => handleChange('responsavel', e.target.value)}
                  placeholder="Nome do responsável"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Observações sobre o inventário (opcional)"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Criando...' : 'Criar Inventário'}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="flex-1"
              >
                <Link href="/inventarios">
                  Cancelar
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Próximos passos:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Após criar o inventário, você poderá adicionar os itens contados</li>
          <li>• Cada item é salvo automaticamente no banco de dados</li>
          <li>• Você pode editar o inventário até finalizá-lo</li>
          <li>• Inventários finalizados não podem ser mais editados</li>
        </ul>
      </div>
    </div>
  )
}