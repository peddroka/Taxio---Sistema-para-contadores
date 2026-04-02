# Taxio - Quick Start Guide

## 🚀 Como usar a aplicação

### Navegação Principal

#### Desktop/Tablet
- **Sidebar lateral** com todos os itens de navegação
- Clique em qualquer item para navegar
- Botão de recolher/expandir no rodapé da sidebar (tablet)

#### Mobile
- **Bottom navigation** com 5 ícones principais
- Toque em "Mais" para acessar itens adicionais via drawer
- **Top bar** com logo e avatar do usuário

### Páginas e Funcionalidades

#### 1. Dashboard (`/`)
**O que fazer:**
- Visualize métricas de desempenho
- Veja últimas classificações
- Acompanhe atividade do mês
- Clique em "Nova consulta" para começar

**Dados exibidos:**
- Produtos classificados: 1.284 (+142 este mês)
- Acurácia da IA: 98,4%
- Lotes processados: 38
- Erros evitados: 217

---

#### 2. Consulta com IA (`/consulta-ia`)
**Como usar:**
1. Digite a descrição completa do produto
2. Selecione o ERP do cliente
3. Selecione o Estado (UF)
4. Clique em "Classificar com IA"
5. Aguarde 2 segundos (simulação)
6. Resultado aparece com NCM, CEST, CST e cClassTrib
7. Opções: "Salvar e exportar" ou "Editar resultado"

**Exemplo de entrada:**
```
Produto: Notebook Dell Inspiron 15 3000, Intel Core i5-1135G7, 
8GB RAM DDR4, SSD 256GB NVMe, Tela 15.6 Full HD, Windows 11 Home
ERP: TOTVS Protheus
UF: SP
```

**Resultado esperado:**
- NCM: 8471.30.12 (Máquinas portáteis)
- CEST: 21.012.00 (Computadores portáteis)
- CST: 000 (Tributada integralmente)
- cClassTrib: 051 (Equipamento de informática)
- Confiança: 98%

---

#### 3. Consulta em Lote (`/consulta-lote`)
**Como usar:**
1. Arraste um arquivo CSV ou clique para selecionar
2. Aguarde o processamento (barra de progresso)
3. Visualize lotes anteriores
4. Baixe resultados dos lotes concluídos

**Formato CSV esperado:**
```csv
codigo_produto,descricao,unidade,ncm
001,Notebook Dell Inspiron,UN,8471.30.12
002,Mouse Logitech MX,UN,
```

**Colunas obrigatórias:**
- `codigo_produto`: Código interno
- `descricao`: Descrição completa
- `unidade`: UN, PC, KG, etc.
- `ncm`: Opcional (se vazio, será classificado)

**Limite:** Até 10.000 produtos por arquivo

---

#### 4. Consulta Manual (`/consulta-manual`)
**Como usar:**
1. Preencha os campos com formatação automática:
   - NCM: 0000.00.00 (8 dígitos)
   - CEST: 00.000.00 (7 dígitos)
   - CST: 000 (3 dígitos)
   - cClassTrib: 000 (3 dígitos)
2. Digite a descrição do produto
3. Validação em tempo real mostra ✓ ou ✗
4. Clique em "Validar e salvar"

**Validações:**
- ✓ Verde: Campo válido
- ✗ Vermelho: Campo inválido com mensagem de erro
- Botão só fica habilitado quando todos os campos estão válidos

---

#### 5. Histórico (`/historico`)
**Funcionalidades:**
- **Busca**: Digite produto ou NCM na barra de busca
- **Filtros rápidos**: Todos, Aprovados, Revisar, IA, Lote, Manual
- **Tabela completa** (desktop): 8 colunas com hover
- **Cards** (mobile): Informações condensadas
- **Ações**: Download individual ou deletar
- **Paginação**: 1, 2, 3... 12 páginas

**Badges de origem:**
- 🔵 IA: Classificado por inteligência artificial
- ⚫ Lote: Importado via CSV
- 🟢 Manual: Inserido manualmente

**Badges de status:**
- 🟢 Aprovado: Classificação confirmada
- 🟡 Revisar: Precisa de revisão manual

---

#### 6. Exportar CSV (`/exportar`)
**Como usar:**
1. Selecione ERP de destino:
   - TOTVS/Protheus
   - SAP Business One
   - Omie
   - Bling
   - CSV Genérico
2. Escolha período:
   - Hoje
   - Última semana
   - Último mês
   - Último trimestre
   - Último ano
   - Todos os registros
3. Filtre por status:
   - Apenas aprovados
   - Apenas para revisar
   - Todos
4. ☑️ Incluir produtos para revisão (opcional)
5. Clique em "Gerar e baixar CSV"
6. Aguarde 2 segundos (simulação de geração)

**Últimos exports:**
- Histórico de 5 exportações mais recentes
- Baixar novamente clicando no ícone de download

---

#### 7. Central de Ajuda (`/ajuda`)
**Canais de suporte:**

📱 **WhatsApp**
- Resposta em até 2h
- Clique em "Abrir WhatsApp"

📧 **E-mail**
- Para demandas detalhadas
- suporte@taxio.com.br

📚 **Documentação**
- Guias e tutoriais em vídeo
- "Acessar docs"

❓ **FAQ**
- Dúvidas sobre NCM e CST
- "Ver perguntas"

**Estatísticas:**
- 2.400+ empresas atendidas
- 1.2M+ produtos classificados
- 98.7% precisão média
- Suporte 24/7

---

## 🎨 Temas e Cores

### Códigos de Cor por Tipo
- **Aprovado**: Verde (#10B981)
- **Revisar**: Âmbar (#F59E0B)
- **Info/IA**: Azul (#3B82F6 / #1A4ED8)
- **Lote**: Cinza (#94A3B8)
- **Erro/Perigo**: Vermelho (#EF4444)

### Estados de Interação
- **Hover**: Elevação com translateY(-1px)
- **Focus**: Borda azul + glow sutil
- **Loading**: Spinner animado
- **Disabled**: Opacidade 50%

---

## 📱 Responsividade

### Mobile (< 640px)
- Bottom nav com 5 ícones
- Cards empilhados verticalmente
- Grid de métricas: 1 coluna

### Tablet (640-1024px)
- Sidebar recolhida (só ícones)
- Grid de métricas: 2 colunas
- Tabelas responsivas

### Desktop (> 1280px)
- Sidebar completa (220px)
- Grid de métricas: 4 colunas
- Layout full com todas as informações

---

## ⌨️ Atalhos e Dicas

### Navegação Rápida
- Clique no logo para voltar ao Dashboard
- Use os filtros rápidos para agilizar buscas
- Favoritos: marque classificações frequentes

### Produtividade
- **Upload em lote**: Processe milhares de produtos de uma vez
- **Templates CSV**: Baixe modelo pré-formatado
- **Salvar configurações**: ERP e UF ficam salvos para próximas consultas

### Validação
- Formatação automática de NCM, CEST, CST
- Feedback visual instantâneo
- Mensagens de erro claras e específicas

---

## 🔄 Fluxo de Trabalho Recomendado

### Para novos produtos (poucos itens)
1. Dashboard → "Nova consulta"
2. Consulta com IA
3. Revisar resultado
4. Salvar e exportar

### Para importação em massa
1. Preparar CSV com template
2. Consulta em Lote → Upload
3. Aguardar processamento
4. Revisar avisos (se houver)
5. Exportar para ERP

### Para correções manuais
1. Histórico → Buscar produto
2. Editar classificação
3. Consulta Manual → Validar
4. Salvar novamente

---

## 🆘 Solução de Problemas

### CSV não é aceito
- Verifique se tem as 4 colunas obrigatórias
- Encoding deve ser UTF-8
- Máximo 10.000 linhas
- Formato: .csv (não .xlsx)

### Validação falha
- NCM: Exatamente 8 dígitos numéricos
- CEST: Exatamente 7 dígitos numéricos
- CST: Exatamente 3 dígitos numéricos
- cClassTrib: Exatamente 3 dígitos numéricos

### Resultado da IA parece incorreto
- Revise a descrição do produto (mais detalhes = melhor precisão)
- Verifique o ERP selecionado
- Use "Editar resultado" para corrigir
- Ou refaça via Consulta Manual

---

## 📊 Métricas e Monitoramento

### Dashboard mostra:
- **Produtos classificados**: Total acumulado + crescimento mensal
- **Acurácia da IA**: Percentual de classificações corretas
- **Lotes processados**: Quantidade de uploads concluídos
- **Erros evitados**: Estimativa de problemas fiscais prevenidos

### Atividade do mês:
- Consultas com IA: 87 de 120 possíveis (72%)
- Consultas em lote: 38 de 70 possíveis (55%)
- Consultas manuais: 17 de 80 possíveis (22%)
- CSVs exportados: 12 de 30 possíveis (40%)

---

## 💡 Dicas Pro

1. **Descreva bem os produtos**: Quanto mais detalhes, maior a precisão da IA
2. **Use lotes para volume**: Economize tempo processando milhares de itens
3. **Exporte regularmente**: Mantenha seu ERP atualizado
4. **Revise avisos**: Produtos marcados para revisão podem ter exceções fiscais
5. **Salve templates**: Crie modelos CSV para diferentes categorias de produtos

---

**Precisa de ajuda?** Acesse a Central de Ajuda ou entre em contato via WhatsApp/E-mail!
