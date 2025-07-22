import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Sistema de Solicitação de Mercadorias
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Restaurante Aragon - Gestão de Estoque
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Crie e gerencie solicitações de mercadorias
            </p>
            <Button asChild className="w-full">
              <Link href="/solicitacoes">
                Ver Solicitações
              </Link>
            </Button>
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
              Catálogo de produtos disponíveis
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/produtos">
                Ver Produtos
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏢 Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Painel de controle e relatórios
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                Acessar Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Sistema desenvolvido para controle interno de estoque
        </p>
      </div>
    </div>
  );
}