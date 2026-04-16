# Gerenciador de Estoque - Frontend

Sistema moderno para gerenciamento de estoque e controle de ativos (Computadores e Headsets), desenvolvido com React 19, TypeScript e Vite.

## 🚀 Funcionalidades

- **Dashboard**: Visualização de dados e métricas através de gráficos interativos (Recharts).
- **Gerenciamento de Ativos**:
  - **Computadores**: Controle detalhado de hardware, atribuição e status.
  - **Headsets**: Monitoramento de periféricos e distribuição.
- **Controle de Inventário**: Gestão centralizada de produtos e categorias.
- **Gestão de Usuários**: Controle de acesso, permissões e perfis.
- **Autenticação**: Sistema seguro de login com proteção de rotas.
- **Perfil do Usuário**: Personalização e visualização de informações do colaborador.
- **Exportação**: Suporte para exportação de relatórios em Excel (.xlsx).
- **Interface Responsiva**: Design moderno e adaptável com suporte a Temas (Light/Dark).

## 🛠️ Tecnologias Utilizadas

### Core
- **React 19**: Biblioteca principal para construção da interface.
- **TypeScript**: Tipagem estática para maior segurança e produtividade.
- **Vite**: Build tool extremamente rápida para desenvolvimento moderno.

### Estado e Dados
- **TanStack Query (React Query)**: Gerenciamento de estado assíncrono e cache de dados.
- **Axios**: Cliente HTTP para consumo da API.
- **React Hook Form**: Manipulação de formulários performática.
- **Zod**: Validação de esquemas e tipos em tempo de execução.

### Estilização e UI
- **Tailwind CSS**: Framework CSS utilitário para design rápido e consistente.
- **Lucide React**: Conjunto de ícones leves e elegantes.
- **Sonner**: Sistema de notificações (toasts) moderno.
- **Recharts**: Biblioteca de gráficos para visualização de dados.

## 📦 Estrutura do Projeto

```text
src/
├── assets/         # Recursos estáticos (imagens, svgs)
├── components/     # Componentes reutilizáveis (UI e Layout)
├── contexts/       # Contextos da aplicação (Auth, Theme)
├── hooks/          # Hooks customizados para lógica e fetch de dados
├── lib/            # Configurações de bibliotecas externas (API)
├── pages/          # Páginas/Telas principais da aplicação
├── schemas/        # Esquemas de validação Zod
├── services/       # Chamadas de API e serviços de negócio
├── types/          # Definições de tipos TypeScript
└── utils/          # Funções utilitárias
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js (versão 18 ou superior)
- NPM ou Yarn

### Instalação

1. Clone o repositório:
   ```bash
   git clone [url-do-repositorio]
   cd gerenciador-de-estoque-frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   VITE_API_URL=http://localhost:3333
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🚀 Build e Deploy

Para gerar a versão de produção:
```bash
npm run build
```
Os arquivos serão gerados na pasta `dist/`.

---
Desenvolvido com uma coquinha e muito código por Lucas Joakinson.
