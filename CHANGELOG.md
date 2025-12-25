# Changelog - Gerenciador Financeiro Pro

## Versão 4.1.2 (24/12/2024)

### Novas Funcionalidades

1. **Botão de Importar da Planilha no Sidebar**
   - Novo botão verde "Importar da Planilha" logo abaixo do título "Financeiro Pro"
   - Permite importar dados da planilha Google Sheets com um clique
   - Animação de loading durante a importação
   - Atalho de teclado: Ctrl+Shift+I

2. **Sincronização Automática ao Salvar**
   - Ao cadastrar, adicionar ou salvar qualquer dado, o sistema sincroniza automaticamente com a planilha
   - Usa debounce de 1 segundo para evitar múltiplas sincronizações seguidas
   - Funciona para transações, contas, categorias, vendas, produtos, clientes e devedores

### Correções de Bugs

1. **Erro de Sincronização com Google Sheets Corrigido**
   - Corrigido erro "Não é possível excluir todas as linhas não congeladas" que ocorria durante a sincronização
   - Substituído método `deleteRows()` por `clearContent()` para evitar conflito com linhas congeladas
   - Corrigidas as funções `clearData`, `syncAll` e `limparDadosExemplo` no `codigo.gs`

2. **Importação de Dados da Planilha Corrigida**
   - Corrigido problema onde dados da planilha não apareciam no gerenciador após sincronização
   - Corrigido nome da propriedade `clients` para `customers` no salesManager
   - Funções de importação agora substituem dados locais pelos da planilha
   - Corrigida chamada incorreta de `saveData()` para `saveAllData()`
   - Adicionados métodos `loadAllData()` e `saveAllData()` aos managers
   - Interface agora atualiza corretamente após importação
   - Filtro de linhas vazias adicionado para evitar importação de dados inválidos

### Detalhes Técnicos

- O erro de linhas congeladas ocorria porque o Google Sheets não permite excluir linhas quando a planilha ficaria apenas com linhas congeladas
- A solução usa `clearContent()` que limpa o conteúdo das células sem excluir as linhas
- A importação agora funciona como sincronização real: dados da planilha são a fonte da verdade
- Após importar, os managers recarregam dados do localStorage para garantir consistência

### Arquivos Modificados

| Arquivo | Alterações |
|---------|------------|
| `codigo.gs` | Corrigidas funções clearData, syncAll e limparDadosExemplo |
| `js/google-sheets.js` | Reescritas funções de importação para substituir dados locais |
| `js/sales-manager.js` | Adicionados métodos loadAllData() e saveAllData() |
| `js/debtors-manager.js` | Adicionados métodos loadAllData() e saveAllData() |

---

## Versão 4.1.0 (20/12/2024)

### Novas Funcionalidades

1. **Sincronização em Tempo Real com Google Sheets**
   - Todas as alterações feitas no gerenciador são automaticamente enviadas para a planilha
   - Sistema de debounce de 500ms para agrupar alterações e evitar requisições excessivas
   - Sincronização automática após criar, editar ou excluir qualquer registro
   - Opção para ativar/desativar a sincronização em tempo real

2. **Mapeamento Completo de Dados**
   - Implementado mapeamento específico para cada tipo de entidade (transações, contas, categorias, etc.)
   - Conversão correta de valores monetários (centavos para reais na planilha)
   - Suporte para campos complexos como arrays e objetos JSON
   - Mapeamento reverso para importação de dados da planilha

3. **Interface de Configuração Melhorada**
   - Nova seção "Sincronização em Tempo Real" na página de configuração do Google Sheets
   - Indicadores visuais de status de sincronização (conectado, sincronizando, sincronizado, erro)
   - Animação de rotação no ícone durante sincronização
   - Explicação detalhada de como funciona a sincronização

### Correções de Bugs

1. **Sistema de Sincronização**
   - Corrigido problema onde alterações não eram refletidas na planilha
   - Corrigido mapeamento incorreto de campos para a planilha
   - Corrigida conversão de valores monetários (agora usa centavos internamente e reais na planilha)

2. **Managers**
   - Adicionado trigger de sincronização no método `saveToStorage` de todos os managers
   - FinanceManager, SalesManager e DebtorsManager agora sincronizam automaticamente

3. **Logs de Atividade**
   - Logs agora também são sincronizados com a planilha
   - Adicionados novos tipos de log para sincronização em tempo real

### Melhorias Técnicas

1. **Arquitetura de Sincronização**
   - Implementada fila de operações pendentes
   - Sistema de debounce para evitar requisições excessivas
   - Processamento em lote das operações
   - Tratamento de erros com feedback visual

2. **Performance**
   - Sincronização é feita apenas quando o usuário está autenticado no Google
   - Operações são agrupadas por tipo de entidade
   - Reescrita completa da aba apenas quando necessário

### Arquivos Modificados

| Arquivo | Alterações |
|---------|------------|
| `js/google-sheets.js` | Reescrito completamente com sistema de sincronização em tempo real |
| `js/finance-manager.js` | Adicionado trigger de sincronização no saveToStorage |
| `js/sales-manager.js` | Adicionado trigger de sincronização no saveToStorage |
| `js/debtors-manager.js` | Adicionado trigger de sincronização no saveToStorage |
| `js/auth.js` | Adicionado trigger de sincronização para logs |
| `js/google-sheets-view.js` | Adicionada seção de sincronização em tempo real |
| `css/style.css` | Adicionados estilos para indicadores de sincronização |
| `README.md` | Atualizado com documentação das novas funcionalidades |

### Como Usar a Sincronização em Tempo Real

1. Configure as credenciais do Google Sheets (Client ID, API Key, ID da Planilha)
2. Conecte-se ao Google clicando em "Testar Conexão"
3. Crie a estrutura da planilha clicando em "Criar Estrutura"
4. Ative a opção "Sincronizar automaticamente após cada alteração"
5. Pronto! Todas as alterações serão enviadas automaticamente para a planilha

---

## Versão 4.0.0 (20/12/2024)

### Correções de Bugs

1. **Remoção de Duplicações**
   - Removida classe `Modal` duplicada que estava definida tanto em `config.js` quanto em `modal.js`
   - Removida constante `LOG_ACTIONS` duplicada que estava em `config.js` e `auth.js`
   - Agora `Modal` é definido apenas em `modal.js` e `LOG_ACTIONS` apenas em `auth.js`

2. **Sistema de Login Refeito**
   - Implementado sistema de hash para senhas (ofuscação com salt)
   - Sessão agora é codificada em base64 antes de ser armazenada
   - Adicionada validação de integridade do token de sessão
   - Implementada expiração de sessão configurável (24h por padrão)
   - Adicionado monitoramento automático de sessão

3. **Correção de Referências**
   - Atualizada função `updateUserInfo()` no `index.html` para usar a nova chave de sessão codificada
   - Corrigida inicialização do `UIManager` para verificar autenticação antes de inicializar

### Melhorias de Segurança

1. **Sistema de Autenticação**
   - Senhas não são mais armazenadas em texto plano no código
   - Implementado sistema de hash com salt para verificação de senhas
   - Token de sessão gerado com timestamp, random e fingerprint do navegador
   - Sessão codificada em base64 para ofuscação básica

2. **Logs de Atividade**
   - Registro de tentativas de login falhas
   - Registro de login e logout bem-sucedidos
   - Logs incluem informações do user-agent para auditoria

### Melhorias de UX

1. **Modais de Confirmação**
   - Substituídos todos os `confirm()` nativos por `Modal.confirmAction()`
   - Modais com design consistente e opções de "dangerous" para ações destrutivas
   - Implementados métodos adicionais: `Modal.prompt()`, `Modal.select()`, `Modal.loading()`

2. **Página de Login**
   - Design moderno com animações
   - Seleção visual de usuário (clique no avatar)
   - Indicador de Caps Lock ativo
   - Opção de mostrar/ocultar senha
   - Checkbox "Manter conectado por 24 horas"
   - Detecção de sessão existente com redirecionamento automático

3. **Interface Geral**
   - Adicionados novos estilos CSS para componentes de UI
   - Skeleton loading para carregamento
   - Tooltips e badges
   - Scrollbar customizada
   - Melhorias de acessibilidade (focus-visible)
   - Animações de entrada (fade-in, slide-up)

### Credenciais de Acesso

| Usuário | Senha |
|---------|-------|
| LVz | LVz1928 |
| Gabhy | Ghaby1928 |

### Funcionalidades Testadas

- ✅ Login com usuário LVz
- ✅ Seleção de usuário por clique no avatar
- ✅ Redirecionamento após login
- ✅ Dashboard carrega corretamente
- ✅ Navegação entre seções funciona
- ✅ Modal de confirmação de logout funciona
- ✅ Logs de atividade registram login
- ✅ Tema claro/escuro funciona
- ✅ Sessão persiste após refresh

### Notas Técnicas

- O sistema usa localStorage para persistência de dados
- A sessão é verificada a cada 5 minutos automaticamente
- Logs são limitados a 1000 registros para evitar problemas de armazenamento
- O sistema é totalmente client-side (não requer backend)
