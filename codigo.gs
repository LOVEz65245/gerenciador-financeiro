/**
 * ============================================
 * GERENCIADOR FINANCEIRO PRO - GOOGLE APPS SCRIPT
 * Versão 4.0.0
 * ============================================
 * 
 * Este script deve ser adicionado ao Google Sheets para:
 * 1. Criar automaticamente a estrutura de abas necessárias
 * 2. Validar e formatar dados
 * 3. Criar menus personalizados
 * 4. Permitir sincronização bidirecional com o app web
 * 
 * INSTRUÇÕES DE USO:
 * 1. Abra sua planilha do Google Sheets
 * 2. Vá em Extensões > Apps Script
 * 3. Cole este código no editor
 * 4. Salve e execute a função 'onOpen' ou 'criarEstrutura'
 * 5. Autorize as permissões necessárias
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

const CONFIG = {
  // Nome das abas
  SHEETS: {
    TRANSACOES: 'Transações',
    CONTAS: 'Contas',
    CATEGORIAS: 'Categorias',
    VENDAS: 'Vendas',
    CLIENTES: 'Clientes',
    PRODUTOS: 'Produtos',
    DEVEDORES: 'Devedores',
    ORCAMENTOS: 'Orçamentos',
    INVESTIMENTOS: 'Investimentos',
    DIVIDAS: 'Dívidas',
    METAS: 'Metas',
    PERFIS: 'Perfis',
    LOGS: 'Logs',
    CONFIGURACOES: 'Configurações',
    DASHBOARD: 'Dashboard'
  },
  
  // Cores para formatação
  COLORS: {
    HEADER_BG: '#3B82F6',
    HEADER_TEXT: '#FFFFFF',
    INCOME: '#10B981',
    EXPENSE: '#EF4444',
    PENDING: '#F59E0B',
    ALTERNATING_ROW: '#F3F4F6'
  }
};

// ============================================
// ESTRUTURA DAS ABAS
// ============================================

const SHEET_STRUCTURES = {
  [CONFIG.SHEETS.TRANSACOES]: {
    headers: ['ID', 'BusinessID', 'Tipo', 'Valor', 'Descrição', 'Data', 'CategoriaID', 'ContaID', 'Status', 'Recorrente', 'Tags', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 80, 100, 200, 100, 150, 150, 80, 80, 150, 150, 150],
    validations: {
      'C': ['receita', 'despesa', 'transferencia'],
      'I': ['pago', 'pendente', 'cancelado', 'agendado']
    }
  },
  [CONFIG.SHEETS.CONTAS]: {
    headers: ['ID', 'BusinessID', 'Nome', 'Tipo', 'Cor', 'Ícone', 'Saldo', 'SaldoInicial', 'Ativo', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 100, 80, 50, 100, 100, 60, 150, 150],
    validations: {
      'D': ['banco', 'carteira', 'investimento', 'cartao_credito', 'poupanca', 'outro'],
      'I': ['TRUE', 'FALSE']
    }
  },
  [CONFIG.SHEETS.CATEGORIAS]: {
    headers: ['ID', 'BusinessID', 'Nome', 'Ícone', 'Cor', 'Tipo', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 50, 80, 80, 150, 150],
    validations: {
      'F': ['receita', 'despesa']
    }
  },
  [CONFIG.SHEETS.VENDAS]: {
    headers: ['ID', 'BusinessID', 'ClienteID', 'Produtos', 'Total', 'Pago', 'Status', 'Data', 'Vencimento', 'Pagamentos', 'Notas', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 200, 100, 100, 80, 100, 100, 200, 200, 150, 150],
    validations: {
      'G': ['pendente', 'parcial', 'pago', 'cancelado', 'vencido']
    }
  },
  [CONFIG.SHEETS.CLIENTES]: {
    headers: ['ID', 'BusinessID', 'Nome', 'Email', 'Telefone', 'Endereço', 'TotalCompras', 'TotalGasto', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 200, 120, 250, 100, 100, 150, 150]
  },
  [CONFIG.SHEETS.PRODUTOS]: {
    headers: ['ID', 'BusinessID', 'Nome', 'Descrição', 'Preço', 'Custo', 'Estoque', 'Categoria', 'Ativo', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 200, 100, 100, 80, 100, 60, 150, 150],
    validations: {
      'I': ['TRUE', 'FALSE']
    }
  },
  [CONFIG.SHEETS.DEVEDORES]: {
    headers: ['ID', 'BusinessID', 'Nome', 'Telefone', 'Email', 'Total', 'Pago', 'Status', 'Vencimento', 'Pagamentos', 'Notas', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 120, 200, 100, 100, 100, 100, 200, 200, 150, 150],
    validations: {
      'H': ['ativo', 'parcial', 'quitado', 'vencido', 'negociando', 'inadimplente']
    }
  },
  [CONFIG.SHEETS.ORCAMENTOS]: {
    headers: ['ID', 'BusinessID', 'CategoriaID', 'Valor', 'MêsAno', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 100, 100, 150, 150]
  },
  [CONFIG.SHEETS.INVESTIMENTOS]: {
    headers: ['ID', 'BusinessID', 'Nome', 'Tipo', 'ValorInicial', 'ValorAtual', 'DataCompra', 'Notas', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 100, 100, 100, 100, 200, 150, 150],
    validations: {
      'D': ['renda_fixa', 'renda_variavel', 'acoes', 'fundo', 'cripto', 'imoveis']
    }
  },
  [CONFIG.SHEETS.DIVIDAS]: {
    headers: ['ID', 'BusinessID', 'Nome', 'Tipo', 'ValorTotal', 'ValorPago', 'Juros', 'Parcelas', 'ParcelasPagas', 'DataInicio', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 100, 100, 100, 80, 80, 100, 100, 150, 150],
    validations: {
      'D': ['emprestimo', 'cartao_credito', 'financiamento', 'pessoal', 'outro']
    }
  },
  [CONFIG.SHEETS.METAS]: {
    headers: ['ID', 'BusinessID', 'Nome', 'ValorMeta', 'ValorAtual', 'DataLimite', 'Categoria', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 150, 100, 100, 100, 100, 150, 150]
  },
  [CONFIG.SHEETS.PERFIS]: {
    headers: ['ID', 'Nome', 'Descrição', 'Tipo', 'Ativo', 'CriadoEm', 'AtualizadoEm'],
    columnWidths: [150, 150, 200, 100, 60, 150, 150],
    validations: {
      'D': ['pessoal', 'empresa', 'freelance', 'investimento'],
      'E': ['TRUE', 'FALSE']
    }
  },
  [CONFIG.SHEETS.LOGS]: {
    headers: ['ID', 'UserID', 'Username', 'Ação', 'Descrição', 'Detalhes', 'Timestamp'],
    columnWidths: [150, 150, 100, 100, 200, 300, 150]
  },
  [CONFIG.SHEETS.CONFIGURACOES]: {
    headers: ['Chave', 'Valor', 'Descrição', 'AtualizadoEm'],
    columnWidths: [150, 200, 300, 150]
  }
};

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Função executada ao abrir a planilha
 * Cria o menu personalizado
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💰 Gerenciador Financeiro')
    .addItem('📋 Criar/Verificar Estrutura', 'criarEstrutura')
    .addItem('🔄 Atualizar Dashboard', 'atualizarDashboard')
    .addSeparator()
    .addItem('📊 Gerar Relatório Mensal', 'gerarRelatorioMensal')
    .addItem('📈 Calcular Totais', 'calcularTotais')
    .addSeparator()
    .addItem('🗑️ Limpar Dados de Exemplo', 'limparDadosExemplo')
    .addItem('ℹ️ Sobre', 'mostrarSobre')
    .addToUi();
}

/**
 * Cria ou verifica a estrutura completa da planilha
 */
function criarEstrutura() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Confirmar ação
  const response = ui.alert(
    'Criar/Verificar Estrutura',
    'Esta ação irá criar as abas necessárias (se não existirem) e formatar os cabeçalhos. Deseja continuar?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  let abasCriadas = 0;
  let abasAtualizadas = 0;
  
  // Criar cada aba
  for (const [sheetName, structure] of Object.entries(SHEET_STRUCTURES)) {
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      // Criar nova aba
      sheet = ss.insertSheet(sheetName);
      abasCriadas++;
    } else {
      abasAtualizadas++;
    }
    
    // Configurar a aba
    configurarAba(sheet, structure);
  }
  
  // Criar aba Dashboard se não existir
  criarDashboard(ss);
  
  // Organizar abas
  organizarAbas(ss);
  
  ui.alert(
    'Estrutura Criada',
    `✅ Processo concluído!\n\n` +
    `📋 Abas criadas: ${abasCriadas}\n` +
    `🔄 Abas atualizadas: ${abasAtualizadas}\n\n` +
    `A planilha está pronta para uso com o Gerenciador Financeiro Pro.`,
    ui.ButtonSet.OK
  );
}

/**
 * Configura uma aba específica
 */
function configurarAba(sheet, structure) {
  const { headers, columnWidths, validations } = structure;
  
  // Definir cabeçalhos
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // Formatar cabeçalhos
  headerRange
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  // Definir largura das colunas
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  // Congelar primeira linha
  sheet.setFrozenRows(1);
  
  // Adicionar validações de dados
  if (validations) {
    for (const [column, values] of Object.entries(validations)) {
      const columnIndex = column.charCodeAt(0) - 64; // Converter letra para número
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(values, true)
        .setAllowInvalid(false)
        .build();
      
      // Aplicar validação para as próximas 1000 linhas
      const validationRange = sheet.getRange(2, columnIndex, 1000, 1);
      validationRange.setDataValidation(rule);
    }
  }
  
  // Formatar coluna de valores monetários
  formatarColunasMoeda(sheet, headers);
  
  // Adicionar formatação condicional para tipos
  adicionarFormatacaoCondicional(sheet, headers);
}

/**
 * Formata colunas que contêm valores monetários
 */
function formatarColunasMoeda(sheet, headers) {
  const colunasMonetarias = ['Valor', 'Saldo', 'SaldoInicial', 'Total', 'Pago', 'Preço', 'Custo', 
                            'ValorInicial', 'ValorAtual', 'ValorTotal', 'ValorPago', 'ValorMeta', 'TotalGasto'];
  
  headers.forEach((header, index) => {
    if (colunasMonetarias.includes(header)) {
      const range = sheet.getRange(2, index + 1, 1000, 1);
      range.setNumberFormat('R$ #,##0.00');
    }
  });
}

/**
 * Adiciona formatação condicional
 */
function adicionarFormatacaoCondicional(sheet, headers) {
  const tipoIndex = headers.indexOf('Tipo');
  const statusIndex = headers.indexOf('Status');
  
  // Formatação para tipo de transação
  if (tipoIndex !== -1) {
    const tipoRange = sheet.getRange(2, tipoIndex + 1, 1000, 1);
    
    // Receita = Verde
    const receitaRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('receita')
      .setFontColor(CONFIG.COLORS.INCOME)
      .setRanges([tipoRange])
      .build();
    
    // Despesa = Vermelho
    const despesaRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('despesa')
      .setFontColor(CONFIG.COLORS.EXPENSE)
      .setRanges([tipoRange])
      .build();
    
    const rules = sheet.getConditionalFormatRules();
    rules.push(receitaRule, despesaRule);
    sheet.setConditionalFormatRules(rules);
  }
  
  // Formatação para status
  if (statusIndex !== -1) {
    const statusRange = sheet.getRange(2, statusIndex + 1, 1000, 1);
    
    // Pago = Verde
    const pagoRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('pago')
      .setFontColor(CONFIG.COLORS.INCOME)
      .setRanges([statusRange])
      .build();
    
    // Pendente = Amarelo
    const pendenteRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('pendente')
      .setFontColor(CONFIG.COLORS.PENDING)
      .setRanges([statusRange])
      .build();
    
    // Vencido = Vermelho
    const vencidoRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('vencido')
      .setFontColor(CONFIG.COLORS.EXPENSE)
      .setRanges([statusRange])
      .build();
    
    const rules = sheet.getConditionalFormatRules();
    rules.push(pagoRule, pendenteRule, vencidoRule);
    sheet.setConditionalFormatRules(rules);
  }
}

/**
 * Cria a aba Dashboard com resumo
 */
function criarDashboard(ss) {
  let dashboard = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  
  if (!dashboard) {
    dashboard = ss.insertSheet(CONFIG.SHEETS.DASHBOARD);
  }
  
  // Limpar conteúdo existente
  dashboard.clear();
  
  // Título
  dashboard.getRange('A1').setValue('📊 DASHBOARD - GERENCIADOR FINANCEIRO PRO');
  dashboard.getRange('A1:F1').merge()
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontSize(16)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // Data de atualização
  dashboard.getRange('A2').setValue('Última atualização: ' + new Date().toLocaleString('pt-BR'));
  dashboard.getRange('A2:F2').merge()
    .setFontStyle('italic')
    .setHorizontalAlignment('center');
  
  // Resumo Financeiro
  dashboard.getRange('A4').setValue('💰 RESUMO FINANCEIRO');
  dashboard.getRange('A4:B4').merge().setFontWeight('bold').setFontSize(12);
  
  const resumoLabels = [
    ['Total de Receitas:', '=SUMIF(Transações!C:C,"receita",Transações!D:D)'],
    ['Total de Despesas:', '=SUMIF(Transações!C:C,"despesa",Transações!D:D)'],
    ['Saldo:', '=B5-B6'],
    ['', ''],
    ['Total em Contas:', '=SUM(Contas!G:G)'],
    ['Total em Investimentos:', '=SUM(Investimentos!F:F)'],
    ['Total em Dívidas:', '=SUM(Dívidas!E:E)-SUM(Dívidas!F:F)'],
    ['Patrimônio Líquido:', '=B9+B10-B11']
  ];
  
  dashboard.getRange('A5:B12').setValues(resumoLabels);
  dashboard.getRange('B5:B12').setNumberFormat('R$ #,##0.00');
  
  // Formatação do saldo
  dashboard.getRange('B7').setFontWeight('bold');
  dashboard.getRange('B12').setFontWeight('bold').setFontSize(14);
  
  // Resumo de Vendas
  dashboard.getRange('D4').setValue('🛒 RESUMO DE VENDAS');
  dashboard.getRange('D4:E4').merge().setFontWeight('bold').setFontSize(12);
  
  const vendasLabels = [
    ['Total de Vendas:', '=SUM(Vendas!E:E)'],
    ['Valor Recebido:', '=SUM(Vendas!F:F)'],
    ['A Receber:', '=D5-D6'],
    ['', ''],
    ['Vendas Pendentes:', '=COUNTIF(Vendas!G:G,"pendente")'],
    ['Vendas Pagas:', '=COUNTIF(Vendas!G:G,"pago")'],
    ['Vendas Vencidas:', '=COUNTIF(Vendas!G:G,"vencido")']
  ];
  
  dashboard.getRange('D5:E11').setValues(vendasLabels);
  dashboard.getRange('E5:E7').setNumberFormat('R$ #,##0.00');
  
  // Resumo de Devedores
  dashboard.getRange('A14').setValue('👤 RESUMO DE DEVEDORES');
  dashboard.getRange('A14:B14').merge().setFontWeight('bold').setFontSize(12);
  
  const devedoresLabels = [
    ['Total a Receber:', '=SUM(Devedores!F:F)-SUM(Devedores!G:G)'],
    ['Devedores Ativos:', '=COUNTIF(Devedores!H:H,"ativo")'],
    ['Devedores Vencidos:', '=COUNTIF(Devedores!H:H,"vencido")'],
    ['Devedores Quitados:', '=COUNTIF(Devedores!H:H,"quitado")']
  ];
  
  dashboard.getRange('A15:B18').setValues(devedoresLabels);
  dashboard.getRange('B15').setNumberFormat('R$ #,##0.00');
  
  // Resumo de Metas
  dashboard.getRange('D14').setValue('🎯 RESUMO DE METAS');
  dashboard.getRange('D14:E14').merge().setFontWeight('bold').setFontSize(12);
  
  const metasLabels = [
    ['Total de Metas:', '=COUNTA(Metas!A:A)-1'],
    ['Valor Total das Metas:', '=SUM(Metas!D:D)'],
    ['Valor Atual:', '=SUM(Metas!E:E)'],
    ['Progresso Médio:', '=IFERROR(AVERAGE(Metas!E:E)/AVERAGE(Metas!D:D)*100,0)']
  ];
  
  dashboard.getRange('D15:E18').setValues(metasLabels);
  dashboard.getRange('E16:E17').setNumberFormat('R$ #,##0.00');
  dashboard.getRange('E18').setNumberFormat('0.0%');
  
  // Ajustar largura das colunas
  dashboard.setColumnWidth(1, 180);
  dashboard.setColumnWidth(2, 150);
  dashboard.setColumnWidth(3, 30);
  dashboard.setColumnWidth(4, 180);
  dashboard.setColumnWidth(5, 150);
  
  // Adicionar bordas
  dashboard.getRange('A4:B12').setBorder(true, true, true, true, true, true);
  dashboard.getRange('D4:E11').setBorder(true, true, true, true, true, true);
  dashboard.getRange('A14:B18').setBorder(true, true, true, true, true, true);
  dashboard.getRange('D14:E18').setBorder(true, true, true, true, true, true);
}

/**
 * Atualiza o Dashboard
 */
function atualizarDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  criarDashboard(ss);
  
  SpreadsheetApp.getUi().alert(
    'Dashboard Atualizado',
    '✅ O Dashboard foi atualizado com os dados mais recentes.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Organiza as abas na ordem correta
 */
function organizarAbas(ss) {
  const ordemAbas = [
    CONFIG.SHEETS.DASHBOARD,
    CONFIG.SHEETS.TRANSACOES,
    CONFIG.SHEETS.CONTAS,
    CONFIG.SHEETS.CATEGORIAS,
    CONFIG.SHEETS.VENDAS,
    CONFIG.SHEETS.CLIENTES,
    CONFIG.SHEETS.PRODUTOS,
    CONFIG.SHEETS.DEVEDORES,
    CONFIG.SHEETS.ORCAMENTOS,
    CONFIG.SHEETS.INVESTIMENTOS,
    CONFIG.SHEETS.DIVIDAS,
    CONFIG.SHEETS.METAS,
    CONFIG.SHEETS.PERFIS,
    CONFIG.SHEETS.LOGS,
    CONFIG.SHEETS.CONFIGURACOES
  ];
  
  ordemAbas.forEach((nome, index) => {
    const sheet = ss.getSheetByName(nome);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(index + 1);
    }
  });
  
  // Ativar Dashboard
  const dashboard = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (dashboard) {
    ss.setActiveSheet(dashboard);
  }
}

/**
 * Gera relatório mensal
 */
function gerarRelatorioMensal() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Solicitar mês/ano
  const response = ui.prompt(
    'Gerar Relatório Mensal',
    'Digite o mês e ano (formato: MM/YYYY):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  const mesAno = response.getResponseText();
  const [mes, ano] = mesAno.split('/');
  
  if (!mes || !ano || mes < 1 || mes > 12) {
    ui.alert('Erro', 'Formato inválido. Use MM/YYYY (ex: 01/2024)', ui.ButtonSet.OK);
    return;
  }
  
  // Criar ou obter aba de relatório
  const nomeRelatorio = `Relatório ${mes}-${ano}`;
  let relatorio = ss.getSheetByName(nomeRelatorio);
  
  if (!relatorio) {
    relatorio = ss.insertSheet(nomeRelatorio);
  } else {
    relatorio.clear();
  }
  
  // Título
  relatorio.getRange('A1').setValue(`📊 RELATÓRIO FINANCEIRO - ${mes}/${ano}`);
  relatorio.getRange('A1:E1').merge()
    .setBackground(CONFIG.COLORS.HEADER_BG)
    .setFontColor(CONFIG.COLORS.HEADER_TEXT)
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // Buscar transações do mês
  const transacoes = ss.getSheetByName(CONFIG.SHEETS.TRANSACOES);
  if (!transacoes) {
    ui.alert('Erro', 'Aba de Transações não encontrada.', ui.ButtonSet.OK);
    return;
  }
  
  const dados = transacoes.getDataRange().getValues();
  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0);
  
  let totalReceitas = 0;
  let totalDespesas = 0;
  const transacoesMes = [];
  
  for (let i = 1; i < dados.length; i++) {
    const row = dados[i];
    const data = new Date(row[5]); // Coluna Data
    
    if (data >= dataInicio && data <= dataFim) {
      transacoesMes.push(row);
      const valor = parseFloat(row[3]) || 0; // Coluna Valor
      
      if (row[2] === 'receita') {
        totalReceitas += valor;
      } else if (row[2] === 'despesa') {
        totalDespesas += valor;
      }
    }
  }
  
  // Resumo
  relatorio.getRange('A3').setValue('RESUMO');
  relatorio.getRange('A3').setFontWeight('bold');
  
  relatorio.getRange('A4:B7').setValues([
    ['Total de Receitas:', totalReceitas],
    ['Total de Despesas:', totalDespesas],
    ['Saldo do Mês:', totalReceitas - totalDespesas],
    ['Número de Transações:', transacoesMes.length]
  ]);
  
  relatorio.getRange('B4:B6').setNumberFormat('R$ #,##0.00');
  relatorio.getRange('B6').setFontWeight('bold');
  
  // Lista de transações
  relatorio.getRange('A9').setValue('TRANSAÇÕES DO MÊS');
  relatorio.getRange('A9').setFontWeight('bold');
  
  if (transacoesMes.length > 0) {
    const headers = ['Data', 'Descrição', 'Tipo', 'Valor', 'Status'];
    relatorio.getRange('A10:E10').setValues([headers])
      .setBackground(CONFIG.COLORS.HEADER_BG)
      .setFontColor(CONFIG.COLORS.HEADER_TEXT)
      .setFontWeight('bold');
    
    const transacoesFormatadas = transacoesMes.map(t => [
      t[5], // Data
      t[4], // Descrição
      t[2], // Tipo
      t[3], // Valor
      t[8]  // Status
    ]);
    
    relatorio.getRange(11, 1, transacoesFormatadas.length, 5).setValues(transacoesFormatadas);
    relatorio.getRange(11, 4, transacoesFormatadas.length, 1).setNumberFormat('R$ #,##0.00');
  }
  
  // Ajustar colunas
  relatorio.autoResizeColumns(1, 5);
  
  ui.alert(
    'Relatório Gerado',
    `✅ Relatório de ${mes}/${ano} gerado com sucesso!\n\n` +
    `Receitas: R$ ${totalReceitas.toFixed(2)}\n` +
    `Despesas: R$ ${totalDespesas.toFixed(2)}\n` +
    `Saldo: R$ ${(totalReceitas - totalDespesas).toFixed(2)}`,
    ui.ButtonSet.OK
  );
}

/**
 * Calcula e exibe totais
 */
function calcularTotais() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Transações
  const transacoes = ss.getSheetByName(CONFIG.SHEETS.TRANSACOES);
  let totalReceitas = 0;
  let totalDespesas = 0;
  
  if (transacoes) {
    const dados = transacoes.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
      const valor = parseFloat(dados[i][3]) || 0;
      if (dados[i][2] === 'receita') {
        totalReceitas += valor;
      } else if (dados[i][2] === 'despesa') {
        totalDespesas += valor;
      }
    }
  }
  
  // Contas
  const contas = ss.getSheetByName(CONFIG.SHEETS.CONTAS);
  let totalContas = 0;
  if (contas) {
    const dados = contas.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
      totalContas += parseFloat(dados[i][6]) || 0;
    }
  }
  
  // Investimentos
  const investimentos = ss.getSheetByName(CONFIG.SHEETS.INVESTIMENTOS);
  let totalInvestimentos = 0;
  if (investimentos) {
    const dados = investimentos.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
      totalInvestimentos += parseFloat(dados[i][5]) || 0;
    }
  }
  
  // Dívidas
  const dividas = ss.getSheetByName(CONFIG.SHEETS.DIVIDAS);
  let totalDividas = 0;
  if (dividas) {
    const dados = dividas.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
      totalDividas += (parseFloat(dados[i][4]) || 0) - (parseFloat(dados[i][5]) || 0);
    }
  }
  
  // Devedores
  const devedores = ss.getSheetByName(CONFIG.SHEETS.DEVEDORES);
  let totalAReceber = 0;
  if (devedores) {
    const dados = devedores.getDataRange().getValues();
    for (let i = 1; i < dados.length; i++) {
      totalAReceber += (parseFloat(dados[i][5]) || 0) - (parseFloat(dados[i][6]) || 0);
    }
  }
  
  const patrimonio = totalContas + totalInvestimentos - totalDividas;
  
  ui.alert(
    '📊 Totais Calculados',
    `💰 TRANSAÇÕES\n` +
    `   Receitas: R$ ${totalReceitas.toFixed(2)}\n` +
    `   Despesas: R$ ${totalDespesas.toFixed(2)}\n` +
    `   Saldo: R$ ${(totalReceitas - totalDespesas).toFixed(2)}\n\n` +
    `🏦 PATRIMÔNIO\n` +
    `   Contas: R$ ${totalContas.toFixed(2)}\n` +
    `   Investimentos: R$ ${totalInvestimentos.toFixed(2)}\n` +
    `   Dívidas: R$ ${totalDividas.toFixed(2)}\n` +
    `   Patrimônio Líquido: R$ ${patrimonio.toFixed(2)}\n\n` +
    `👤 RECEBÍVEIS\n` +
    `   A Receber de Devedores: R$ ${totalAReceber.toFixed(2)}`,
    ui.ButtonSet.OK
  );
}

/**
 * Limpa dados de exemplo
 */
function limparDadosExemplo() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const response = ui.alert(
    '⚠️ Limpar Dados',
    'Esta ação irá remover TODOS os dados das abas (mantendo os cabeçalhos). Deseja continuar?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  // Confirmar novamente
  const confirm = ui.alert(
    '⚠️ Confirmação Final',
    'Tem certeza? Esta ação NÃO pode ser desfeita!',
    ui.ButtonSet.YES_NO
  );
  
  if (confirm !== ui.Button.YES) {
    return;
  }
  
  // Limpar cada aba
  for (const sheetName of Object.values(CONFIG.SHEETS)) {
    if (sheetName === CONFIG.SHEETS.DASHBOARD) continue;
    
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      const frozenRows = sheet.getFrozenRows();
      const startRow = Math.max(frozenRows, 1) + 1;
      
      if (lastRow >= startRow) {
        // Usar clearContent em vez de deleteRows para evitar erro de linhas congeladas
        const numCols = sheet.getLastColumn() || 1;
        sheet.getRange(startRow, 1, lastRow - startRow + 1, numCols).clearContent();
      }
    }
  }
  
  // Atualizar Dashboard
  criarDashboard(ss);
  
  ui.alert(
    'Dados Limpos',
    '✅ Todos os dados foram removidos. A estrutura foi mantida.',
    ui.ButtonSet.OK
  );
}

/**
 * Mostra informações sobre o script
 */
function mostrarSobre() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert(
    '💰 Gerenciador Financeiro Pro',
    'Versão: 4.0.0\n\n' +
    'Este script complementa o aplicativo web Gerenciador Financeiro Pro, ' +
    'permitindo sincronização bidirecional com o Google Sheets.\n\n' +
    'Funcionalidades:\n' +
    '• Criação automática de estrutura\n' +
    '• Dashboard com resumo financeiro\n' +
    '• Relatórios mensais\n' +
    '• Validação de dados\n' +
    '• Formatação automática\n\n' +
    'Para usar com o app web, configure o ID desta planilha nas configurações do aplicativo.',
    ui.ButtonSet.OK
  );
}

// ============================================
// FUNÇÕES DE API (para uso com Web App)
// ============================================

/**
 * Função doGet para API REST
 * Permite que o app web leia dados da planilha
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action;
  const sheetName = e.parameter.sheet;
  const callback = e.parameter.callback; // Para suporte JSONP
  
  let result = { success: false, data: null, error: null };
  
  try {
    switch (action) {
      case 'getData':
        const sheet = ss.getSheetByName(sheetName);
        if (sheet) {
          const data = sheet.getDataRange().getValues();
          result = { success: true, data: data };
        } else {
          result.error = 'Aba não encontrada';
        }
        break;
        
      case 'getStructure':
        result = { success: true, data: Object.keys(SHEET_STRUCTURES) };
        break;
        
      case 'ping':
        result = { success: true, data: 'pong', timestamp: new Date().toISOString() };
        break;
        
      default:
        result.error = 'Ação não reconhecida';
    }
  } catch (error) {
    result.error = error.toString();
  }
  
  const jsonOutput = JSON.stringify(result);
  
  // Se callback foi fornecido, retornar como JSONP
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + jsonOutput + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // Retornar JSON normal
  return ContentService.createTextOutput(jsonOutput)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Função doPost para API REST
 * Permite que o app web escreva dados na planilha
 */
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  let result = { success: false, error: null };
  
  try {
    switch (action) {
      case 'appendData':
        const sheet = ss.getSheetByName(data.sheet);
        if (sheet) {
          sheet.appendRow(data.row);
          result.success = true;
        } else {
          result.error = 'Aba não encontrada';
        }
        break;
        
      case 'updateData':
        const updateSheet = ss.getSheetByName(data.sheet);
        if (updateSheet) {
          updateSheet.getRange(data.range).setValues(data.values);
          result.success = true;
        } else {
          result.error = 'Aba não encontrada';
        }
        break;
        
      case 'clearData':
        const clearSheet = ss.getSheetByName(data.sheet);
        if (clearSheet) {
          const lastRow = clearSheet.getLastRow();
          const frozenRows = clearSheet.getFrozenRows();
          // Verificar se há linhas de dados para excluir (além do cabeçalho congelado)
          if (lastRow > frozenRows && lastRow > 1) {
            // Limpar conteúdo em vez de excluir linhas para evitar erro
            const numRowsToDelete = lastRow - Math.max(frozenRows, 1);
            if (numRowsToDelete > 0) {
              clearSheet.getRange(Math.max(frozenRows, 1) + 1, 1, numRowsToDelete, clearSheet.getLastColumn()).clearContent();
            }
          }
          result.success = true;
        } else {
          result.error = 'Aba não encontrada';
        }
        break;
        
      case 'syncAll':
        // Sincronização completa
        for (const [sheetName, rows] of Object.entries(data.data)) {
          const syncSheet = ss.getSheetByName(sheetName);
          if (syncSheet && rows.length > 0) {
            // Limpar dados existentes (usando clearContent para evitar erro de linhas congeladas)
            const lastRow = syncSheet.getLastRow();
            const frozenRows = syncSheet.getFrozenRows();
            const startRow = Math.max(frozenRows, 1) + 1;
            
            if (lastRow >= startRow) {
              // Limpar conteúdo das linhas de dados existentes
              const numCols = syncSheet.getLastColumn() || rows[0].length;
              syncSheet.getRange(startRow, 1, lastRow - startRow + 1, numCols).clearContent();
            }
            
            // Adicionar novos dados a partir da linha após o cabeçalho
            syncSheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
          }
        }
        result.success = true;
        break;
        
      default:
        result.error = 'Ação não reconhecida';
    }
  } catch (error) {
    result.error = error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// TRIGGERS AUTOMÁTICOS
// ============================================

/**
 * Trigger para atualizar Dashboard automaticamente
 * Configure em Gatilhos > Adicionar gatilho
 */
function triggerAtualizarDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  criarDashboard(ss);
}

/**
 * Trigger para backup automático
 * Cria uma cópia da planilha periodicamente
 */
function triggerBackup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataAtual = new Date().toISOString().split('T')[0];
  const nomeBackup = `Backup - ${ss.getName()} - ${dataAtual}`;
  
  // Criar cópia na mesma pasta
  const arquivo = DriveApp.getFileById(ss.getId());
  const pasta = arquivo.getParents().next();
  arquivo.makeCopy(nomeBackup, pasta);
  
  Logger.log(`Backup criado: ${nomeBackup}`);
}
