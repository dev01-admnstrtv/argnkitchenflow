import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Solicitação de Mercadorias
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/">Início</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Dashboard do Sistema
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Solicitações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Gerencie todas as solicitações de mercadorias
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/solicitacoes/nova">Nova Solicitação</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/solicitacoes">Ver Solicitações</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📦 Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Catálogo completo de produtos
                </p>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/produtos">Ver Produtos</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/agrupamentos">Agrupamentos</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏢 Praças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Locais de destino das mercadorias
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/pracas">Ver Praças</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Relatórios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Análises e métricas do sistema
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/relatorios">Ver Relatórios</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚛 Separação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Controle de separação de itens
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/separacao">Separação</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🚚 Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Gerenciamento de entregas
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/entrega">Entregas</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Inventários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Controle de inventário e contagem de estoque
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/inventarios/novo">Novo Inventário</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/inventarios">Ver Inventários</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}