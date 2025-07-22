'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Package, 
  MapPin, 
  BarChart3, 
  Truck, 
  ClipboardList,
  Sparkles,
  ChefHat
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getDailySolicitacoesStats } from '@/lib/actions/solicitacoes'
import { getTotalProdutos, getTotalPracas, getTotalInventarios, getTotalFichasTecnicas } from '@/lib/actions/dashboard'
import { buscarEstatisticasSeparacao } from '@/lib/actions/separacao'

const modules = [
  {
    id: 'solicitacoes',
    title: 'Solicitações',
    description: 'Gerencie todas as solicitações de mercadorias com eficiência',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    actions: [
      { label: 'Nova Solicitação', href: '/solicitacoes/nova', primary: true },
      { label: 'Ver Solicitações', href: '/solicitacoes' }
    ],
    stats: '0 ativas',
    trend: '0%'
  },
  {
    id: 'produtos',
    title: 'Produtos',
    description: 'Catálogo completo e organizado de produtos',
    icon: Package,
    color: 'from-emerald-500 to-teal-500',
    actions: [
      { label: 'Ver Produtos', href: '/produtos' },
      { label: 'Agrupamentos', href: '/agrupamentos' }
    ],
    stats: '0 itens',
    trend: ''
  },
  {
    id: 'pracas',
    title: 'Praças',
    description: 'Locais de destino das mercadorias',
    icon: MapPin,
    color: 'from-purple-500 to-pink-500',
    actions: [
      { label: 'Ver Praças', href: '/pracas' }
    ],
    stats: '0 locais',
    trend: ''
  },
  {
    id: 'separacao',
    title: 'Separação',
    description: 'Controle inteligente de separação de itens',
    icon: Truck,
    color: 'from-orange-500 to-red-500',
    actions: [
      { label: 'Separação', href: '/separacao' }
    ],
    stats: '0 pendentes',
    trend: '0%'
  },
  
  {
    id: 'inventarios',
    title: 'Inventários',
    description: 'Controle de inventário e contagem de estoque',
    icon: ClipboardList,
    color: 'from-rose-500 to-pink-500',
    actions: [
      { label: 'Novo Inventário', href: '/inventarios/novo', primary: true },
      { label: 'Ver Inventários', href: '/inventarios' }
    ],
    stats: '0 agendados',
    trend: ''
  },
  {
    id: 'fichastecnicas',
    title: 'Fichas Técnicas',
    description: 'Gestão completa de receitas e fichas técnicas',
    icon: ChefHat,
    color: 'from-amber-500 to-orange-500',
    actions: [
      { label: 'Nova Ficha', href: '/fichastecnicas/nova', primary: true },
      { label: 'Ver Fichas', href: '/fichastecnicas' }
    ],
    stats: '0 fichas',
    trend: ''
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    description: 'Análises e métricas avançadas do sistema',
    icon: BarChart3,
    color: 'from-violet-500 to-purple-500',
    actions: [
      { label: 'Ver Relatórios', href: '/relatorios' }
    ],
    stats: '0 insights',
    trend: ''
  }
]

export default function DashboardPage() {
  const [solicitacoesStats, setSolicitacoesStats] = useState({ today: 0, variation: 0 })
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [totalPracas, setTotalPracas] = useState(0)
  const [separacaoStats, setSeparacaoStats] = useState({ solicitacoesPendentes: 0, percentualConclusao: 0 })
  const [totalInventarios, setTotalInventarios] = useState(0)
  const [totalFichasTecnicas, setTotalFichasTecnicas] = useState(0)

  useEffect(() => {
    async function fetchData() {
      // Solicitações
      const solicitacoesRes = await getDailySolicitacoesStats()
      if (solicitacoesRes.success && solicitacoesRes.data) {
        setSolicitacoesStats(solicitacoesRes.data)
      }

      // Produtos
      const produtosRes = await getTotalProdutos()
      if (produtosRes.success) {
        setTotalProdutos(produtosRes.data)
      }

      // Praças
      const pracasRes = await getTotalPracas()
      if (pracasRes.success) {
        setTotalPracas(pracasRes.data)
      }

      // Separação
      const separacaoRes = await buscarEstatisticasSeparacao()
      if (separacaoRes.success) {
        setSeparacaoStats(separacaoRes.data)
      }

      // Inventários
      const inventariosRes = await getTotalInventarios()
      if (inventariosRes.success) {
        setTotalInventarios(inventariosRes.data)
      }

      // Fichas Técnicas
      const fichasRes = await getTotalFichasTecnicas()
      if (fichasRes.success) {
        setTotalFichasTecnicas(fichasRes.data)
      }
    }

    fetchData()
  }, [])

  const updatedModules = modules.map(module => {
    switch (module.id) {
      case 'solicitacoes':
        return {
          ...module,
          stats: `${solicitacoesStats.today} hoje`,
          trend: `${solicitacoesStats.variation >= 0 ? '+' : ''}${solicitacoesStats.variation}%`
        }
      case 'produtos':
        return {
          ...module,
          stats: `${totalProdutos} itens`,
          trend: ''
        }
      case 'pracas':
        return {
          ...module,
          stats: `${totalPracas} locais`,
          trend: ''
        }
      case 'separacao':
        return {
          ...module,
          stats: `${separacaoStats.solicitacoesPendentes} pendentes`,
          trend: `${separacaoStats.percentualConclusao}%`
        }
      case 'inventarios':
        return {
          ...module,
          stats: `${totalInventarios} agendados`,
          trend: ''
        }
      case 'fichastecnicas':
        return {
          ...module,
          stats: `${totalFichasTecnicas} fichas`,
          trend: ''
        }
      default:
        return module
    }
  })

  return (
    <div className="min-h-screen">
      {/* Modern Header */}
      <header className="relative backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src="https://www.administrative.com.br/aragon/aragon.png"
                  alt="Aragon Logo"
                  width={48}
                  height={48}
                  className="rounded-xl shadow-lg ring-2 ring-white/50"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Aragon Kitchen Flow
                </h1>
                <p className="text-sm text-gray-500 font-medium">Sistema de Gestão Inteligente</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
             
              <Button variant="outline" asChild className="hover-lift glass-card">
                <Link href="/">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Início
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 animate-fade-in">
           
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
              Dashboard do Sistema
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Gerencie de fluxo de produto do Restaurante
            </p>
            
            {/* Quick Stats 
            <div className="flex justify-center items-center space-x-8 mt-8">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">98.5%</span>
                </div>
                <p className="text-sm text-gray-500">Eficiência</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">2.4s</span>
                </div>
                <p className="text-sm text-gray-500">Tempo Médio</p>
              }
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">24/7</span>
                </div>
                <p className="text-sm text-gray-500">Disponibilidade</p>
              </div>
            </div>*/}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {updatedModules.map((module, index) => {
            const IconComponent = module.icon
            return (
              <Card 
                key={module.id} 
                className="group hover-lift glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-500 animate-scale-in overflow-hidden"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} shadow-lg`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {module.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {module.stats}
                          </Badge>
                          {module.trend && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                module.trend.includes('+') ? 'text-green-600 border-green-200 bg-green-50' :
                                module.trend.includes('-') ? 'text-red-600 border-red-200 bg-red-50' :
                                'text-blue-600 border-blue-200 bg-blue-50'
                              }`}
                            >
                              {module.trend}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    {module.description}
                  </p>
                  
                  <div className="space-y-2">
                    {module.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        asChild
                        variant={action.primary ? "default" : "outline"}
                        className={`w-full transition-all duration-300 ${
                          action.primary 
                            ? `bg-gradient-to-r ${module.color} text-white hover:shadow-lg border-0` 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Link href={action.href}>
                          {action.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}