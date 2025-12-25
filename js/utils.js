// ============================================
// UTILITÁRIOS - FORMATAÇÃO DE NÚMEROS EM TEMPO REAL
// Gerenciador Financeiro Pro v4.3
// ============================================

/**
 * Formata valor monetário em tempo real
 * @param {HTMLInputElement} input - Campo de input
 */
function formatCurrencyInput(input) {
  let value = input.value.replace(/\D/g, '');
  
  if (value === '') {
    input.value = '';
    return;
  }
  
  // Converte para número e divide por 100 para ter centavos
  let numValue = parseInt(value) / 100;
  
  // Formata como moeda brasileira
  input.value = numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata telefone em tempo real
 * @param {HTMLInputElement} input - Campo de input
 */
function formatPhoneInput(input) {
  let value = input.value.replace(/\D/g, '');
  
  if (value.length === 0) {
    input.value = '';
    return;
  }
  
  if (value.length <= 2) {
    input.value = `(${value}`;
  } else if (value.length <= 6) {
    input.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  } else if (value.length <= 10) {
    input.value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  } else {
    input.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
  }
}

/**
 * Formata CPF em tempo real
 * @param {HTMLInputElement} input - Campo de input
 */
function formatCPFInput(input) {
  let value = input.value.replace(/\D/g, '');
  
  if (value.length === 0) {
    input.value = '';
    return;
  }
  
  if (value.length <= 3) {
    input.value = value;
  } else if (value.length <= 6) {
    input.value = `${value.slice(0, 3)}.${value.slice(3)}`;
  } else if (value.length <= 9) {
    input.value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
  } else {
    input.value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
  }
}

/**
 * Formata CNPJ em tempo real
 * @param {HTMLInputElement} input - Campo de input
 */
function formatCNPJInput(input) {
  let value = input.value.replace(/\D/g, '');
  
  if (value.length === 0) {
    input.value = '';
    return;
  }
  
  if (value.length <= 2) {
    input.value = value;
  } else if (value.length <= 5) {
    input.value = `${value.slice(0, 2)}.${value.slice(2)}`;
  } else if (value.length <= 8) {
    input.value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
  } else if (value.length <= 12) {
    input.value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;
  } else {
    input.value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12, 14)}`;
  }
}

/**
 * Formata CPF ou CNPJ automaticamente baseado no tamanho
 * @param {HTMLInputElement} input - Campo de input
 */
function formatDocumentInput(input) {
  let value = input.value.replace(/\D/g, '');
  
  if (value.length <= 11) {
    formatCPFInput(input);
  } else {
    formatCNPJInput(input);
  }
}

/**
 * Formata número inteiro com separador de milhar
 * @param {HTMLInputElement} input - Campo de input
 */
function formatNumberInput(input) {
  let value = input.value.replace(/\D/g, '');
  
  if (value === '') {
    input.value = '';
    return;
  }
  
  input.value = parseInt(value).toLocaleString('pt-BR');
}

/**
 * Formata porcentagem em tempo real
 * @param {HTMLInputElement} input - Campo de input
 */
function formatPercentInput(input) {
  let value = input.value.replace(/[^\d,]/g, '').replace(',', '.');
  
  if (value === '' || value === '.') {
    input.value = '';
    return;
  }
  
  let numValue = parseFloat(value);
  if (isNaN(numValue)) {
    input.value = '';
    return;
  }
  
  // Limita a 2 casas decimais
  input.value = numValue.toFixed(2).replace('.', ',');
}

/**
 * Remove formatação e retorna valor numérico
 * @param {string} value - Valor formatado
 * @returns {number} - Valor numérico
 */
function parseCurrency(value) {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

/**
 * Remove formatação de telefone
 * @param {string} value - Valor formatado
 * @returns {string} - Apenas números
 */
function parsePhone(value) {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Remove formatação de documento (CPF/CNPJ)
 * @param {string} value - Valor formatado
 * @returns {string} - Apenas números
 */
function parseDocument(value) {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Inicializa formatação automática em todos os campos
 */
function initAutoFormatting() {
  // Campos de valor monetário
  document.querySelectorAll('input[data-format="currency"], input.currency-input').forEach(input => {
    input.addEventListener('input', () => formatCurrencyInput(input));
    input.addEventListener('blur', () => {
      if (input.value && !input.value.includes(',')) {
        input.value = parseFloat(input.value).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    });
  });
  
  // Campos de telefone
  document.querySelectorAll('input[data-format="phone"], input.phone-input, input[type="tel"]').forEach(input => {
    input.addEventListener('input', () => formatPhoneInput(input));
  });
  
  // Campos de CPF/CNPJ
  document.querySelectorAll('input[data-format="document"], input.document-input').forEach(input => {
    input.addEventListener('input', () => formatDocumentInput(input));
  });
  
  // Campos de porcentagem
  document.querySelectorAll('input[data-format="percent"], input.percent-input').forEach(input => {
    input.addEventListener('input', () => formatPercentInput(input));
  });
  
  console.log('✅ Formatação automática inicializada');
}

/**
 * Aplica formatação em um campo específico por ID
 * @param {string} inputId - ID do campo
 * @param {string} formatType - Tipo de formatação (currency, phone, document, percent)
 */
function applyFormatting(inputId, formatType) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const formatters = {
    'currency': formatCurrencyInput,
    'phone': formatPhoneInput,
    'document': formatDocumentInput,
    'cpf': formatCPFInput,
    'cnpj': formatCNPJInput,
    'percent': formatPercentInput,
    'number': formatNumberInput
  };
  
  const formatter = formatters[formatType];
  if (formatter) {
    input.addEventListener('input', () => formatter(input));
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um pouco para garantir que todos os elementos foram renderizados
  setTimeout(initAutoFormatting, 500);
});

// Expor funções globalmente
window.formatCurrencyInput = formatCurrencyInput;
window.formatPhoneInput = formatPhoneInput;
window.formatDocumentInput = formatDocumentInput;
window.formatCPFInput = formatCPFInput;
window.formatCNPJInput = formatCNPJInput;
window.formatPercentInput = formatPercentInput;
window.formatNumberInput = formatNumberInput;
window.parseCurrency = parseCurrency;
window.parsePhone = parsePhone;
window.parseDocument = parseDocument;
window.initAutoFormatting = initAutoFormatting;
window.applyFormatting = applyFormatting;
