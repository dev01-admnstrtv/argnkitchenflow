# Sistema de Solicitação de Mercadorias - Restaurante Aragon

Sistema web mobile-first para gerenciar solicitações de mercadorias e insumos dos setores/praças do restaurante para o estoque central.

## 🚀 Funcionalidades

### Core Features
- **Sistema de Solicitação**: Registrar solicitações de mercadorias com produtos, quantidades, observações e prioridade
- **Gestão de Fluxo**: Controle completo do fluxo Solicitação → Separação → Entrega → Confirmação
- **Status Granular**: Rastreamento individual de cada item (Solicitado, Rejeitado, Separando, Separado, Em Trânsito, Entregue, Confirmado, Em Falta)
- **Janelas de Entrega**: Entregas em duas janelas fixas (manhã e tarde) com agendamento automático
- **Dashboard Multi-Perfil**: Interfaces específicas para cada tipo de usuário

### Perfis de Usuário
- **Solicitante**: Criar e acompanhar solicitações
- **Conferente**: Separar mercadorias e gerenciar estoque
- **Entregador**: Confirmar entregas e finalizar pedidos
- **Administrador**: Gestão completa do sistema

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, API)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Validação**: Zod schemas
- **Autenticação**: Supabase Auth com middleware Next.js

## 🏗️ Estrutura do Projeto

```
/src
  /app                  # Páginas Next.js (App Router)
    /login             # Autenticação
    /dashboard         # Dashboard principal
    /solicitacoes      # Gestão de solicitações
    /admin             # Painel administrativo
  /components
    /ui                # Componentes base (shadcn/ui)
    /forms             # Formulários específicos
    /dashboard         # Componentes de dashboard
  /lib
    /actions           # Server Actions
    /utils             # Utilitários
    /validations       # Schemas Zod
  /types               # Tipos TypeScript
  /hooks               # Hooks personalizados
/supabase
  /migrations          # Migrações SQL
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- `usuarios` - Dados dos usuários e perfis
- `solicitacoes` - Solicitações de mercadorias
- `itens_solicitacao` - Itens individuais das solicitações
- `produtos` - Catálogo de produtos (tabela compartilhada)
- `pracas_destino` - Locais de entrega (tabela compartilhada)
- `movimento_estoque` - Histórico de movimentações (tabela compartilhada)

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- Conta no Supabase
- Git

### Configuração

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd sistema-solicitacao-mercadorias
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edite o arquivo `.env.local` com suas credenciais do Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Execute as migrações do banco**
   ```bash
   # Se usando Supabase CLI
   supabase db reset
   
   # Ou execute manualmente os arquivos SQL em /supabase/migrations/
   ```

5. **Execute o projeto**
   ```bash
   npm run dev
   ```

   O sistema estará disponível em `http://localhost:3000`

## 📱 Uso do Sistema

### Para Solicitantes
1. Faça login com suas credenciais
2. Acesse "Solicitações" → "Nova Solicitação"
3. Selecione a praça de destino
4. Adicione produtos e quantidades
5. Defina prioridade e observações
6. Envie a solicitação

### Para Conferentes
1. Acesse o dashboard de separação
2. Visualize a lista de itens para separar
3. Confirme quantidades separadas
4. Registre itens em falta com justificativa

### Para Entregadores
1. Acesse a lista de entregas
2. Confirme entregas por praça
3. Registre horário de entrega
4. Finalize pedidos

### Para Administradores
1. Acesse o painel administrativo
2. Gerencie usuários e permissões
3. Configure produtos e praças
4. Visualize relatórios e métricas

## 🔧 Comandos Úteis

```bash
# Verificação de tipos
npm run type-check

# Linting
npm run lint

# Formatação
npm run format

# Build para produção
npm run build

# Gerar tipos do Supabase
npm run db:types
```

## 📊 Fluxo de Trabalho

1. **Solicitação**: Usuário cria solicitação com itens desejados
2. **Separação**: Conferente separa produtos no estoque
3. **Entrega**: Entregador confirma entrega na praça
4. **Confirmação**: Recebedor confirma recebimento

## 🔒 Segurança

- Autenticação via Supabase Auth
- Middleware de proteção de rotas
- Validação de dados com Zod
- Verificação de permissões por perfil
- Logs de auditoria

## 🎯 Próximos Passos

- [ ] Notificações em tempo real
- [ ] Relatórios avançados
- [ ] Integração com sistema de estoque
- [ ] Aplicativo mobile nativo
- [ ] Modo offline

## 📝 Licença

Este projeto é propriedade do Restaurante Aragon e destinado ao uso interno.

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de TI do restaurante.