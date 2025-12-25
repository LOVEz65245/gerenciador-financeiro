// ============================================
// GERENCIADOR DE INTERFACE DO USUÁRIO
// ============================================

// Sistema de Notificações Toast
class Toast {
  static container = null;

  static init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  static show(message, type = 'info', duration = 3000) {
    this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${sanitizeString(message)}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    this.container.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-remover
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Classe principal de gerenciamento de UI
class UIManager {
  constructor() {
    this.currentView = 'dashboard';
    this.filters = {
      dateStart: null,
      dateEnd: null,
      type: 'all',
      category: 'all',
      account: 'all',
      status: 'all',
      search: ''
    };
    this.editingId = null;
    this.charts = {};
  }

  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.applyTheme();
    this.switchView('dashboard');
    Toast.show('Gerenciador Financeiro carregado!', 'success');
  }

  // ============================================
  // NAVEGAÇÃO
  // ============================================

  setupNavigation() {
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });
  }

  switchView(view) {
    this.currentView = view;
    this.editingId = null;
    
    // Atualizar botões de navegação
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Esconder todas as views
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.remove('active');
    });

    // Converter kebab-case para camelCase para o ID da view
    const viewId = view.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    
    // Mostrar view selecionada
    const viewElement = document.getElementById(`${viewId}View`);
    if (viewElement) {
      viewElement.classList.add('active');
    }

    // Atualizar título
    const titles = {
      'dashboard': '📊 Dashboard',
      'transactions': '💳 Transações',
      'accounts': '🏦 Contas',
      'categories': '🏷️ Categorias',
      'sales': '🛒 Vendas',
      'customers': '👥 Clientes',
      'products': '📦 Produtos',
      'debtors': '👤 Devedores',
      'budgets': '📋 Orçamentos',
      'investments': '📈 Investimentos',
      'debts': '💳 Dívidas',
      'goals': '🎯 Metas',
      'reports': '📑 Relatórios',
      'activity-logs': '📋 Logs de Atividade',
      'import-export': '📤 Importar/Exportar',
      'google-sheets': '📊 Google Sheets',
      'settings': '⚙️ Configurações'
    };
    
    document.getElementById('pageTitle').textContent = titles[view] || 'Dashboard';
    this.renderView(view);
  }

  renderView(view) {
    const renderMethods = {
      'dashboard': () => this.renderDashboard(),
      'transactions': () => this.renderTransactions(),
      'accounts': () => this.renderAccounts(),
      'categories': () => this.renderCategories(),
      'sales': () => this.renderSales(),
      'customers': () => this.renderCustomers(),
      'products': () => this.renderProducts(),
      'debtors': () => this.renderDebtors(),
      'budgets': () => this.renderBudgets(),
      'investments': () => this.renderInvestments(),
      'debts': () => this.renderDebts(),
      'goals': () => this.renderGoals(),
      'reports': () => this.renderReports(),
      'activity-logs': () => this.renderActivityLogs(),
      'import-export': () => this.renderImportExport(),
      'google-sheets': () => this.renderGoogleSheets(),
      'settings': () => this.renderSettings()
    };

    if (renderMethods[view]) {
      renderMethods[view]();
    }
  }

  // ============================================
  // DASHBOARD
  // ============================================

  renderDashboard() {
    const businessId = financeManager.currentBusinessId;
    const summary = financeManager.getFinancialSummary(businessId);
    const trends = financeManager.getMonthlyTrend(businessId, 6);
    const recentTransactions = financeManager.getTransactionsByBusiness(businessId).slice(0, 5);
    const budgetProgress = financeManager.getBudgetProgress(businessId, getCurrentMonthYear());

    const html = `
      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-icon income-bg">💰</div>
          <div class="stat-info">
            <h3>Receitas do Mês</h3>
            <p class="amount income">${formatCurrency(summary.totalIncome)}</p>
            ${summary.pendingIncome > 0 ? `<small class="pending">+ ${formatCurrency(summary.pendingIncome)} pendente</small>` : ''}
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon expense-bg">💸</div>
          <div class="stat-info">
            <h3>Despesas do Mês</h3>
            <p class="amount expense">${formatCurrency(summary.totalExpense)}</p>
            ${summary.pendingExpense > 0 ? `<small class="pending">+ ${formatCurrency(summary.pendingExpense)} pendente</small>` : ''}
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon ${summary.netIncome >= 0 ? 'income-bg' : 'expense-bg'}">📊</div>
          <div class="stat-info">
            <h3>Saldo do Mês</h3>
            <p class="amount ${summary.netIncome >= 0 ? 'income' : 'expense'}">${formatCurrency(summary.netIncome)}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon primary-bg">🏦</div>
          <div class="stat-info">
            <h3>Saldo Total</h3>
            <p class="amount">${formatCurrency(summary.totalBalance)}</p>
          </div>
        </div>
      </div>

      <div class="dashboard-row">
        <div class="dashboard-section chart-section">
          <h3>📈 Evolução Mensal</h3>
          <canvas id="trendChart"></canvas>
        </div>
        
        <div class="dashboard-section chart-section">
          <h3>🥧 Despesas por Categoria</h3>
          <canvas id="categoryChart"></canvas>
        </div>
      </div>

      <div class="dashboard-row">
        <div class="dashboard-section">
          <div class="section-header">
            <h3>📝 Últimas Transações</h3>
            <button class="btn-link" onclick="uiManager.switchView('transactions')">Ver todas →</button>
          </div>
          ${this.renderTransactionsTable(recentTransactions, true)}
        </div>
        
        <div class="dashboard-section">
          <div class="section-header">
            <h3>📋 Orçamentos do Mês</h3>
            <button class="btn-link" onclick="uiManager.switchView('budgets')">Ver todos →</button>
          </div>
          ${this.renderBudgetProgressList(budgetProgress.slice(0, 4))}
        </div>
      </div>

      <div class="dashboard-row">
        <div class="stat-card wide">
          <div class="stat-icon investment-bg">📈</div>
          <div class="stat-info">
            <h3>Total em Investimentos</h3>
            <p class="amount">${formatCurrency(summary.totalInvestments)}</p>
          </div>
        </div>
        
        <div class="stat-card wide">
          <div class="stat-icon debt-bg">💳</div>
          <div class="stat-info">
            <h3>Total em Dívidas</h3>
            <p class="amount expense">${formatCurrency(summary.totalDebts)}</p>
          </div>
        </div>
        
        <div class="stat-card wide">
          <div class="stat-icon ${summary.netWorth >= 0 ? 'income-bg' : 'expense-bg'}">💎</div>
          <div class="stat-info">
            <h3>Patrimônio Líquido</h3>
            <p class="amount ${summary.netWorth >= 0 ? 'income' : 'expense'}">${formatCurrency(summary.netWorth)}</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('dashboardView').innerHTML = html;
    this.renderDashboardCharts(trends, businessId);
  }

  renderDashboardCharts(trends, businessId) {
    // Gráfico de tendência
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx && typeof Chart !== 'undefined') {
      if (this.charts.trend) this.charts.trend.destroy();
      
      this.charts.trend = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: trends.map(t => t.monthName),
          datasets: [
            {
              label: 'Receitas',
              data: trends.map(t => toReais(t.totalIncome)),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Despesas',
              data: trends.map(t => toReais(t.totalExpense)),
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => formatCurrency(value * 100)
              }
            }
          }
        }
      });
    }

    // Gráfico de categorias
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx && typeof Chart !== 'undefined') {
      if (this.charts.category) this.charts.category.destroy();
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const categoryStats = financeManager.getCategoryStats(businessId, startOfMonth, today)
        .filter(s => s.type === CONFIG.TRANSACTION_TYPES.EXPENSE)
        .slice(0, 6);

      this.charts.category = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: categoryStats.map(s => s.category?.name || 'Outros'),
          datasets: [{
            data: categoryStats.map(s => toReais(s.total)),
            backgroundColor: categoryStats.map(s => s.category?.color || '#64748B'),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                padding: 10
              }
            }
          }
        }
      });
    }
  }

  renderBudgetProgressList(budgets) {
    if (budgets.length === 0) {
      return '<p class="empty-message">Nenhum orçamento definido para este mês</p>';
    }

    return `
      <div class="budget-progress-list">
        ${budgets.map(b => `
          <div class="budget-progress-item">
            <div class="budget-info">
              <span class="budget-category">${b.category?.icon || '📌'} ${b.category?.name || 'Categoria'}</span>
              <span class="budget-values">${formatCurrency(b.spent)} / ${formatCurrency(b.amount)}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${b.isOverBudget ? 'over-budget' : ''}" style="width: ${Math.min(b.percentage, 100)}%"></div>
            </div>
            <span class="budget-percentage ${b.isOverBudget ? 'over-budget' : ''}">${b.percentage.toFixed(0)}%</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ============================================
  // TRANSAÇÕES
  // ============================================

  renderTransactions() {
    const businessId = financeManager.currentBusinessId;
    const accounts = financeManager.getAccountsByBusiness(businessId);
    const categories = financeManager.getCategoriesByBusiness(businessId);
    
    let transactions = financeManager.getTransactionsByBusiness(businessId);
    transactions = this.applyFilters(transactions);

    const html = `
      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Transação' : '➕ Nova Transação'}</h3>
        <form id="transactionForm" class="form-grid">
          <div class="form-group">
            <label for="transDate">Data *</label>
            <input type="date" id="transDate" required value="${getCurrentDate()}">
          </div>
          
          <div class="form-group">
            <label for="transDescription">Descrição *</label>
            <input type="text" id="transDescription" placeholder="Ex: Supermercado" required maxlength="${CONFIG.LIMITS.MAX_DESCRIPTION_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="transAccount">Conta *</label>
            <select id="transAccount" required>
              <option value="">Selecione uma conta</option>
              ${accounts.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="transType">Tipo *</label>
            <select id="transType" required onchange="uiManager.updateCategoryOptions()">
              <option value="despesa">💸 Despesa</option>
              <option value="receita">💰 Receita</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="transCategory">Categoria *</label>
            <select id="transCategory" required>
              <option value="">Selecione uma categoria</option>
              ${categories.filter(c => c.type === 'despesa').map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="transAmount">Valor (R$) *</label>
            <input type="number" id="transAmount" placeholder="0,00" step="0.01" min="0.01" required>
          </div>
          
          <div class="form-group">
            <label for="transStatus">Status</label>
            <select id="transStatus">
              <option value="pago">✅ Pago</option>
              <option value="pendente">⏳ Pendente</option>
              <option value="agendado">📅 Agendado</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="transNotes">Observações</label>
            <input type="text" id="transNotes" placeholder="Notas adicionais">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Adicionar Transação'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="transactions-section">
        <div class="section-header">
          <h3>📋 Transações</h3>
          <div class="filter-toggle">
            <button class="btn-filter" onclick="uiManager.toggleFilters()">🔍 Filtros</button>
          </div>
        </div>
        
        <div id="filtersPanel" class="filters-panel hidden">
          <div class="filters-grid">
            <div class="filter-group">
              <label>Período</label>
              <div class="date-range">
                <input type="date" id="filterDateStart" onchange="uiManager.applyFiltersAndRender()">
                <span>até</span>
                <input type="date" id="filterDateEnd" onchange="uiManager.applyFiltersAndRender()">
              </div>
            </div>
            
            <div class="filter-group">
              <label>Tipo</label>
              <select id="filterType" onchange="uiManager.applyFiltersAndRender()">
                <option value="all">Todos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Categoria</label>
              <select id="filterCategory" onchange="uiManager.applyFiltersAndRender()">
                <option value="all">Todas</option>
                ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
              </select>
            </div>
            
            <div class="filter-group">
              <label>Conta</label>
              <select id="filterAccount" onchange="uiManager.applyFiltersAndRender()">
                <option value="all">Todas</option>
                ${accounts.map(a => `<option value="${a.id}">${a.icon} ${a.name}</option>`).join('')}
              </select>
            </div>
            
            <div class="filter-group">
              <label>Status</label>
              <select id="filterStatus" onchange="uiManager.applyFiltersAndRender()">
                <option value="all">Todos</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="agendado">Agendado</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Buscar</label>
              <input type="text" id="filterSearch" placeholder="Buscar..." oninput="uiManager.applyFiltersAndRender()">
            </div>
          </div>
          
          <button class="btn-clear-filters" onclick="uiManager.clearFilters()">Limpar Filtros</button>
        </div>
        
        ${this.renderTransactionsTable(transactions)}
      </div>
    `;

    document.getElementById('transactionsView').innerHTML = html;
    this.setupFormListeners();
  }

  renderTransactionsTable(transactions, compact = false) {
    if (transactions.length === 0) {
      return '<p class="empty-message">Nenhuma transação encontrada</p>';
    }

    return `
      <div class="table-responsive">
        <table class="data-table transactions-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              ${!compact ? '<th>Conta</th>' : ''}
              <th>Categoria</th>
              <th>Valor</th>
              ${!compact ? '<th>Status</th>' : ''}
              ${!compact ? '<th>Ações</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => {
              const account = financeManager.getAccount(t.accountId);
              const category = financeManager.getCategory(t.categoryId);
              return `
                <tr>
                  <td>${formatDate(t.date)}</td>
                  <td>
                    <span class="transaction-desc">${sanitizeString(t.description)}</span>
                    ${t.notes ? `<small class="transaction-notes">${sanitizeString(t.notes)}</small>` : ''}
                  </td>
                  ${!compact ? `<td><span class="account-badge" style="background-color: ${account?.color}20; color: ${account?.color}">${account?.icon || '🏦'} ${account?.name || '-'}</span></td>` : ''}
                  <td><span class="category-badge" style="background-color: ${category?.color}20; color: ${category?.color}">${category?.icon || '📌'} ${category?.name || '-'}</span></td>
                  <td class="${t.type === 'receita' ? 'income' : 'expense'}">${t.type === 'receita' ? '+' : '-'} ${formatCurrency(t.amount)}</td>
                  ${!compact ? `<td><span class="status-badge status-${t.status}">${t.status}</span></td>` : ''}
                  ${!compact ? `
                    <td class="actions-cell">
                      <button class="btn-icon btn-edit" onclick="uiManager.editTransaction('${t.id}')" title="Editar">✏️</button>
                      <button class="btn-icon btn-delete" onclick="uiManager.deleteTransaction('${t.id}')" title="Excluir">🗑️</button>
                    </td>
                  ` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  updateCategoryOptions() {
    const type = document.getElementById('transType').value;
    const categorySelect = document.getElementById('transCategory');
    const categories = financeManager.getCategoriesByType(financeManager.currentBusinessId, type);
    
    categorySelect.innerHTML = `
      <option value="">Selecione uma categoria</option>
      ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
    `;
  }

  applyFilters(transactions) {
    return transactions.filter(t => {
      if (this.filters.dateStart && new Date(t.date) < new Date(this.filters.dateStart)) return false;
      if (this.filters.dateEnd && new Date(t.date) > new Date(this.filters.dateEnd)) return false;
      if (this.filters.type !== 'all' && t.type !== this.filters.type) return false;
      if (this.filters.category !== 'all' && t.categoryId !== this.filters.category) return false;
      if (this.filters.account !== 'all' && t.accountId !== this.filters.account) return false;
      if (this.filters.status !== 'all' && t.status !== this.filters.status) return false;
      if (this.filters.search && !t.description.toLowerCase().includes(this.filters.search.toLowerCase())) return false;
      return true;
    });
  }

  toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    panel.classList.toggle('hidden');
  }

  applyFiltersAndRender() {
    this.filters.dateStart = document.getElementById('filterDateStart')?.value || null;
    this.filters.dateEnd = document.getElementById('filterDateEnd')?.value || null;
    this.filters.type = document.getElementById('filterType')?.value || 'all';
    this.filters.category = document.getElementById('filterCategory')?.value || 'all';
    this.filters.account = document.getElementById('filterAccount')?.value || 'all';
    this.filters.status = document.getElementById('filterStatus')?.value || 'all';
    this.filters.search = document.getElementById('filterSearch')?.value || '';
    
    this.renderTransactions();
    
    // Manter filtros visíveis
    document.getElementById('filtersPanel')?.classList.remove('hidden');
  }

  clearFilters() {
    this.filters = {
      dateStart: null,
      dateEnd: null,
      type: 'all',
      category: 'all',
      account: 'all',
      status: 'all',
      search: ''
    };
    this.renderTransactions();
  }

  editTransaction(id) {
    const transaction = financeManager.getTransaction(id);
    if (!transaction) return;

    this.editingId = id;
    this.renderTransactions();

    // Preencher formulário
    document.getElementById('transDate').value = transaction.date.split('T')[0];
    document.getElementById('transDescription').value = transaction.description;
    document.getElementById('transAccount').value = transaction.accountId;
    document.getElementById('transType').value = transaction.type;
    this.updateCategoryOptions();
    document.getElementById('transCategory').value = transaction.categoryId;
    document.getElementById('transAmount').value = toReais(transaction.amount);
    document.getElementById('transStatus').value = transaction.status;
    document.getElementById('transNotes').value = transaction.notes || '';

    // Scroll para o formulário
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  }

  async deleteTransaction(id) {
    const confirmed = await Modal.confirmAction(
      'Excluir Transação',
      'Tem certeza que deseja excluir esta transação?',
      { confirmText: 'Excluir', dangerous: true }
    );
    
    if (!confirmed) return;
    
    if (financeManager.deleteTransaction(id)) {
      Toast.show('Transação excluída com sucesso!', 'success');
      this.renderTransactions();
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.renderTransactions();
  }

  // ============================================
  // CONTAS
  // ============================================

  renderAccounts() {
    const businessId = financeManager.currentBusinessId;
    const accounts = financeManager.getAccountsByBusiness(businessId);
    const totalBalance = financeManager.getTotalBalance(businessId);

    const html = `
      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Conta' : '➕ Nova Conta'}</h3>
        <form id="accountForm" class="form-grid">
          <div class="form-group">
            <label for="accName">Nome da Conta *</label>
            <input type="text" id="accName" placeholder="Ex: Banco do Brasil" required maxlength="${CONFIG.LIMITS.MAX_NAME_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="accType">Tipo *</label>
            <select id="accType" required>
              <option value="banco">🏦 Banco</option>
              <option value="carteira">👛 Carteira</option>
              <option value="poupanca">🐷 Poupança</option>
              <option value="investimento">📈 Investimento</option>
              <option value="cartao_credito">💳 Cartão de Crédito</option>
              <option value="outro">📌 Outro</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="accIcon">Ícone</label>
            <input type="text" id="accIcon" placeholder="🏦" value="🏦" maxlength="2">
          </div>
          
          <div class="form-group">
            <label for="accColor">Cor</label>
            <input type="color" id="accColor" value="#3B82F6">
          </div>
          
          <div class="form-group">
            <label for="accBalance">Saldo Inicial (R$)</label>
            <input type="number" id="accBalance" placeholder="0,00" step="0.01" value="0">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Adicionar Conta'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="accounts-section">
        <div class="section-header">
          <h3>💰 Saldo Total: <span class="${totalBalance >= 0 ? 'income' : 'expense'}">${formatCurrency(totalBalance)}</span></h3>
        </div>
        
        <div class="accounts-grid">
          ${accounts.map(a => `
            <div class="account-card" style="border-left: 4px solid ${a.color}">
              <div class="account-header">
                <span class="account-icon" style="background-color: ${a.color}20">${a.icon || '🏦'}</span>
                <div class="account-actions">
                  <button class="btn-icon" onclick="uiManager.editAccount('${a.id}')" title="Editar">✏️</button>
                  <button class="btn-icon btn-delete" onclick="uiManager.deleteAccount('${a.id}')" title="Excluir">🗑️</button>
                </div>
              </div>
              <h4>${sanitizeString(a.name)}</h4>
              <p class="account-type">${this.getAccountTypeName(a.type)}</p>
              <p class="account-balance ${a.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(a.balance)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('accountsView').innerHTML = html;
    this.setupFormListeners();
  }

  getAccountTypeName(type) {
    const types = {
      'banco': '🏦 Banco',
      'carteira': '👛 Carteira',
      'poupanca': '🐷 Poupança',
      'investimento': '📈 Investimento',
      'cartao_credito': '💳 Cartão de Crédito',
      'outro': '📌 Outro'
    };
    return types[type] || type;
  }

  editAccount(id) {
    const account = financeManager.getAccount(id);
    if (!account) return;

    this.editingId = id;
    this.renderAccounts();

    document.getElementById('accName').value = account.name;
    document.getElementById('accType').value = account.type;
    document.getElementById('accIcon').value = account.icon || '🏦';
    document.getElementById('accColor').value = account.color;
    document.getElementById('accBalance').value = toReais(account.balance);

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  }

  async deleteAccount(id) {
    const confirmed = await Modal.confirmAction(
      'Excluir Conta',
      'Tem certeza que deseja excluir esta conta?',
      { confirmText: 'Excluir', dangerous: true }
    );
    
    if (!confirmed) return;
    
    if (financeManager.deleteAccount(id)) {
      Toast.show('Conta excluída com sucesso!', 'success');
      this.renderAccounts();
    }
  }

  // ============================================
  // CATEGORIAS
  // ============================================

  renderCategories() {
    const businessId = financeManager.currentBusinessId;
    const categories = financeManager.getCategoriesByBusiness(businessId);
    const incomeCategories = categories.filter(c => c.type === 'receita');
    const expenseCategories = categories.filter(c => c.type === 'despesa');

    const html = `
      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Categoria' : '➕ Nova Categoria'}</h3>
        <form id="categoryForm" class="form-grid">
          <div class="form-group">
            <label for="catName">Nome *</label>
            <input type="text" id="catName" placeholder="Ex: Alimentação" required maxlength="${CONFIG.LIMITS.MAX_NAME_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="catType">Tipo *</label>
            <select id="catType" required>
              <option value="despesa">💸 Despesa</option>
              <option value="receita">💰 Receita</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="catIcon">Ícone</label>
            <input type="text" id="catIcon" placeholder="🍔" value="📌" maxlength="2">
          </div>
          
          <div class="form-group">
            <label for="catColor">Cor</label>
            <input type="color" id="catColor" value="#3B82F6">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Adicionar Categoria'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="categories-section">
        <h3>💰 Categorias de Receita</h3>
        <div class="categories-grid">
          ${incomeCategories.map(c => this.renderCategoryCard(c)).join('')}
        </div>
      </div>

      <div class="categories-section">
        <h3>💸 Categorias de Despesa</h3>
        <div class="categories-grid">
          ${expenseCategories.map(c => this.renderCategoryCard(c)).join('')}
        </div>
      </div>
    `;

    document.getElementById('categoriesView').innerHTML = html;
    this.setupFormListeners();
  }

  renderCategoryCard(category) {
    return `
      <div class="category-card" style="background-color: ${category.color}15; border-left: 4px solid ${category.color}">
        <span class="category-icon">${category.icon}</span>
        <p>${sanitizeString(category.name)}</p>
        <div class="category-actions">
          <button class="btn-icon" onclick="uiManager.editCategory('${category.id}')" title="Editar">✏️</button>
          <button class="btn-icon btn-delete" onclick="uiManager.deleteCategory('${category.id}')" title="Excluir">🗑️</button>
        </div>
      </div>
    `;
  }

  editCategory(id) {
    const category = financeManager.getCategory(id);
    if (!category) return;

    this.editingId = id;
    this.renderCategories();

    document.getElementById('catName').value = category.name;
    document.getElementById('catType').value = category.type;
    document.getElementById('catIcon').value = category.icon;
    document.getElementById('catColor').value = category.color;

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  }

  async deleteCategory(id) {
    const confirmed = await Modal.confirmAction(
      'Excluir Categoria',
      'Tem certeza que deseja excluir esta categoria?',
      { confirmText: 'Excluir', dangerous: true }
    );
    
    if (!confirmed) return;
    
    if (financeManager.deleteCategory(id)) {
      Toast.show('Categoria excluída com sucesso!', 'success');
      this.renderCategories();
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  setupEventListeners() {
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.exportJSON();
      }
    });
  }

  setupFormListeners() {
    // Inicializar formatação automática de números
    this.initNumberFormatting();
    
    // Formulário de transação
    document.getElementById('transactionForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTransactionSubmit();
    });

    // Formulário de conta
    document.getElementById('accountForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAccountSubmit();
    });

    // Formulário de categoria
    document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCategorySubmit();
    });

    // Formulário de orçamento
    document.getElementById('budgetForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleBudgetSubmit();
    });

    // Formulário de investimento
    document.getElementById('investmentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleInvestmentSubmit();
    });

    // Formulário de dívida
    document.getElementById('debtForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleDebtSubmit();
    });

    // Formulário de meta
    document.getElementById('goalForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleGoalSubmit();
    });

    // Formulário de venda
    document.getElementById('saleForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaleSubmit();
    });

    // Formulário de cliente
    document.getElementById('customerForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCustomerSubmit();
    });

    // Formulário de produto
    document.getElementById('productForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleProductSubmit();
    });

    // Formulário de devedor
    document.getElementById('debtorForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleDebtorSubmit();
    });
  }

  // ============================================
  // HANDLERS DE FORMULÁRIO
  // ============================================

  handleTransactionSubmit() {
    const data = {
      businessId: financeManager.currentBusinessId,
      date: document.getElementById('transDate').value,
      description: document.getElementById('transDescription').value,
      accountId: document.getElementById('transAccount').value,
      type: document.getElementById('transType').value,
      categoryId: document.getElementById('transCategory').value,
      amount: this.parseCurrencyValue(document.getElementById('transAmount').value),
      status: document.getElementById('transStatus').value,
      notes: document.getElementById('transNotes').value
    };

    if (this.editingId) {
      financeManager.updateTransaction(this.editingId, data);
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.UPDATE_TRANSACTION, `Atualizou transação: ${data.description}`, { amount: data.amount, type: data.type });
      }
      Toast.show('Transação atualizada com sucesso!', 'success');
    } else {
      financeManager.createTransaction(data);
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.CREATE_TRANSACTION, `Criou transação: ${data.description}`, { amount: data.amount, type: data.type });
      }
      Toast.show('Transação adicionada com sucesso!', 'success');
    }

    this.editingId = null;
    this.renderTransactions();
  }

  handleAccountSubmit() {
    const name = document.getElementById('accName').value;
    const type = document.getElementById('accType').value;
    const icon = document.getElementById('accIcon').value || '🏦';
    const color = document.getElementById('accColor').value;
    const balance = this.parseCurrencyValue(document.getElementById('accBalance').value) || 0;

    if (this.editingId) {
      financeManager.updateAccount(this.editingId, { name, type, icon, color, balance });
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.UPDATE_ACCOUNT, `Atualizou conta: ${name}`, { type, balance });
      }
      Toast.show('Conta atualizada com sucesso!', 'success');
    } else {
      financeManager.createAccount(financeManager.currentBusinessId, name, type, color, balance, icon);
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.CREATE_ACCOUNT, `Criou conta: ${name}`, { type, balance });
      }
      Toast.show('Conta adicionada com sucesso!', 'success');
    }

    this.editingId = null;
    this.renderAccounts();
  }

  handleCategorySubmit() {
    const name = document.getElementById('catName').value;
    const type = document.getElementById('catType').value;
    const icon = document.getElementById('catIcon').value || '📌';
    const color = document.getElementById('catColor').value;

    if (this.editingId) {
      financeManager.updateCategory(this.editingId, { name, type, icon, color });
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.UPDATE_CATEGORY, `Atualizou categoria: ${name}`, { type });
      }
      Toast.show('Categoria atualizada com sucesso!', 'success');
    } else {
      financeManager.createCategory(financeManager.currentBusinessId, name, icon, color, type);
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.CREATE_CATEGORY, `Criou categoria: ${name}`, { type });
      }
      Toast.show('Categoria adicionada com sucesso!', 'success');
    }

    this.editingId = null;
    this.renderCategories();
  }

  // ============================================
  // TEMA
  // ============================================

  applyTheme() {
    const settings = financeManager.getSettings();
    document.body.classList.toggle('dark-mode', settings.darkMode);
  }

  toggleDarkMode() {
    const settings = financeManager.getSettings();
    financeManager.updateSettings({ darkMode: !settings.darkMode });
    this.applyTheme();
    Toast.show(`Modo ${settings.darkMode ? 'claro' : 'escuro'} ativado`, 'info');
  }

  // ============================================
  // EXPORTAÇÃO
  // ============================================

  exportJSON() {
    const data = {
      ...financeManager.exportAllData(),
      ...salesManager.exportData(),
      ...debtorsManager.exportData()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gerenciador_financeiro_${getCurrentDate()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Registrar no log
    if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
      authManager.log(LOG_ACTIONS.EXPORT_DATA, 'Exportou backup dos dados');
    }
    
    Toast.show('Backup exportado com sucesso!', 'success');
  }

  // ============================================
  // LOGS DE ATIVIDADE
  // ============================================

  renderActivityLogs() {
    const viewElement = document.getElementById('activityLogsView');
    if (viewElement && typeof logsView !== 'undefined') {
      viewElement.innerHTML = logsView.render();
      
      // Registrar visualização dos logs
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.VIEW_LOGS, 'Visualizou logs de atividade');
      }
    }
  }

  // ============================================
  // GOOGLE SHEETS
  // ============================================

  renderGoogleSheets() {
    const viewElement = document.getElementById('googleSheetsView');
    if (viewElement && typeof googleSheetsView !== 'undefined') {
      googleSheetsView.render();
    } else if (viewElement) {
      viewElement.innerHTML = `
        <div class="view-header">
          <h2>📊 Integração Google Sheets</h2>
          <p class="view-description">Carregando...</p>
        </div>
      `;
    }
  }

  // ============================================
  // FORMATAÇÃO AUTOMÁTICA DE NÚMEROS
  // ============================================

  /**
   * Inicializa formatação automática em campos de valor
   */
  initNumberFormatting() {
    // Campos de valor monetário (R$)
    const currencyFields = [
      'transAmount', 'accBalance', 'budAmount', 'invInitial', 'invCurrent',
      'debtTotal', 'debtPaid', 'goalTarget', 'goalCurrent', 'debtorAmount',
      'saleDiscount', 'prodCost', 'prodPrice'
    ];
    
    currencyFields.forEach(fieldId => {
      const input = document.getElementById(fieldId);
      if (input) {
        // Remover type="number" para permitir formatação
        input.type = 'text';
        input.inputMode = 'decimal';
        
        input.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value === '') {
            e.target.value = '';
            return;
          }
          let numValue = parseInt(value) / 100;
          e.target.value = numValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        });
        
        input.addEventListener('focus', (e) => {
          // Selecionar todo o texto ao focar
          setTimeout(() => e.target.select(), 50);
        });
      }
    });
    
    // Campos de telefone
    const phoneFields = ['debtorPhone', 'custPhone'];
    phoneFields.forEach(fieldId => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length === 0) {
            e.target.value = '';
            return;
          }
          if (value.length <= 2) {
            e.target.value = `(${value}`;
          } else if (value.length <= 6) {
            e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
          } else if (value.length <= 10) {
            e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
          } else {
            e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
          }
        });
      }
    });
    
    // Campos de CPF/CNPJ
    const documentFields = ['debtorDocument', 'custDocument'];
    documentFields.forEach(fieldId => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length <= 11) {
            // CPF
            if (value.length <= 3) {
              e.target.value = value;
            } else if (value.length <= 6) {
              e.target.value = `${value.slice(0, 3)}.${value.slice(3)}`;
            } else if (value.length <= 9) {
              e.target.value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
            } else {
              e.target.value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
            }
          } else {
            // CNPJ
            if (value.length <= 2) {
              e.target.value = value;
            } else if (value.length <= 5) {
              e.target.value = `${value.slice(0, 2)}.${value.slice(2)}`;
            } else if (value.length <= 8) {
              e.target.value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
            } else if (value.length <= 12) {
              e.target.value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;
            } else {
              e.target.value = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12, 14)}`;
            }
          }
        });
      }
    });
    
    // Campos de porcentagem
    const percentFields = ['debtInterest', 'debtorInterest', 'saleDiscountPercent'];
    percentFields.forEach(fieldId => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.addEventListener('input', (e) => {
          let value = e.target.value.replace(/[^\d,]/g, '');
          e.target.value = value;
        });
      }
    });
  }

  /**
   * Converte valor formatado para número
   */
  parseCurrencyValue(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  }

  // ============================================
  // ATUALIZAÇÃO DE VIEW
  // ============================================

  /**
   * Atualiza a view atual sem mudar de página
   * Útil para quando dados são importados do Google Sheets
   */
  refreshCurrentView() {
    console.log('🔄 Atualizando view atual:', this.currentView);
    this.renderView(this.currentView);
  }
}

// Instância global
window.Toast = Toast;
window.uiManager = null;
window.UIManager = UIManager;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Verificar se está autenticado antes de inicializar
  if (typeof authManager !== 'undefined' && !authManager.isAuthenticated()) {
    // Não inicializar se não estiver autenticado
    // O redirecionamento será feito pelo index.html
    return;
  }
  
  // Inicializar UIManager
  window.uiManager = new UIManager();
  uiManager.init();
});
