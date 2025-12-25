// ============================================
// CONFIGURAÇÃO GLOBAL DO GERENCIADOR FINANCEIRO PRO
// Versão 4.0.0 - Com Sistema de Vendas, Devedores e Google Sheets
// ============================================

// Constantes de ações de log
const LOG_ACTIONS = {
  // Autenticação
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  SESSION_EXTENDED: 'SESSION_EXTENDED',
  
  // Transações
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  
  // Contas
  CREATE_ACCOUNT: 'CREATE_ACCOUNT',
  UPDATE_ACCOUNT: 'UPDATE_ACCOUNT',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
  
  // Categorias
  CREATE_CATEGORY: 'CREATE_CATEGORY',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  
  // Vendas
  CREATE_SALE: 'CREATE_SALE',
  UPDATE_SALE: 'UPDATE_SALE',
  DELETE_SALE: 'DELETE_SALE',
  RECEIVE_SALE_PAYMENT: 'RECEIVE_SALE_PAYMENT',
  
  // Clientes
  CREATE_CUSTOMER: 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER: 'DELETE_CUSTOMER',
  
  // Produtos
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  
  // Devedores
  CREATE_DEBTOR: 'CREATE_DEBTOR',
  UPDATE_DEBTOR: 'UPDATE_DEBTOR',
  DELETE_DEBTOR: 'DELETE_DEBTOR',
  RECEIVE_DEBTOR_PAYMENT: 'RECEIVE_DEBTOR_PAYMENT',
  
  // Orçamentos
  CREATE_BUDGET: 'CREATE_BUDGET',
  UPDATE_BUDGET: 'UPDATE_BUDGET',
  DELETE_BUDGET: 'DELETE_BUDGET',
  
  // Metas
  CREATE_GOAL: 'CREATE_GOAL',
  UPDATE_GOAL: 'UPDATE_GOAL',
  DELETE_GOAL: 'DELETE_GOAL',
  
  // Investimentos
  CREATE_INVESTMENT: 'CREATE_INVESTMENT',
  UPDATE_INVESTMENT: 'UPDATE_INVESTMENT',
  DELETE_INVESTMENT: 'DELETE_INVESTMENT',
  
  // Dívidas
  CREATE_DEBT: 'CREATE_DEBT',
  UPDATE_DEBT: 'UPDATE_DEBT',
  DELETE_DEBT: 'DELETE_DEBT',
  PAY_DEBT: 'PAY_DEBT',
  
  // Perfis/Negócios
  CREATE_BUSINESS: 'CREATE_BUSINESS',
  UPDATE_BUSINESS: 'UPDATE_BUSINESS',
  DELETE_BUSINESS: 'DELETE_BUSINESS',
  SWITCH_BUSINESS: 'SWITCH_BUSINESS',
  
  // Sistema
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA',
  CLEAR_DATA: 'CLEAR_DATA',
  CHANGE_SETTINGS: 'CHANGE_SETTINGS',
  LOGS_CLEARED: 'LOGS_CLEARED',
  VIEW_LOGS: 'VIEW_LOGS'
};

const CONFIG = {
  APP_NAME: 'Gerenciador Financeiro Pro',
  APP_VERSION: '4.0.0',
  CURRENCY: 'BRL',
  CURRENCY_SYMBOL: 'R$',
  LOCALE: 'pt-BR',

  // Tipos de negócio/perfil
  BUSINESS_TYPES: {
    PERSONAL: 'pessoal',
    COMPANY: 'empresa',
    FREELANCE: 'freelance',
    INVESTMENT: 'investimento'
  },

  // Tipos de transação
  TRANSACTION_TYPES: {
    INCOME: 'receita',
    EXPENSE: 'despesa',
    TRANSFER: 'transferencia'
  },

  // Status de transação
  TRANSACTION_STATUS: {
    PAID: 'pago',
    PENDING: 'pendente',
    CANCELLED: 'cancelado',
    SCHEDULED: 'agendado'
  },

  // Tipos de conta
  ACCOUNT_TYPES: {
    BANK: 'banco',
    WALLET: 'carteira',
    INVESTMENT: 'investimento',
    CREDIT_CARD: 'cartao_credito',
    SAVINGS: 'poupanca',
    OTHER: 'outro'
  },

  // Tipos de investimento
  INVESTMENT_TYPES: {
    FIXED_INCOME: 'renda_fixa',
    VARIABLE_INCOME: 'renda_variavel',
    FUND: 'fundo',
    CRYPTO: 'cripto',
    REAL_ESTATE: 'imoveis',
    STOCKS: 'acoes'
  },

  // Tipos de dívida
  DEBT_TYPES: {
    LOAN: 'emprestimo',
    CREDIT_CARD: 'cartao_credito',
    FINANCING: 'financiamento',
    PERSONAL: 'pessoal',
    OTHER: 'outro'
  },

  // Status de venda
  SALE_STATUS: {
    PENDING: 'pendente',
    PARTIAL: 'parcial',
    PAID: 'pago',
    CANCELLED: 'cancelado',
    OVERDUE: 'vencido'
  },

  // Tipos de pagamento de venda
  SALE_PAYMENT_TYPES: {
    CASH: 'dinheiro',
    PIX: 'pix',
    CREDIT_CARD: 'cartao_credito',
    DEBIT_CARD: 'cartao_debito',
    BANK_TRANSFER: 'transferencia',
    INSTALLMENT: 'parcelado',
    OTHER: 'outro'
  },

  // Status de devedor
  DEBTOR_STATUS: {
    ACTIVE: 'ativo',
    PARTIAL: 'parcial',
    PAID: 'quitado',
    OVERDUE: 'vencido',
    NEGOTIATING: 'negociando',
    DEFAULTED: 'inadimplente'
  },

  // Frequência de recorrência
  RECURRENCE_FREQUENCY: {
    DAILY: 'diaria',
    WEEKLY: 'semanal',
    BIWEEKLY: 'quinzenal',
    MONTHLY: 'mensal',
    QUARTERLY: 'trimestral',
    SEMIANNUAL: 'semestral',
    YEARLY: 'anual'
  },

  // Ícones padrão
  DEFAULT_ICONS: {
    FOOD: '🍔',
    TRANSPORT: '🚗',
    ENTERTAINMENT: '🎬',
    HEALTH: '🏥',
    EDUCATION: '📚',
    SHOPPING: '🛍️',
    UTILITIES: '💡',
    SALARY: '💰',
    INVESTMENT: '📈',
    TRANSFER: '💸',
    LOAN: '🏦',
    HOME: '🏠',
    TRAVEL: '✈️',
    SUBSCRIPTION: '📱',
    SALE: '🛒',
    DEBTOR: '👤',
    OTHER: '📌'
  },

  // Cores padrão
  DEFAULT_COLORS: [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#A855F7',
    '#22C55E', '#E11D48', '#0EA5E9', '#D946EF'
  ],

  // Chaves de armazenamento
  STORAGE_KEYS: {
    BUSINESSES: 'gfp_businesses',
    TRANSACTIONS: 'gfp_transactions',
    ACCOUNTS: 'gfp_accounts',
    CATEGORIES: 'gfp_categories',
    BUDGETS: 'gfp_budgets',
    INVESTMENTS: 'gfp_investments',
    DEBTS: 'gfp_debts',
    GOALS: 'gfp_goals',
    RECURRING: 'gfp_recurring',
    CURRENT_BUSINESS: 'gfp_current_business',
    SETTINGS: 'gfp_settings',
    LAST_BACKUP: 'gfp_last_backup',
    SALES: 'gfp_sales',
    CUSTOMERS: 'gfp_customers',
    PRODUCTS: 'gfp_products',
    PRODUCT_CATEGORIES: 'gfp_product_categories',
    DEBTORS: 'gfp_debtors',
    // Chaves para Google Sheets e Logs
    GOOGLE_SHEETS_CONFIG: 'gfp_google_sheets_config',
    SYNC_STATUS: 'gfp_sync_status',
    ACTIVITY_LOGS: 'gfp_activity_logs',
    // Chaves de autenticação
    SESSION: 'gfp_session',
    AUTH_TOKEN: 'gfp_auth_token'
  },

  // Configuração do Google Sheets
  GOOGLE_SHEETS: {
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',
    SHEETS: {
      TRANSACTIONS: 'Transações',
      ACCOUNTS: 'Contas',
      CATEGORIES: 'Categorias',
      SALES: 'Vendas',
      CUSTOMERS: 'Clientes',
      PRODUCTS: 'Produtos',
      DEBTORS: 'Devedores',
      BUDGETS: 'Orçamentos',
      INVESTMENTS: 'Investimentos',
      DEBTS: 'Dívidas',
      GOALS: 'Metas',
      BUSINESSES: 'Perfis',
      LOGS: 'Logs',
      CONFIG: 'Configurações'
    },
    // Estrutura de colunas para cada aba
    COLUMNS: {
      TRANSACTIONS: ['ID', 'BusinessID', 'Tipo', 'Valor', 'Descrição', 'Data', 'CategoriaID', 'ContaID', 'Status', 'Recorrente', 'Tags', 'CriadoEm', 'AtualizadoEm'],
      ACCOUNTS: ['ID', 'BusinessID', 'Nome', 'Tipo', 'Cor', 'Ícone', 'Saldo', 'SaldoInicial', 'Ativo', 'CriadoEm', 'AtualizadoEm'],
      CATEGORIES: ['ID', 'BusinessID', 'Nome', 'Ícone', 'Cor', 'Tipo', 'CriadoEm', 'AtualizadoEm'],
      SALES: ['ID', 'BusinessID', 'ClienteID', 'Produtos', 'Total', 'Pago', 'Status', 'Data', 'Vencimento', 'Pagamentos', 'Notas', 'CriadoEm', 'AtualizadoEm'],
      CUSTOMERS: ['ID', 'BusinessID', 'Nome', 'Email', 'Telefone', 'Endereço', 'TotalCompras', 'TotalGasto', 'CriadoEm', 'AtualizadoEm'],
      PRODUCTS: ['ID', 'BusinessID', 'Nome', 'Descrição', 'Preço', 'Custo', 'Estoque', 'Categoria', 'Ativo', 'CriadoEm', 'AtualizadoEm'],
      DEBTORS: ['ID', 'BusinessID', 'Nome', 'Telefone', 'Email', 'Total', 'Pago', 'Restante', 'Status', 'Vencimento', 'Parcelas', 'Pagamentos', 'Notas', 'CriadoEm', 'AtualizadoEm'],
      BUDGETS: ['ID', 'BusinessID', 'CategoriaID', 'Valor', 'MêsAno', 'CriadoEm', 'AtualizadoEm'],
      INVESTMENTS: ['ID', 'BusinessID', 'Nome', 'Tipo', 'ValorInicial', 'ValorAtual', 'DataCompra', 'Notas', 'CriadoEm', 'AtualizadoEm'],
      DEBTS: ['ID', 'BusinessID', 'Nome', 'Tipo', 'ValorTotal', 'ValorPago', 'Juros', 'Parcelas', 'ParcelasPagas', 'DataInicio', 'CriadoEm', 'AtualizadoEm'],
      GOALS: ['ID', 'BusinessID', 'Nome', 'ValorMeta', 'ValorAtual', 'DataLimite', 'Categoria', 'CriadoEm', 'AtualizadoEm'],
      BUSINESSES: ['ID', 'Nome', 'Descrição', 'Tipo', 'Ativo', 'CriadoEm', 'AtualizadoEm'],
      LOGS: ['ID', 'UserID', 'Username', 'Ação', 'Descrição', 'Detalhes', 'Timestamp']
    }
  },

  // Categorias padrão
  DEFAULT_CATEGORIES: {
    income: [
      { name: 'Salário', icon: '💰', color: '#10B981', type: 'receita' },
      { name: 'Freelance', icon: '💻', color: '#3B82F6', type: 'receita' },
      { name: 'Investimentos', icon: '📈', color: '#8B5CF6', type: 'receita' },
      { name: 'Bônus', icon: '🎁', color: '#F59E0B', type: 'receita' },
      { name: 'Vendas', icon: '🛒', color: '#06B6D4', type: 'receita' },
      { name: 'Recebimento Devedores', icon: '💵', color: '#22C55E', type: 'receita' },
      { name: 'Outros Ganhos', icon: '💵', color: '#22C55E', type: 'receita' }
    ],
    expense: [
      { name: 'Alimentação', icon: '🍔', color: '#EF4444', type: 'despesa' },
      { name: 'Transporte', icon: '🚗', color: '#F97316', type: 'despesa' },
      { name: 'Moradia', icon: '🏠', color: '#8B5CF6', type: 'despesa' },
      { name: 'Saúde', icon: '🏥', color: '#EC4899', type: 'despesa' },
      { name: 'Educação', icon: '📚', color: '#3B82F6', type: 'despesa' },
      { name: 'Lazer', icon: '🎬', color: '#14B8A6', type: 'despesa' },
      { name: 'Compras', icon: '🛍️', color: '#D946EF', type: 'despesa' },
      { name: 'Contas', icon: '💡', color: '#F59E0B', type: 'despesa' },
      { name: 'Assinaturas', icon: '📱', color: '#6366F1', type: 'despesa' },
      { name: 'Viagem', icon: '✈️', color: '#0EA5E9', type: 'despesa' },
      { name: 'Outros Gastos', icon: '📌', color: '#64748B', type: 'despesa' }
    ]
  },

  // Categorias padrão de produtos
  DEFAULT_PRODUCT_CATEGORIES: [
    { name: 'Eletrônicos', icon: '📱', color: '#3B82F6' },
    { name: 'Roupas', icon: '👕', color: '#EC4899' },
    { name: 'Alimentos', icon: '🍔', color: '#F59E0B' },
    { name: 'Bebidas', icon: '🥤', color: '#06B6D4' },
    { name: 'Casa e Jardim', icon: '🏠', color: '#10B981' },
    { name: 'Beleza', icon: '💄', color: '#D946EF' },
    { name: 'Esportes', icon: '⚽', color: '#EF4444' },
    { name: 'Serviços', icon: '🔧', color: '#8B5CF6' },
    { name: 'Outros', icon: '📦', color: '#64748B' }
  ],

  // Contas padrão
  DEFAULT_ACCOUNTS: [
    { name: 'Banco Principal', type: 'banco', color: '#3B82F6', icon: '🏦' },
    { name: 'Carteira', type: 'carteira', color: '#10B981', icon: '👛' },
    { name: 'Cartão de Crédito', type: 'cartao_credito', color: '#EF4444', icon: '💳' },
    { name: 'Poupança', type: 'poupanca', color: '#8B5CF6', icon: '🐷' }
  ],

  // Configurações padrão do usuário
  DEFAULT_SETTINGS: {
    darkMode: false,
    autoBackup: true,
    backupInterval: 7, // dias
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    showCents: true,
    notifications: true,
    language: 'pt-BR'
  },

  // Limites e validações
  LIMITS: {
    MAX_DESCRIPTION_LENGTH: 200,
    MAX_NAME_LENGTH: 100,
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 999999999.99,
    MAX_INTEREST_RATE: 1000,
    MAX_CATEGORIES: 50,
    MAX_ACCOUNTS: 20,
    MAX_INSTALLMENTS: 360,
    MAX_LOGS: 1000,
    SESSION_DURATION: 24 * 60 * 60 * 1000 // 24 horas em ms
  }
};

// ============================================
// FUNÇÕES UTILITÁRIAS GLOBAIS
// ============================================

/**
 * Formata valor monetário
 * @param {number} value - Valor em centavos
 * @returns {string} Valor formatado
 */
const formatCurrency = (value) => {
  const numValue = typeof value === 'number' ? value : 0;
  return new Intl.NumberFormat(CONFIG.LOCALE, {
    style: 'currency',
    currency: CONFIG.CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue / 100);
};

/**
 * Formata valor monetário sem símbolo
 * @param {number} value - Valor em centavos
 * @returns {string} Valor formatado sem símbolo
 */
const formatNumber = (value) => {
  const numValue = typeof value === 'number' ? value : 0;
  return new Intl.NumberFormat(CONFIG.LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue / 100);
};

/**
 * Formata data
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(CONFIG.LOCALE);
};

/**
 * Formata data e hora
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data e hora formatadas
 */
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(CONFIG.LOCALE);
};

/**
 * Retorna o mês/ano atual no formato YYYY-MM
 * @returns {string} Mês/ano atual
 */
const getCurrentMonthYear = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Retorna a data atual no formato YYYY-MM-DD
 * @returns {string} Data atual
 */
const getCurrentDate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

/**
 * Converte valor de reais para centavos
 * @param {number} value - Valor em reais
 * @returns {number} Valor em centavos
 */
const toCents = (value) => {
  if (!value) return 0;
  // Se for string com formatação brasileira (1.234,56), converter
  if (typeof value === 'string') {
    value = value.replace(/\./g, '').replace(',', '.');
  }
  return Math.round(parseFloat(value || 0) * 100);
};

/**
 * Converte valor de centavos para reais
 * @param {number} value - Valor em centavos
 * @returns {number} Valor em reais
 */
const toReais = (value) => {
  return (value || 0) / 100;
};

/**
 * Gera um ID único
 * @returns {string} ID único
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Valida se um valor é um número válido
 * @param {any} value - Valor a ser validado
 * @returns {boolean} Se é válido
 */
const isValidNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num) && num >= 0;
};

/**
 * Valida se uma string não está vazia
 * @param {string} value - Valor a ser validado
 * @returns {boolean} Se é válido
 */
const isValidString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Sanitiza string para prevenir XSS
 * @param {string} str - String a ser sanitizada
 * @returns {string} String sanitizada
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Debounce function
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Formata nome do mês
 * @param {string} monthYear - Mês/ano no formato YYYY-MM
 * @returns {string} Nome do mês formatado
 */
const formatMonthYear = (monthYear) => {
  if (!monthYear) return '';
  const [year, month] = monthYear.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString(CONFIG.LOCALE, { month: 'long', year: 'numeric' });
};

/**
 * Calcula diferença em dias entre duas datas
 * @param {Date|string} date1 - Primeira data
 * @param {Date|string} date2 - Segunda data
 * @returns {number} Diferença em dias
 */
const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Retorna cor baseada no valor (positivo/negativo)
 * @param {number} value - Valor
 * @returns {string} Classe CSS
 */
const getValueClass = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
};

/**
 * Formata telefone brasileiro
 * @param {string} phone - Telefone
 * @returns {string} Telefone formatado
 */
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Formata CPF/CNPJ
 * @param {string} doc - Documento
 * @returns {string} Documento formatado
 */
const formatDocument = (doc) => {
  if (!doc) return '';
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  return doc;
};

/**
 * Verifica se uma data está vencida
 * @param {string|Date} date - Data a verificar
 * @returns {boolean} Se está vencida
 */
const isOverdue = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

/**
 * Calcula dias até vencimento
 * @param {string|Date} date - Data de vencimento
 * @returns {number} Dias até vencimento (negativo se vencido)
 */
const daysUntilDue = (date) => {
  if (!date) return 0;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = d - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Gera hash simples para ofuscação (não é criptografia segura)
 * @param {string} str - String para gerar hash
 * @returns {string} Hash da string
 */
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

/**
 * Codifica dados em base64
 * @param {string} str - String para codificar
 * @returns {string} String codificada
 */
const encodeBase64 = (str) => {
  try {
    return btoa(encodeURIComponent(str));
  } catch (e) {
    return str;
  }
};

/**
 * Decodifica dados de base64
 * @param {string} str - String para decodificar
 * @returns {string} String decodificada
 */
const decodeBase64 = (str) => {
  try {
    return decodeURIComponent(atob(str));
  } catch (e) {
    return str;
  }
};

// Exportar para uso global
window.CONFIG = CONFIG;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.getCurrentMonthYear = getCurrentMonthYear;
window.getCurrentDate = getCurrentDate;
window.toCents = toCents;
window.toReais = toReais;
window.generateId = generateId;
window.isValidNumber = isValidNumber;
window.isValidString = isValidString;
window.sanitizeString = sanitizeString;
window.debounce = debounce;
window.formatMonthYear = formatMonthYear;
window.daysBetween = daysBetween;
window.getValueClass = getValueClass;
window.formatPhone = formatPhone;
window.formatDocument = formatDocument;
window.isOverdue = isOverdue;
window.daysUntilDue = daysUntilDue;
window.simpleHash = simpleHash;
window.encodeBase64 = encodeBase64;
window.decodeBase64 = decodeBase64;
