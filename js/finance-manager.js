// ============================================
// GERENCIADOR FINANCEIRO - CLASSE PRINCIPAL
// ============================================

class FinanceManager {
  constructor() {
    this.businesses = [];
    this.transactions = [];
    this.accounts = [];
    this.categories = [];
    this.budgets = [];
    this.investments = [];
    this.debts = [];
    this.goals = [];
    this.recurring = [];
    this.currentBusinessId = null;
    this.settings = { ...CONFIG.DEFAULT_SETTINGS };
    
    this.loadAllData();
    this.initializeDefaults();
  }

  // ============================================
  // CARREGAMENTO E SALVAMENTO DE DADOS
  // ============================================

  loadAllData() {
    this.businesses = this.loadFromStorage(CONFIG.STORAGE_KEYS.BUSINESSES) || [];
    this.transactions = this.loadFromStorage(CONFIG.STORAGE_KEYS.TRANSACTIONS) || [];
    this.accounts = this.loadFromStorage(CONFIG.STORAGE_KEYS.ACCOUNTS) || [];
    this.categories = this.loadFromStorage(CONFIG.STORAGE_KEYS.CATEGORIES) || [];
    this.budgets = this.loadFromStorage(CONFIG.STORAGE_KEYS.BUDGETS) || [];
    this.investments = this.loadFromStorage(CONFIG.STORAGE_KEYS.INVESTMENTS) || [];
    this.debts = this.loadFromStorage(CONFIG.STORAGE_KEYS.DEBTS) || [];
    this.goals = this.loadFromStorage(CONFIG.STORAGE_KEYS.GOALS) || [];
    this.recurring = this.loadFromStorage(CONFIG.STORAGE_KEYS.RECURRING) || [];
    this.currentBusinessId = this.loadFromStorage(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS);
    this.settings = { ...CONFIG.DEFAULT_SETTINGS, ...this.loadFromStorage(CONFIG.STORAGE_KEYS.SETTINGS) };
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      
      // Sincronizar com Google Sheets em tempo real
      this.triggerGoogleSheetsSync(key);
      
      return true;
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
      Toast.show('Erro ao salvar dados', 'error');
      return false;
    }
  }

  /**
   * Dispara sincronização com Google Sheets baseado na chave de armazenamento
   */
  triggerGoogleSheetsSync(storageKey) {
    // Não sincronizar durante importação para evitar loop
    if (!window.googleSheetsManager || !window.googleSheetsManager.isConnected || window.googleSheetsManager._isImporting) {
      return;
    }

    // Usar debounce para evitar múltiplas sincronizações seguidas
    if (this._syncTimeout) {
      clearTimeout(this._syncTimeout);
    }
    
    this._syncTimeout = setTimeout(() => {
      console.log('🔄 Sincronizando automaticamente com Google Sheets...');
      window.googleSheetsManager.syncAll().then(() => {
        console.log('✅ Sincronização automática concluída');
      }).catch(err => {
        console.error('❌ Erro na sincronização automática:', err);
      });
    }, 1000); // Aguardar 1 segundo antes de sincronizar
  }

  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Erro ao carregar do localStorage:', e);
      return null;
    }
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  initializeDefaults() {
    // NÃO criar dados padrão - tudo deve vir do Google Sheets
    // Apenas definir currentBusinessId se houver businesses carregados
    if (!this.currentBusinessId && this.businesses.length > 0) {
      this.currentBusinessId = this.businesses[0].id;
      this.saveToStorage(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS, this.currentBusinessId);
    }
    
    // Se não houver businesses, aguardar importação do Google Sheets
    console.log('📦 initializeDefaults: businesses=' + this.businesses.length + ', currentBusinessId=' + this.currentBusinessId);
  }

  // ============================================
  // GERENCIAMENTO DE NEGÓCIOS/PERFIS
  // ============================================

  createBusiness(name, description, type) {
    const business = {
      id: generateId(),
      name: sanitizeString(name),
      description: sanitizeString(description),
      type,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.businesses.push(business);
    this.saveToStorage(CONFIG.STORAGE_KEYS.BUSINESSES, this.businesses);
    
    // NÃO criar categorias e contas padrão - tudo deve vir do Google Sheets
    // this.createDefaultCategories(business.id);
    // this.createDefaultAccounts(business.id);
    
    if (!this.currentBusinessId) {
      this.currentBusinessId = business.id;
      this.saveToStorage(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS, this.currentBusinessId);
    }
    
    return business;
  }

  createDefaultCategories(businessId) {
    [...CONFIG.DEFAULT_CATEGORIES.income, ...CONFIG.DEFAULT_CATEGORIES.expense].forEach(cat => {
      this.createCategory(businessId, cat.name, cat.icon, cat.color, cat.type);
    });
  }

  createDefaultAccounts(businessId) {
    CONFIG.DEFAULT_ACCOUNTS.forEach(acc => {
      this.createAccount(businessId, acc.name, acc.type, acc.color, 0, acc.icon);
    });
  }

  getBusiness(id) {
    return this.businesses.find(b => b.id === id);
  }

  updateBusiness(id, updates) {
    const business = this.getBusiness(id);
    if (business) {
      Object.assign(business, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : business.name,
        description: updates.description ? sanitizeString(updates.description) : business.description,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.BUSINESSES, this.businesses);
    }
    return business;
  }

  deleteBusiness(id) {
    if (this.businesses.length <= 1) {
      Toast.show('Não é possível deletar o único perfil', 'error');
      return false;
    }
    
    this.businesses = this.businesses.filter(b => b.id !== id);
    this.transactions = this.transactions.filter(t => t.businessId !== id);
    this.accounts = this.accounts.filter(a => a.businessId !== id);
    this.categories = this.categories.filter(c => c.businessId !== id);
    this.budgets = this.budgets.filter(b => b.businessId !== id);
    this.investments = this.investments.filter(i => i.businessId !== id);
    this.debts = this.debts.filter(d => d.businessId !== id);
    this.goals = this.goals.filter(g => g.businessId !== id);
    
    if (this.currentBusinessId === id) {
      this.currentBusinessId = this.businesses[0]?.id;
      this.saveToStorage(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS, this.currentBusinessId);
    }
    
    this.saveAllData();
    return true;
  }

  switchBusiness(id) {
    if (this.getBusiness(id)) {
      this.currentBusinessId = id;
      this.saveToStorage(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS, this.currentBusinessId);
      return true;
    }
    return false;
  }

  // ============================================
  // GERENCIAMENTO DE CATEGORIAS
  // ============================================

  createCategory(businessId, name, icon, color, type = 'despesa') {
    const category = {
      id: generateId(),
      businessId,
      name: sanitizeString(name),
      icon: icon || '📌',
      color: color || CONFIG.DEFAULT_COLORS[Math.floor(Math.random() * CONFIG.DEFAULT_COLORS.length)],
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.categories.push(category);
    this.saveToStorage(CONFIG.STORAGE_KEYS.CATEGORIES, this.categories);
    return category;
  }

  getCategoriesByBusiness(businessId) {
    return this.categories.filter(c => c.businessId === businessId);
  }

  getCategoriesByType(businessId, type) {
    return this.categories.filter(c => c.businessId === businessId && c.type === type);
  }

  getCategory(id) {
    return this.categories.find(c => c.id === id);
  }

  updateCategory(id, updates) {
    const category = this.getCategory(id);
    if (category) {
      Object.assign(category, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : category.name,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.CATEGORIES, this.categories);
    }
    return category;
  }

  deleteCategory(id) {
    // Verificar se há transações usando esta categoria
    const hasTransactions = this.transactions.some(t => t.categoryId === id);
    if (hasTransactions) {
      Toast.show('Não é possível deletar categoria com transações vinculadas', 'error');
      return false;
    }
    
    this.categories = this.categories.filter(c => c.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.CATEGORIES, this.categories);
    return true;
  }

  // ============================================
  // GERENCIAMENTO DE CONTAS
  // ============================================

  createAccount(businessId, name, type, color, balance = 0, icon = '🏦') {
    const account = {
      id: generateId(),
      businessId,
      name: sanitizeString(name),
      type,
      color: color || CONFIG.DEFAULT_COLORS[Math.floor(Math.random() * CONFIG.DEFAULT_COLORS.length)],
      icon: icon || '🏦',
      balance: toCents(balance),
      initialBalance: toCents(balance),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.accounts.push(account);
    this.saveToStorage(CONFIG.STORAGE_KEYS.ACCOUNTS, this.accounts);
    return account;
  }

  getAccountsByBusiness(businessId) {
    return this.accounts.filter(a => a.businessId === businessId && (a.active !== false && a.isActive !== false));
  }

  getAccount(id) {
    return this.accounts.find(a => a.id === id);
  }

  updateAccount(id, updates) {
    const account = this.getAccount(id);
    if (account) {
      // Se o saldo foi atualizado diretamente
      if (updates.balance !== undefined) {
        updates.balance = toCents(updates.balance);
      }
      
      Object.assign(account, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : account.name,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.ACCOUNTS, this.accounts);
    }
    return account;
  }

  deleteAccount(id) {
    const hasTransactions = this.transactions.some(t => t.accountId === id);
    if (hasTransactions) {
      // Desativar ao invés de deletar
      const account = this.getAccount(id);
      if (account) {
        account.isActive = false;
        account.updatedAt = new Date().toISOString();
        this.saveToStorage(CONFIG.STORAGE_KEYS.ACCOUNTS, this.accounts);
        Toast.show('Conta desativada (possui transações vinculadas)', 'warning');
      }
      return true;
    }
    
    this.accounts = this.accounts.filter(a => a.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.ACCOUNTS, this.accounts);
    return true;
  }

  updateAccountBalance(accountId, amount, type, isReversal = false) {
    const account = this.getAccount(accountId);
    if (!account) return;

    const amountCents = typeof amount === 'number' ? amount : toCents(amount);
    
    if (isReversal) {
      // Reverter transação
      if (type === CONFIG.TRANSACTION_TYPES.INCOME) {
        account.balance -= amountCents;
      } else if (type === CONFIG.TRANSACTION_TYPES.EXPENSE) {
        account.balance += amountCents;
      }
    } else {
      // Nova transação
      if (type === CONFIG.TRANSACTION_TYPES.INCOME) {
        account.balance += amountCents;
      } else if (type === CONFIG.TRANSACTION_TYPES.EXPENSE) {
        account.balance -= amountCents;
      }
    }
    
    account.updatedAt = new Date().toISOString();
    this.saveToStorage(CONFIG.STORAGE_KEYS.ACCOUNTS, this.accounts);
  }

  // ============================================
  // GERENCIAMENTO DE TRANSAÇÕES
  // ============================================

  createTransaction(data) {
    const {
      businessId,
      accountId,
      categoryId,
      description,
      amount,
      type,
      status = CONFIG.TRANSACTION_STATUS.PAID,
      date = new Date(),
      notes = '',
      tags = []
    } = data;

    if (!isValidNumber(amount) || amount <= 0) {
      Toast.show('Valor inválido', 'error');
      return null;
    }

    const transaction = {
      id: generateId(),
      businessId,
      accountId,
      categoryId,
      description: sanitizeString(description),
      amount: toCents(amount),
      type,
      status,
      date: new Date(date).toISOString(),
      notes: sanitizeString(notes),
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.transactions.push(transaction);
    this.saveToStorage(CONFIG.STORAGE_KEYS.TRANSACTIONS, this.transactions);

    // Atualizar saldo da conta se a transação estiver paga
    if (status === CONFIG.TRANSACTION_STATUS.PAID) {
      this.updateAccountBalance(accountId, transaction.amount, type);
    }

    return transaction;
  }

  getTransaction(id) {
    return this.transactions.find(t => t.id === id);
  }

  getTransactionsByBusiness(businessId) {
    return this.transactions
      .filter(t => t.businessId === businessId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  getTransactionsByDateRange(businessId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return this.getTransactionsByBusiness(businessId).filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }

  getTransactionsByMonth(businessId, monthYear) {
    const [year, month] = monthYear.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return this.getTransactionsByDateRange(businessId, startDate, endDate);
  }

  updateTransaction(id, updates) {
    const transaction = this.getTransaction(id);
    if (!transaction) return null;

    const oldAmount = transaction.amount;
    const oldType = transaction.type;
    const oldStatus = transaction.status;
    const oldAccountId = transaction.accountId;

    // Reverter saldo antigo se estava pago
    if (oldStatus === CONFIG.TRANSACTION_STATUS.PAID) {
      this.updateAccountBalance(oldAccountId, oldAmount, oldType, true);
    }

    // Atualizar transação
    if (updates.amount !== undefined) {
      updates.amount = toCents(updates.amount);
    }
    
    Object.assign(transaction, {
      ...updates,
      description: updates.description ? sanitizeString(updates.description) : transaction.description,
      notes: updates.notes ? sanitizeString(updates.notes) : transaction.notes,
      updatedAt: new Date().toISOString()
    });

    // Aplicar novo saldo se está pago
    if (transaction.status === CONFIG.TRANSACTION_STATUS.PAID) {
      this.updateAccountBalance(transaction.accountId, transaction.amount, transaction.type);
    }

    this.saveToStorage(CONFIG.STORAGE_KEYS.TRANSACTIONS, this.transactions);
    return transaction;
  }

  deleteTransaction(id) {
    const transaction = this.getTransaction(id);
    if (!transaction) return false;

    // Reverter saldo se estava pago
    if (transaction.status === CONFIG.TRANSACTION_STATUS.PAID) {
      this.updateAccountBalance(transaction.accountId, transaction.amount, transaction.type, true);
    }

    this.transactions = this.transactions.filter(t => t.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.TRANSACTIONS, this.transactions);
    return true;
  }

  // ============================================
  // GERENCIAMENTO DE ORÇAMENTOS
  // ============================================

  createBudget(businessId, categoryId, month, amount) {
    // Verificar se já existe orçamento para esta categoria/mês
    const existing = this.budgets.find(b => 
      b.businessId === businessId && 
      b.categoryId === categoryId && 
      b.month === month
    );
    
    if (existing) {
      return this.updateBudget(existing.id, { amount });
    }

    const budget = {
      id: generateId(),
      businessId,
      categoryId,
      month,
      amount: toCents(amount),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.budgets.push(budget);
    this.saveToStorage(CONFIG.STORAGE_KEYS.BUDGETS, this.budgets);
    return budget;
  }

  getBudgetsByBusiness(businessId) {
    return this.budgets.filter(b => b.businessId === businessId);
  }

  getBudgetsByMonth(businessId, month) {
    return this.getBudgetsByBusiness(businessId).filter(b => b.month === month);
  }

  getBudget(id) {
    return this.budgets.find(b => b.id === id);
  }

  updateBudget(id, updates) {
    const budget = this.getBudget(id);
    if (budget) {
      if (updates.amount !== undefined) {
        updates.amount = toCents(updates.amount);
      }
      Object.assign(budget, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.BUDGETS, this.budgets);
    }
    return budget;
  }

  deleteBudget(id) {
    this.budgets = this.budgets.filter(b => b.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.BUDGETS, this.budgets);
    return true;
  }

  getBudgetProgress(businessId, month) {
    const budgets = this.getBudgetsByMonth(businessId, month);
    const transactions = this.getTransactionsByMonth(businessId, month);
    
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.categoryId === budget.categoryId && t.type === CONFIG.TRANSACTION_TYPES.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const category = this.getCategory(budget.categoryId);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        ...budget,
        category,
        spent,
        remaining: budget.amount - spent,
        percentage: Math.min(percentage, 100),
        isOverBudget: spent > budget.amount
      };
    });
  }

  // ============================================
  // GERENCIAMENTO DE INVESTIMENTOS
  // ============================================

  createInvestment(data) {
    const {
      businessId,
      name,
      type,
      initialValue,
      currentValue,
      purchaseDate = new Date(),
      notes = ''
    } = data;

    const investment = {
      id: generateId(),
      businessId,
      name: sanitizeString(name),
      type,
      initialValue: toCents(initialValue),
      currentValue: toCents(currentValue),
      purchaseDate: new Date(purchaseDate).toISOString(),
      notes: sanitizeString(notes),
      history: [{
        date: new Date().toISOString(),
        value: toCents(currentValue)
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.investments.push(investment);
    this.saveToStorage(CONFIG.STORAGE_KEYS.INVESTMENTS, this.investments);
    return investment;
  }

  getInvestmentsByBusiness(businessId) {
    return this.investments.filter(i => i.businessId === businessId);
  }

  getInvestment(id) {
    return this.investments.find(i => i.id === id);
  }

  updateInvestment(id, updates) {
    const investment = this.getInvestment(id);
    if (investment) {
      if (updates.initialValue !== undefined) {
        updates.initialValue = toCents(updates.initialValue);
      }
      if (updates.currentValue !== undefined) {
        updates.currentValue = toCents(updates.currentValue);
        // Adicionar ao histórico
        investment.history.push({
          date: new Date().toISOString(),
          value: updates.currentValue
        });
      }
      
      Object.assign(investment, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : investment.name,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.INVESTMENTS, this.investments);
    }
    return investment;
  }

  deleteInvestment(id) {
    this.investments = this.investments.filter(i => i.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.INVESTMENTS, this.investments);
    return true;
  }

  calculateInvestmentReturn(investment) {
    const gain = investment.currentValue - investment.initialValue;
    const percentage = investment.initialValue > 0 
      ? (gain / investment.initialValue) * 100 
      : 0;
    return { gain, percentage };
  }

  getTotalInvestments(businessId) {
    return this.getInvestmentsByBusiness(businessId)
      .reduce((sum, i) => sum + i.currentValue, 0);
  }

  // ============================================
  // GERENCIAMENTO DE DÍVIDAS
  // ============================================

  createDebt(businessId, data) {
    const {
      name,
      type,
      totalValue,
      paidValue = 0,
      interestRate = 0,
      installments = 1,
      paidInstallments = 0,
      startDate,
      notes = ''
    } = data;

    const totalValueCents = typeof totalValue === 'number' ? totalValue : toCents(totalValue);
    const paidValueCents = typeof paidValue === 'number' ? paidValue : toCents(paidValue);

    const debt = {
      id: generateId(),
      businessId,
      name: sanitizeString(name),
      type,
      totalValue: totalValueCents,
      paidValue: paidValueCents,
      remainingValue: totalValueCents - paidValueCents,
      interestRate: parseFloat(interestRate) || 0,
      installments: parseInt(installments) || 1,
      paidInstallments: parseInt(paidInstallments) || 0,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      status: paidValueCents >= totalValueCents ? 'quitado' : 'ativo',
      payments: [],
      notes: sanitizeString(notes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.debts.push(debt);
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTS, this.debts);
    return debt;
  }

  getDebtsByBusiness(businessId) {
    return this.debts.filter(d => d.businessId === businessId);
  }

  getDebt(id) {
    return this.debts.find(d => d.id === id);
  }

  updateDebt(id, updates) {
    const debt = this.getDebt(id);
    if (debt) {
      if (updates.totalValue !== undefined) {
        updates.totalValue = typeof updates.totalValue === 'number' ? updates.totalValue : toCents(updates.totalValue);
      }
      if (updates.paidValue !== undefined) {
        updates.paidValue = typeof updates.paidValue === 'number' ? updates.paidValue : toCents(updates.paidValue);
      }
      
      Object.assign(debt, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : debt.name,
        updatedAt: new Date().toISOString()
      });
      
      // Recalcular valor restante
      debt.remainingValue = debt.totalValue - debt.paidValue;
      
      // Atualizar status
      if (debt.paidValue >= debt.totalValue) {
        debt.status = 'quitado';
      } else {
        debt.status = 'ativo';
      }
      
      this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTS, this.debts);
    }
    return debt;
  }

  makeDebtPayment(debtId, amount, date = new Date()) {
    const debt = this.getDebt(debtId);
    if (!debt) return null;

    const paymentAmount = toCents(amount);
    
    debt.payments.push({
      id: generateId(),
      amount: paymentAmount,
      date: new Date(date).toISOString()
    });
    
    debt.paidValue = (debt.paidValue || 0) + paymentAmount;
    debt.remainingValue = Math.max(0, debt.totalValue - debt.paidValue);
    
    if (debt.remainingValue === 0) {
      debt.status = 'quitado';
    }
    
    debt.updatedAt = new Date().toISOString();
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTS, this.debts);
    
    return debt;
  }

  deleteDebt(id) {
    this.debts = this.debts.filter(d => d.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTS, this.debts);
    return true;
  }

  getTotalDebts(businessId) {
    return this.getDebtsByBusiness(businessId)
      .filter(d => d.status === 'ativo')
      .reduce((sum, d) => sum + (d.remainingValue || 0), 0);
  }

  // ============================================
  // GERENCIAMENTO DE METAS
  // ============================================

  createGoal(data) {
    const {
      businessId,
      name,
      targetAmount,
      currentAmount = 0,
      deadline,
      category = 'geral',
      notes = ''
    } = data;

    const goal = {
      id: generateId(),
      businessId,
      name: sanitizeString(name),
      targetAmount: toCents(targetAmount),
      currentAmount: toCents(currentAmount),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      category,
      status: 'em_progresso',
      notes: sanitizeString(notes),
      contributions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.goals.push(goal);
    this.saveToStorage(CONFIG.STORAGE_KEYS.GOALS, this.goals);
    return goal;
  }

  getGoalsByBusiness(businessId) {
    return this.goals.filter(g => g.businessId === businessId);
  }

  getGoal(id) {
    return this.goals.find(g => g.id === id);
  }

  updateGoal(id, updates) {
    const goal = this.getGoal(id);
    if (goal) {
      if (updates.targetAmount !== undefined) {
        updates.targetAmount = toCents(updates.targetAmount);
      }
      if (updates.currentAmount !== undefined) {
        updates.currentAmount = toCents(updates.currentAmount);
      }
      
      Object.assign(goal, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : goal.name,
        updatedAt: new Date().toISOString()
      });
      
      // Verificar se a meta foi atingida
      if (goal.currentAmount >= goal.targetAmount) {
        goal.status = 'concluido';
      }
      
      this.saveToStorage(CONFIG.STORAGE_KEYS.GOALS, this.goals);
    }
    return goal;
  }

  contributeToGoal(goalId, amount, date = new Date()) {
    const goal = this.getGoal(goalId);
    if (!goal) return null;

    const contributionAmount = toCents(amount);
    
    goal.contributions.push({
      id: generateId(),
      amount: contributionAmount,
      date: new Date(date).toISOString()
    });
    
    goal.currentAmount += contributionAmount;
    
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'concluido';
    }
    
    goal.updatedAt = new Date().toISOString();
    this.saveToStorage(CONFIG.STORAGE_KEYS.GOALS, this.goals);
    
    return goal;
  }

  deleteGoal(id) {
    this.goals = this.goals.filter(g => g.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.GOALS, this.goals);
    return true;
  }

  // ============================================
  // ANÁLISES E ESTATÍSTICAS
  // ============================================

  getMonthlyStats(businessId, month) {
    const transactions = this.getTransactionsByMonth(businessId, month);
    
    const totalIncome = transactions
      .filter(t => t.type === CONFIG.TRANSACTION_TYPES.INCOME && t.status === CONFIG.TRANSACTION_STATUS.PAID)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === CONFIG.TRANSACTION_TYPES.EXPENSE && t.status === CONFIG.TRANSACTION_STATUS.PAID)
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingIncome = transactions
      .filter(t => t.type === CONFIG.TRANSACTION_TYPES.INCOME && t.status === CONFIG.TRANSACTION_STATUS.PENDING)
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingExpense = transactions
      .filter(t => t.type === CONFIG.TRANSACTION_TYPES.EXPENSE && t.status === CONFIG.TRANSACTION_STATUS.PENDING)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month,
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense,
      transactionCount: transactions.length
    };
  }

  getCategoryStats(businessId, startDate, endDate) {
    const transactions = this.getTransactionsByDateRange(businessId, startDate, endDate);
    const stats = {};

    transactions.forEach(t => {
      if (!stats[t.categoryId]) {
        const category = this.getCategory(t.categoryId);
        stats[t.categoryId] = {
          category,
          total: 0,
          count: 0,
          type: t.type
        };
      }
      stats[t.categoryId].total += t.amount;
      stats[t.categoryId].count++;
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }

  getTotalBalance(businessId) {
    return this.getAccountsByBusiness(businessId)
      .reduce((sum, acc) => sum + acc.balance, 0);
  }

  getFinancialSummary(businessId) {
    const currentMonth = getCurrentMonthYear();
    const stats = this.getMonthlyStats(businessId, currentMonth);
    const totalBalance = this.getTotalBalance(businessId);
    const totalInvestments = this.getTotalInvestments(businessId);
    const totalDebts = this.getTotalDebts(businessId);
    
    return {
      ...stats,
      totalBalance,
      totalInvestments,
      totalDebts,
      netWorth: totalBalance + totalInvestments - totalDebts
    };
  }

  getMonthlyTrend(businessId, months = 6) {
    const trends = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const stats = this.getMonthlyStats(businessId, monthYear);
      trends.push({
        month: monthYear,
        monthName: date.toLocaleDateString(CONFIG.LOCALE, { month: 'short', year: 'numeric' }),
        ...stats
      });
    }
    
    return trends;
  }

  // ============================================
  // CONFIGURAÇÕES
  // ============================================

  updateSettings(updates) {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage(CONFIG.STORAGE_KEYS.SETTINGS, this.settings);
    return this.settings;
  }

  getSettings() {
    return this.settings;
  }

  // ============================================
  // MÉTODOS GLOBAIS PARA SINCRONIZAÇÃO
  // ============================================

  /**
   * Retorna todas as transações (para sincronização)
   * @returns {Array} Lista de todas as transações
   */
  getTransactions() {
    return [...this.transactions];
  }

  /**
   * Retorna todas as contas (para sincronização)
   * @returns {Array} Lista de todas as contas
   */
  getAccounts() {
    return [...this.accounts];
  }

  /**
   * Retorna todas as categorias (para sincronização)
   * @returns {Array} Lista de todas as categorias
   */
  getCategories() {
    return [...this.categories];
  }

  /**
   * Retorna todos os orçamentos (para sincronização)
   * @returns {Array} Lista de todos os orçamentos
   */
  getBudgets() {
    return [...this.budgets];
  }

  /**
   * Retorna todos os investimentos (para sincronização)
   * @returns {Array} Lista de todos os investimentos
   */
  getInvestments() {
    return [...this.investments];
  }

  /**
   * Retorna todas as dívidas (para sincronização)
   * @returns {Array} Lista de todas as dívidas
   */
  getDebts() {
    return [...this.debts];
  }

  /**
   * Retorna todas as metas (para sincronização)
   * @returns {Array} Lista de todas as metas
   */
  getGoals() {
    return [...this.goals];
  }

  // ============================================
  // BACKUP E RESTAURAÇÃO
  // ============================================

  exportAllData() {
    return {
      version: CONFIG.APP_VERSION,
      exportedAt: new Date().toISOString(),
      businesses: this.businesses,
      transactions: this.transactions,
      accounts: this.accounts,
      categories: this.categories,
      budgets: this.budgets,
      investments: this.investments,
      debts: this.debts,
      goals: this.goals,
      recurring: this.recurring,
      settings: this.settings
    };
  }

  importAllData(data) {
    try {
      if (data.businesses) this.businesses = data.businesses;
      if (data.transactions) this.transactions = data.transactions;
      if (data.accounts) this.accounts = data.accounts;
      if (data.categories) this.categories = data.categories;
      if (data.budgets) this.budgets = data.budgets;
      if (data.investments) this.investments = data.investments;
      if (data.debts) this.debts = data.debts;
      if (data.goals) this.goals = data.goals;
      if (data.recurring) this.recurring = data.recurring;
      if (data.settings) this.settings = { ...CONFIG.DEFAULT_SETTINGS, ...data.settings };
      
      this.saveAllData();
      return true;
    } catch (e) {
      console.error('Erro ao importar dados:', e);
      return false;
    }
  }

  saveAllData() {
    this.saveToStorage(CONFIG.STORAGE_KEYS.BUSINESSES, this.businesses);
    this.saveToStorage(CONFIG.STORAGE_KEYS.TRANSACTIONS, this.transactions);
    this.saveToStorage(CONFIG.STORAGE_KEYS.ACCOUNTS, this.accounts);
    this.saveToStorage(CONFIG.STORAGE_KEYS.CATEGORIES, this.categories);
    this.saveToStorage(CONFIG.STORAGE_KEYS.BUDGETS, this.budgets);
    this.saveToStorage(CONFIG.STORAGE_KEYS.INVESTMENTS, this.investments);
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTS, this.debts);
    this.saveToStorage(CONFIG.STORAGE_KEYS.GOALS, this.goals);
    this.saveToStorage(CONFIG.STORAGE_KEYS.RECURRING, this.recurring);
    this.saveToStorage(CONFIG.STORAGE_KEYS.SETTINGS, this.settings);
  }

  async clearAllData() {
    const confirmed = await Modal.confirmAction(
      'Limpar Todos os Dados',
      'ATENÇÃO: Todos os dados serão perdidos permanentemente. Esta ação NÃO pode ser desfeita!',
      { confirmText: 'Limpar Tudo', dangerous: true }
    );
    
    if (!confirmed) {
      return false;
    }
    
    Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    this.businesses = [];
    this.transactions = [];
    this.accounts = [];
    this.categories = [];
    this.budgets = [];
    this.investments = [];
    this.debts = [];
    this.goals = [];
    this.recurring = [];
    this.currentBusinessId = null;
    this.settings = { ...CONFIG.DEFAULT_SETTINGS };
    
    this.initializeDefaults();
    return true;
  }
}

// Instância global
window.financeManager = new FinanceManager();
