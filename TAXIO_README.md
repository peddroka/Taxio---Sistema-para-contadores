# Taxio — Classificação Fiscal com IA

SaaS completo para classificação fiscal automatizada de produtos usando inteligência artificial.

## 🎯 Sobre o Projeto

Taxio é uma plataforma desenvolvida para contadores e escritórios de contabilidade que precisam classificar produtos fiscalmente (NCM, CEST, CST, cClassTrib). A solução utiliza IA para automatizar o processo, reduzindo erros e economizando tempo operacional.

## 🎨 Design System

### Cores Principais
- **Background App**: `#0F1A2E` (azul petróleo escuro)
- **Background Surface**: `#162035` (cards e painéis)
- **Background Elevated**: `#1E2D47` (hover states, inputs)
- **Accent Royal**: `#1A4ED8` (azul royal — cor primária)
- **Success**: `#10B981` (verde)
- **Warning**: `#F59E0B` (âmbar)
- **Danger**: `#EF4444` (vermelho)

### Tipografia
- **Fonte**: Nunito (Google Fonts)
- **Pesos**: 300, 400, 600, 700, 800
- **Escala**: xs (11px), sm (13px), base (15px), lg (18px), xl (24px), 2xl (32px)

## 📱 Páginas Implementadas

### 1. Dashboard
- Métricas principais (produtos classificados, acurácia, lotes, erros evitados)
- Últimas classificações
- Atividade do mês com barras de progresso

### 2. Consulta com IA
- Formulário com descrição do produto, ERP e UF
- Resultado da classificação com 4 campos: NCM, CEST, CST, cClassTrib
- Indicador de confiança da IA

### 3. Consulta em Lote
- Upload de CSV por drag-and-drop
- Barra de progresso em tempo real
- Histórico de lotes processados

### 4. Consulta Manual
- Formulário com validação inline para NCM, CEST, CST, cClassTrib
- Máscaras de formatação automática
- Feedback visual de validação

### 5. Histórico
- Tabela completa de classificações
- Filtros rápidos (Todos, Aprovados, Revisar, IA, Lote, Manual)
- Busca por produto ou NCM
- Paginação
- Versão responsiva com cards no mobile

### 6. Exportar CSV
- Seleção de ERP (TOTVS, SAP, Omie, Bling, Genérico)
- Filtros por período e status
- Histórico de exportações anteriores

### 7. Central de Ajuda
- Cards de suporte (WhatsApp, E-mail, Documentação, FAQ)
- Benefícios da plataforma
- Estatísticas rápidas

## 🎯 Responsividade

### Breakpoints
- **Mobile**: < 640px — sidebar vira bottom nav, layout single column
- **Tablet**: 640–1024px — sidebar recolhida (só ícones), grid 2 colunas
- **Notebook**: 1024–1280px — sidebar completa, grid adaptado
- **Desktop**: > 1280px — layout completo, grid 4 colunas

### Comportamentos
- **Mobile**: Bottom navigation bar fixa com 5 ícones, drawer para itens extras
- **Tablet+**: Sidebar lateral com navegação completa
- **Desktop**: Experiência otimizada com todos os recursos visíveis

## 🚀 Stack Técnica

- **Framework**: React 18 + TypeScript
- **Roteamento**: React Router v7 (Data mode)
- **Estilização**: Tailwind CSS v4 + CSS Variables
- **Animações**: Motion (Framer Motion)
- **Ícones**: Lucide React
- **Build**: Vite
- **Fontes**: Google Fonts (Nunito)

## 📦 Estrutura de Pastas

```
src/
├── app/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # Container principal
│   │   │   ├── Sidebar.tsx       # Navegação lateral
│   │   │   ├── TopBar.tsx        # Header mobile
│   │   │   └── BottomNav.tsx     # Nav mobile
│   │   └── taxio/
│   │       ├── TaxioLogo.tsx     # Logo reutilizável
│   │       ├── TaxioButton.tsx   # Botão customizado
│   │       ├── TaxioCard.tsx     # Card com animação
│   │       ├── TaxioBadge.tsx    # Badge de status
│   │       ├── TaxioInput.tsx    # Input customizado
│   │       ├── TaxioSelect.tsx   # Select customizado
│   │       ├── TaxioTextarea.tsx # Textarea customizado
│   │       └── MetricCard.tsx    # Card de métrica
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ConsultaIA.tsx
│   │   ├── ConsultaLote.tsx
│   │   ├── ConsultaManual.tsx
│   │   ├── Historico.tsx
│   │   ├── ExportarCSV.tsx
│   │   └── CentralAjuda.tsx
│   ├── routes.tsx                # Configuração de rotas
│   └── App.tsx                   # Entry point
└── styles/
    ├── fonts.css                 # Import Nunito
    ├── theme.css                 # Design tokens
    └── index.css                 # Animações globais
```

## 🎨 Componentes Customizados

### TaxioButton
Variantes: `primary`, `outline`, `ghost`, `success`
- Hover com translateY
- Loading state com spinner
- Disabled state

### TaxioBadge
Variantes: `success`, `warning`, `info`, `lote`, `processing`
- Pulse animation opcional
- Cores semânticas

### TaxioCard
- Animação de entrada com stagger
- Border accent opcional
- Elevated variant

### MetricCard
- Counter animation
- Delta com seta (positivo/negativo)
- Stagger delay

## 🌐 Integrações Futuras (Backend)

### IA para Classificação
- **Teste**: Groq API (llama-3.3-70b-versatile)
- **Produção**: Claude API (claude-sonnet-4-20250514)

### Banco de Dados
- **Supabase**: Auth + PostgreSQL com RLS
- Tabelas: `usuarios`, `classificacoes`, `lotes`, `exportacoes`

## 💡 Próximos Passos

1. **Integração com IA**: Conectar Groq/Claude API para classificação real
2. **Banco de dados**: Implementar Supabase para persistência
3. **Autenticação**: Sistema de login com Supabase Auth
4. **Exportação real**: Gerar CSVs formatados por ERP
5. **Webhooks**: Notificações de lotes processados
6. **Dashboard analytics**: Gráficos detalhados com Recharts

## 📝 Notas de Design

- **Font loading**: Nunito importada via Google Fonts
- **Animações**: Motion.dev para transições suaves
- **Acessibilidade**: Cores com contraste adequado, labels semânticos
- **Performance**: Lazy loading de componentes, animações otimizadas

## 🎯 Experiência do Usuário

- Feedback visual imediato em todas as interações
- Loading states em todas as operações assíncronas
- Validação inline com mensagens claras
- Navegação intuitiva e consistente
- Mobile-first mas otimizado para desktop

---

**Desenvolvido para Figma Make** — Interface completa e funcional pronta para integração com backend.
