'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { buscarInventarioPorId, atualizarInventario, buscarPracas } from '@/lib/actions/inventarios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Calendar, MapPin, User, FileText } from 'lucide-react'
import Link from 'next/link'
import { InventarioData } from '@/lib/actions/inventarios'

interface Praca {
  id: string
  nome: string
}

export default function EditarInventarioPage() {
  const params = useParams()
  const router = useRouter()
  const inventarioId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inventario, setInventario] = useState<InventarioData | null>(null)
  const [pracas, setPracas] = useState<Praca[]>([])
  const [formData, setFormData] = useState({
    praca_id: '',
    data_contagem: '',
    responsavel: '',
    observacoes: ''
  })

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      try {
        const [inventarioResult, pracasResult] = await Promise.all([
          buscarInventarioPorId(inventarioId),
          buscarPracas()
        ])

        if (inventarioResult.success) {
          const inv = inventarioResult.data
          setInventario(inv)
          setFormData({
            praca_id: inv.praca_id,
            data_contagem: inv.data_contagem,
            responsavel: inv.responsavel,
            observacoes: inv.observacoes || ''
          })
        }

        if (pracasResult.success && pracasResult.data) {
          setPracas(pracasResult.data)
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [inventarioId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('praca_id', formData.praca_id)
      formDataObj.append('data_contagem', formData.data_contagem)
      formDataObj.append('responsavel', formData.responsavel)
      formDataObj.append('observacoes', formData.observacoes)

      const resultado = await atualizarInventario(inventarioId, formDataObj)
      
      if (resultado.success) {
        router.push(`/inventarios/${inventarioId}`)
      } else {
        alert('Erro ao atualizar inventário: ' + resultado.error)
      }
    } catch (error) {
      console.error('Erro ao atualizar inventário:', error)
      alert('Erro ao atualizar inventário')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading || !inventario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Verificar se o inventário pode ser editado
  if (inventario.status === 'finalizado') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href={`/inventarios/${inventarioId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Inventário</h1>
            <p className="text-gray-600">{inventario.numero_inventario}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inventário Finalizado
              </h3>
              <p className="text-gray-500 mb-4">
                Este inventário já foi finalizado e não pode mais ser editado.
              </p>
              <Button asChild>
                <Link href={`/inventarios/${inventarioId}`}>
                  Visualizar Inventário
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href={`/inventarios/${inventarioId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Inventário</h1>
          <p className="text-gray-600">{inventario.numero_inventario}</p>
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
                disabled={saving}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="flex-1"
              >
                <Link href={`/inventarios/${inventarioId}`}>
                  Cancelar
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}