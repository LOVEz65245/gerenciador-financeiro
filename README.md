# Gerenciador Financeiro Pro v4.1

Este é um gerenciador financeiro completo, desenvolvido para ajudar no controle de suas finanças pessoais ou de seu negócio. A aplicação foi reformulada e aprimorada para oferecer uma experiência de usuário mais robusta e organizada, com integração ao Google Sheets para armazenamento de dados na nuvem.

## Novidades da Versão 4.1

### Sincronização em Tempo Real com Google Sheets

A principal novidade desta versão é a **sincronização em tempo real** com o Google Sheets. Agora, todas as alterações feitas no gerenciador são automaticamente enviadas para a planilha assim que você confirma qualquer mudança:

- **Criação de dados:** Ao criar uma nova transação, conta, categoria, venda, cliente, produto ou devedor, os dados são sincronizados automaticamente.
- **Edição de dados:** Qualquer alteração em registros existentes é refletida na planilha em tempo real.
- **Exclusão de dados:** Ao excluir um registro, a planilha é atualizada imediatamente.
- **Debounce inteligente:** As alterações são agrupadas em lotes de 500ms para evitar requisições excessivas à API do Google.

### Como Ativar a Sincronização em Tempo Real

1. Acesse **Sistema > Google Sheets** no menu lateral.
2. Configure suas credenciais do Google Cloud (Client ID, API Key e ID da Planilha).
3. Clique em **Testar Conexão** e autorize o acesso.
4. Na seção **Sincronização em Tempo Real**, ative a opção "Sincronizar automaticamente após cada alteração".

## Funcionalidades

- **Dashboard:** Visão geral das finanças com gráficos e resumos.
- **Transações:** Cadastro e listagem de receitas e despesas.
- **Contas:** Gerenciamento de contas bancárias, carteiras e cartões.
- **Categorias:** Organização das transações por categorias personalizadas.
- **Vendas:** Módulo completo para controle de vendas, clientes e produtos.
- **Devedores:** Controle de contas a receber e devedores.
- **Metas e Orçamentos:** Planejamento financeiro com metas e orçamentos mensais.
- **Investimentos e Dívidas:** Acompanhamento de investimentos e dívidas.
- **Relatórios:** Relatórios detalhados para análise financeira.
- **Google Sheets:** Sincronização de dados com o Google Sheets para backup e acesso na nuvem.
- **Sincronização em Tempo Real:** Alterações são enviadas automaticamente para a planilha.
- **Autenticação:** Sistema de login para múltiplos usuários.
- **Logs de Atividade:** Registro de todas as ações realizadas no sistema.

## Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/gerenciador-financeiro-pro.git
    cd gerenciador-financeiro-pro
    ```

2.  **Inicie um servidor local:**
    Para executar o projeto, você precisa de um servidor web local. Você pode usar o módulo `http.server` do Python:
    ```bash
    python3 -m http.server 8080
    ```
    Ou, se tiver o `live-server` instalado:
    ```bash
    live-server --port=8080
    ```

3.  **Acesse a aplicação:**
    Abra seu navegador e acesse `http://localhost:8080/login.html`.

## Configuração do Google Sheets

### Passo 1: Criar Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs e Serviços > Biblioteca**
4. Pesquise e ative a **Google Sheets API**

### Passo 2: Criar Credenciais OAuth 2.0

1. Vá em **APIs e Serviços > Credenciais**
2. Clique em **Criar Credenciais > ID do cliente OAuth**
3. Selecione **Aplicativo da Web**
4. Adicione as origens JavaScript autorizadas:
   - `http://localhost:8080` (para desenvolvimento)
   - `https://seu-site.netlify.app` (para produção)
5. Copie o **ID do cliente**

### Passo 3: Criar Chave de API

1. Em **Credenciais**, clique em **Criar Credenciais > Chave de API**
2. Restrinja a chave para a **Google Sheets API**
3. Copie a chave gerada

### Passo 4: Criar a Planilha

1. Acesse o [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit`
4. (Opcional) Cole o código do arquivo `codigo.gs` em **Extensões > Apps Script** para criar a estrutura automaticamente

### Passo 5: Configurar no Gerenciador

1. Acesse **Sistema > Google Sheets**
2. Preencha os campos com as credenciais obtidas
3. Clique em **Salvar Configuração**
4. Clique em **Testar Conexão** e autorize o acesso
5. Clique em **Criar Estrutura** para criar as abas na planilha

## Deploy no Netlify

Este projeto está pronto para ser implantado no Netlify. Basta conectar seu repositório do GitHub ao Netlify e usar as seguintes configurações:

- **Comando de build:** (deixe em branco)
- **Diretório de publicação:** `.` (ou o diretório raiz do projeto)

O Netlify irá servir os arquivos estáticos diretamente.

## Estrutura do Projeto

```
gerenciador-financeiro/
├── css/
│   └── style.css          # Estilos da aplicação
├── js/
│   ├── config.js          # Configurações globais
│   ├── auth.js            # Sistema de autenticação
│   ├── google-sheets.js   # Integração com Google Sheets
│   ├── finance-manager.js # Gerenciador financeiro principal
│   ├── sales-manager.js   # Gerenciador de vendas
│   ├── debtors-manager.js # Gerenciador de devedores
│   ├── ui-manager.js      # Gerenciador de interface
│   ├── ui-views.js        # Views da interface
│   ├── sales-views.js     # Views de vendas
│   ├── debtors-views.js   # Views de devedores
│   ├── logs-view.js       # View de logs
│   ├── google-sheets-view.js # View de configuração do Google Sheets
│   └── modal.js           # Sistema de modais
├── index.html             # Página principal
├── login.html             # Página de login
├── codigo.gs              # Script do Google Apps Script
├── netlify.toml           # Configuração do Netlify
└── README.md              # Este arquivo
```

## Changelog

### Versão 4.1.0
- Adicionada sincronização em tempo real com Google Sheets
- Melhorado o sistema de mapeamento de dados para a planilha
- Adicionada opção de ativar/desativar sincronização em tempo real
- Melhorada a interface de configuração do Google Sheets
- Adicionados estilos para indicadores de sincronização
- Corrigidos bugs no sistema de conversão de objetos para linhas da planilha

### Versão 4.0.0
- Versão inicial com integração Google Sheets
- Sistema de autenticação
- Módulo de vendas
- Módulo de devedores
- Logs de atividade
