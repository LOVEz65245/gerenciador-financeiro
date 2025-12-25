// ============================================
// VIEWS ADICIONAIS DO GERENCIADOR FINANCEIRO
// ============================================

// Extensão da classe UIManager com views adicionais
Object.assign(UIManager.prototype, {

  // ============================================
  // ORÇAMENTOS
  // ============================================

  renderBudgets() {
    const businessId = financeManager.currentBusinessId;
    const categories = financeManager.getCategoriesByType(businessId, 'despesa');
    const currentMonth = getCurrentMonthYear();
    const budgetProgress = financeManager.getBudgetProgress(businessId, currentMonth);

    const html = `
      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Orçamento' : '➕ Novo Orçamento'}</h3>
        <form id="budgetForm" class="form-grid">
          <div class="form-group">
            <label for="budMonth">Mês *</label>
            <input type="month" id="budMonth" value="${currentMonth}" required>
          </div>
          
          <div class="form-group">
            <label for="budCategory">Categoria *</label>
            <select id="budCategory" required>
              <option value="">Selecione uma categoria</option>
              ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="budAmount">Valor do Orçamento (R$) *</label>
            <input type="number" id="budAmount" placeholder="0,00" step="0.01" min="0.01" required>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Definir Orçamento'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="budgets-section">
        <div class="section-header">
          <h3>📋 Orçamentos de ${formatMonthYear(currentMonth)}</h3>
          <div class="month-nav">
            <button class="btn-icon" onclick="uiManager.changeMonth(-1)">◀</button>
            <input type="month" id="budgetMonthSelector" value="${currentMonth}" onchange="uiManager.changeBudgetMonth(this.value)">
            <button class="btn-icon" onclick="uiManager.changeMonth(1)">▶</button>
          </div>
        </div>
        
        ${budgetProgress.length > 0 ? `
          <div class="budget-cards">
            ${budgetProgress.map(b => `
              <div class="budget-card ${b.isOverBudget ? 'over-budget' : ''}">
                <div class="budget-card-header">
                  <span class="budget-category-icon" style="background-color: ${b.category?.color}20; color: ${b.category?.color}">${b.category?.icon || '📌'}</span>
                  <div class="budget-card-actions">
                    <button class="btn-icon" onclick="uiManager.editBudget('${b.id}')" title="Editar">✏️</button>
                    <button class="btn-icon btn-delete" onclick="uiManager.deleteBudget('${b.id}')" title="Excluir">🗑️</button>
                  </div>
                </div>
                <h4>${b.category?.name || 'Categoria'}</h4>
                <div class="budget-values">
                  <span class="spent ${b.isOverBudget ? 'expense' : ''}">${formatCurrency(b.spent)}</span>
                  <span class="separator">/</span>
                  <span class="total">${formatCurrency(b.amount)}</span>
                </div>
                <div class="progress-bar large">
                  <div class="progress-fill ${b.isOverBudget ? 'over-budget' : ''}" style="width: ${Math.min(b.percentage, 100)}%"></div>
                </div>
                <div class="budget-footer">
                  <span class="percentage ${b.isOverBudget ? 'expense' : ''}">${b.percentage.toFixed(1)}%</span>
                  <span class="remaining ${b.remaining < 0 ? 'expense' : 'income'}">
                    ${b.remaining >= 0 ? `Restam ${formatCurrency(b.remaining)}` : `Excedido em ${formatCurrency(Math.abs(b.remaining))}`}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="empty-message">Nenhum orçamento definido para este mês. Adicione orçamentos para controlar seus gastos!</p>'}
      </div>
    `;

    document.getElementById('budgetsView').innerHTML = html;
    this.setupFormListeners();
  },

  handleBudgetSubmit() {
    const month = document.getElementById('budMonth').value;
    const categoryId = document.getElementById('budCategory').value;
    const amount = uiManager.parseCurrencyValue(document.getElementById('budAmount').value);

    if (this.editingId) {
      financeManager.updateBudget(this.editingId, { month, categoryId, amount });
      Toast.show('Orçamento atualizado com sucesso!', 'success');
    } else {
      financeManager.createBudget(financeManager.currentBusinessId, categoryId, month, amount);
      Toast.show('Orçamento definido com sucesso!', 'success');
    }

    this.editingId = null;
    this.renderBudgets();
  },

  editBudget(id) {
    const budget = financeManager.getBudget(id);
    if (!budget) return;

    this.editingId = id;
    this.renderBudgets();

    document.getElementById('budMonth').value = budget.month;
    document.getElementById('budCategory').value = budget.categoryId;
    document.getElementById('budAmount').value = toReais(budget.amount);

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  },

  async deleteBudget(id) {
    const confirmed = await Modal.confirmAction(
      'Excluir Orçamento',
      'Tem certeza que deseja excluir este orçamento?',
      { confirmText: 'Excluir', dangerous: true }
    );
    
    if (!confirmed) return;
    
    if (financeManager.deleteBudget(id)) {
      Toast.show('Orçamento excluído com sucesso!', 'success');
      this.renderBudgets();
    }
  },

  changeBudgetMonth(month) {
    document.getElementById('budgetMonthSelector').value = month;
    this.renderBudgets();
  },

  changeMonth(delta) {
    const current = document.getElementById('budgetMonthSelector').value;
    const [year, month] = current.split('-').map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    this.changeBudgetMonth(newMonth);
  },

  // ============================================
  // INVESTIMENTOS
  // ============================================

  renderInvestments() {
    const businessId = financeManager.currentBusinessId;
    const investments = financeManager.getInvestmentsByBusiness(businessId);
    const totalInvested = investments.reduce((sum, i) => sum + i.initialValue, 0);
    const totalCurrent = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalReturn = totalCurrent - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const html = `
      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Investimento' : '➕ Novo Investimento'}</h3>
        <form id="investmentForm" class="form-grid">
          <div class="form-group">
            <label for="invName">Nome do Investimento *</label>
            <input type="text" id="invName" placeholder="Ex: Tesouro Selic 2029" required maxlength="${CONFIG.LIMITS.MAX_NAME_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="invType">Tipo *</label>
            <select id="invType" required>
              <option value="renda_fixa">📊 Renda Fixa</option>
              <option value="renda_variavel">📈 Renda Variável</option>
              <option value="acoes">🏢 Ações</option>
              <option value="fundo">💼 Fundo</option>
              <option value="cripto">₿ Criptomoeda</option>
              <option value="imoveis">🏠 Imóveis</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="invPurchaseDate">Data de Compra</label>
            <input type="date" id="invPurchaseDate" value="${getCurrentDate()}">
          </div>
          
          <div class="form-group">
            <label for="invInitial">Valor Investido (R$) *</label>
            <input type="number" id="invInitial" placeholder="0,00" step="0.01" min="0.01" required>
          </div>
          
          <div class="form-group">
            <label for="invCurrent">Valor Atual (R$) *</label>
            <input type="number" id="invCurrent" placeholder="0,00" step="0.01" min="0" required>
          </div>
          
          <div class="form-group">
            <label for="invNotes">Observações</label>
            <input type="text" id="invNotes" placeholder="Notas adicionais">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Adicionar Investimento'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="investments-summary">
        <div class="summary-card">
          <h4>Total Investido</h4>
          <p class="amount">${formatCurrency(totalInvested)}</p>
        </div>
        <div class="summary-card">
          <h4>Valor Atual</h4>
          <p class="amount">${formatCurrency(totalCurrent)}</p>
        </div>
        <div class="summary-card">
          <h4>Rentabilidade</h4>
          <p class="amount ${totalReturn >= 0 ? 'income' : 'expense'}">
            ${totalReturn >= 0 ? '+' : ''}${formatCurrency(totalReturn)} (${returnPercentage.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div class="investments-section">
        <h3>📈 Meus Investimentos</h3>
        ${investments.length > 0 ? `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Data Compra</th>
                  <th>Valor Investido</th>
                  <th>Valor Atual</th>
                  <th>Rentabilidade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${investments.map(i => {
                  const returnData = financeManager.calculateInvestmentReturn(i);
                  return `
                    <tr>
                      <td>${sanitizeString(i.name)}</td>
                      <td>${this.getInvestmentTypeLabel(i.type)}</td>
                      <td>${formatDate(i.purchaseDate)}</td>
                      <td>${formatCurrency(i.initialValue)}</td>
                      <td>${formatCurrency(i.currentValue)}</td>
                      <td class="${returnData.value >= 0 ? 'income' : 'expense'}">
                        ${returnData.value >= 0 ? '+' : ''}${formatCurrency(returnData.value)} (${returnData.percentage.toFixed(2)}%)
                      </td>
                      <td>
                        <button class="btn-icon" onclick="uiManager.editInvestment('${i.id}')" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete" onclick="uiManager.deleteInvestment('${i.id}')" title="Excluir">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="empty-message">Nenhum investimento cadastrado. Adicione seus investimentos para acompanhar a rentabilidade!</p>'}
      </div>
    `;

    document.getElementById('investmentsView').innerHTML = html;
    this.setupFormListeners();
  },

  getInvestmentTypeLabel(type) {
    const labels = {
      'renda_fixa': '📊 Renda Fixa',
      'renda_variavel': '📈 Renda Variável',
      'acoes': '🏢 Ações',
      'fundo': '💼 Fundo',
      'cripto': '₿ Cripto',
      'imoveis': '🏠 Imóveis'
    };
    return labels[type] || type;
  },

  handleInvestmentSubmit() {
    const data = {
      name: document.getElementById('invName').value,
      type: document.getElementById('invType').value,
      purchaseDate: document.getElementById('invPurchaseDate').value,
      initialValue: toCents(document.getElementById('invInitial').value),
      currentValue: toCents(document.getElementById('invCurrent').value),
      notes: document.getElementById('invNotes').value
    };

    if (this.editingId) {
      financeManager.updateInvestment(this.editingId, data);
      Toast.show('Investimento atualizado com sucesso!', 'success');
    } else {
      financeManager.createInvestment(financeManager.currentBusinessId, data);
      Toast.show('Investimento adicionado com sucesso!', 'success');
    }

    this.editingId = null;
    this.renderInvestments();
  },

  editInvestment(id) {
    const investment = financeManager.getInvestment(id);
    if (!investment) return;

    this.editingId = id;
    this.renderInvestments();

    document.getElementById('invName').value = investment.name;
    document.getElementById('invType').value = investment.type;
    document.getElementById('invPurchaseDate').value = investment.purchaseDate;
    document.getElementById('invInitial').value = toReais(investment.initialValue);
    document.getElementById('invCurrent').value = toReais(investment.currentValue);
    document.getElementById('invNotes').value = investment.notes || '';

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  },

  async deleteInvestment(id) {
    const confirmed = await Modal.confirmAction(
      'Excluir Investimento',
      'Tem certeza que deseja excluir este investimento?',
      { confirmText: 'Excluir', dangerous: true }
    );
    
    if (!confirmed) return;
    
    if (financeManager.deleteInvestment(id)) {
      Toast.show('Investimento excluído com sucesso!', 'success');
      this.renderInvestments();
    }
  },

  // ============================================
  // DÍVIDAS
  // ============================================

  renderDebts() {
    const businessId = financeManager.currentBusinessId;
    const debts = financeManager.getDebtsByBusiness(businessId);
    const totalDebt = debts.reduce((sum, d) => sum + d.totalValue, 0);
    const totalPaid = debts.reduce((sum, d) => sum + d.paidValue, 0);
    const totalRemaining = totalDebt - totalPaid;

    const html = `
      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Dívida' : '➕ Nova Dívida'}</h3>
        <form id="debtForm" class="form-grid">
          <div class="form-group">
            <label for="debtName">Nome/Descrição *</label>
            <input type="text" id="debtName" placeholder="Ex: Financiamento do Carro" required maxlength="${CONFIG.LIMITS.MAX_NAME_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="debtType">Tipo *</label>
            <select id="debtType" required>
              <option value="emprestimo">🏦 Empréstimo</option>
              <option value="financiamento">🚗 Financiamento</option>
              <option value="cartao_credito">💳 Cartão de Crédito</option>
              <option value="pessoal">👤 Pessoal</option>
              <option value="outro">📌 Outro</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="debtTotal">Valor Total (R$) *</label>
            <input type="number" id="debtTotal" placeholder="0,00" step="0.01" min="0.01" required>
          </div>
          
          <div class="form-group">
            <label for="debtPaid">Valor Pago (R$)</label>
            <input type="number" id="debtPaid" placeholder="0,00" step="0.01" min="0" value="0">
          </div>
          
          <div class="form-group">
            <label for="debtInterest">Taxa de Juros (% a.m.)</label>
            <input type="number" id="debtInterest" placeholder="0,00" step="0.01" min="0" value="0">
          </div>
          
          <div class="form-group">
            <label for="debtInstallments">Número de Parcelas</label>
            <input type="number" id="debtInstallments" placeholder="1" min="1" value="1">
          </div>
          
          <div class="form-group">
            <label for="debtPaidInstallments">Parcelas Pagas</label>
            <input type="number" id="debtPaidInstallments" placeholder="0" min="0" value="0">
          </div>
          
          <div class="form-group">
            <label for="debtStartDate">Data de Início</label>
            <input type="date" id="debtStartDate" value="${getCurrentDate()}">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Adicionar Dívida'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="debts-summary">
        <div class="summary-card">
          <h4>Total em Dívidas</h4>
          <p class="amount expense">${formatCurrency(totalDebt)}</p>
        </div>
        <div class="summary-card">
          <h4>Total Pago</h4>
          <p class="amount income">${formatCurrency(totalPaid)}</p>
        </div>
        <div class="summary-card">
          <h4>Restante</h4>
          <p class="amount expense">${formatCurrency(totalRemaining)}</p>
        </div>
      </div>

      <div class="debts-section">
        <h3>💳 Minhas Dívidas</h3>
        ${debts.length > 0 ? `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Valor Total</th>
                  <th>Pago</th>
                  <th>Restante</th>
                  <th>Parcelas</th>
                  <th>Progresso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${debts.map(d => {
                  const remaining = d.totalValue - d.paidValue;
                  const progress = d.totalValue > 0 ? (d.paidValue / d.totalValue) * 100 : 0;
                  return `
                    <tr>
                      <td>${sanitizeString(d.name)}</td>
                      <td>${this.getDebtTypeLabel(d.type)}</td>
                      <td class="expense">${formatCurrency(d.totalValue)}</td>
                      <td class="income">${formatCurrency(d.paidValue)}</td>
                      <td class="expense">${formatCurrency(remaining)}</td>
                      <td>${d.paidInstallments || 0}/${d.installments || 1}</td>
                      <td>
                        <div class="progress-bar small">
                          <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <small>${progress.toFixed(1)}%</small>
                      </td>
                      <td>
                        <button class="btn-icon" onclick="uiManager.editDebt('${d.id}')" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete" onclick="uiManager.deleteDebt('${d.id}')" title="Excluir">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="empty-message">Nenhuma dívida cadastrada. Que bom! Ou adicione suas dívidas para acompanhá-las.</p>'}
      </div>
    `;

    document.getElementById('debtsView').innerHTML = html;
    this.setupFormListeners();
  },

  getDebtTypeLabel(type) {
    const labels = {
      'emprestimo': '🏦 Empréstimo',
      'financiamento': '🚗 Financiamento',
      'cartao_credito': '💳 Cartão',
      'pessoal': '👤 Pessoal',
      'outro': '📌 Outro'
    };
    return labels[type] || type;
  },

  handleDebtSubmit() {
    const data = {
      name: document.getElementById('debtName').value,
      type: document.getElementById('debtType').value,
      totalValue: toCents(document.getElementById('debtTotal').value),
      paidValue: toCents(document.getElementById('debtPaid').value || 0),
      interestRate: parseFloat(document.getElementById('debtInterest').value) || 0,
      installments: parseInt(document.getElementById('debtInstallments').value) || 1,
      paidInstallments: parseInt(document.getElementById('debtPaidInstallments').value) || 0,
      startDate: document.getElementById('debtStartDate').value
    };

    if (this.editingId) {
      financeManager.updateDebt(this.editingId, data);
      Toast.show('Dívida atualizada com sucesso!', 'success');
    } else {
      financeManager.createDebt(financeManager.currentBusinessId, data);
      Toast.show('Dívida adicionada com sucesso!', 'success');
    }

    this.editingId = null;
    this.renderDebts();
  },

  editDebt(id) {
    const debt = financeManager.getDebt(id);
    if (!debt) return;

    this.editingId = id;
    this.renderDebts();

    document.getElementById('debtName').value = debt.name;
    document.getElementById('debtType').value = debt.type;
    document.getElementById('debtTotal').value = toReais(debt.totalValue);
    document.getElementById('debtPaid').value = toReais(debt.paidValue);
    document.getElementById('debtInterest').value = debt.interestRate || 0;
    document.getElementById('debtInstallments').value = debt.installments || 1;
    document.getElementById('debtPaidInstallments').value = debt.paidInstallments || 0;
    document.getElementById('debtStartDate').value = debt.startDate;

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  },

  async deleteDebt(id) {
    const confirmed = await Modal.confirmAction(
      'Excluir Dívida',
      'Tem certeza que deseja excluir esta dívida?',
      { confirmText: 'Excluir', dangerous: true }
    );
    
    if (!confirmed) return;
    
    if (financeManager.deleteDebt(id)) {
      Toast.show('Dívida excluída com sucesso!', 'success');
      this.renderDebts();
    }
  },

  // ============================================
  // METAS
  // ============================================

  renderGoals() {
    const businessId = financeManager.currentBusinessId;
    const goals = financeManager.getGoalsByBusiness(businessId);

    const html = `
      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Meta' : '➕ Nova Meta'}</h3>
        <form id="goalForm" class="form-grid">
          <div class="form-group">
            <label for="goalName">Nome da Meta *</label>
            <input type="text" id="goalName" placeholder="Ex: Viagem para Europa" required maxlength="${CONFIG.LIMITS.MAX_NAME_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="goalTarget">Valor da Meta (R$) *</label>
            <input type="number" id="goalTarget" placeholder="0,00" step="0.01" min="0.01" required>
          </div>
          
          <div class="form-group">
            <label for="goalCurrent">Valor Atual (R$)</label>
            <input type="number" id="goalCurrent" placeholder="0,00" step="0.01" min="0" value="0">
          </div>
          
          <div class="form-group">
            <label for="goalDeadline">Data Limite</label>
            <input type="date" id="goalDeadline">
          </div>
          
          <div class="form-group">
            <label for="goalCategory">Categoria</label>
            <select id="goalCategory">
              <option value="">Selecione (opcional)</option>
              <option value="viagem">✈️ Viagem</option>
              <option value="compra">🛍️ Compra</option>
              <option value="emergencia">🚨 Emergência</option>
              <option value="educacao">📚 Educação</option>
              <option value="investimento">📈 Investimento</option>
              <option value="outro">📌 Outro</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Criar Meta'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="goals-section">
        <h3>🎯 Minhas Metas</h3>
        ${goals.length > 0 ? `
          <div class="goals-grid">
            ${goals.map(g => {
              const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
              const remaining = g.targetValue - g.currentValue;
              const daysLeft = g.deadline ? daysUntilDue(g.deadline) : null;
              return `
                <div class="goal-card ${progress >= 100 ? 'completed' : ''}">
                  <div class="goal-header">
                    <h4>${sanitizeString(g.name)}</h4>
                    <div class="goal-actions">
                      <button class="btn-icon" onclick="uiManager.editGoal('${g.id}')" title="Editar">✏️</button>
                      <button class="btn-icon btn-delete" onclick="uiManager.deleteGoal('${g.id}')" title="Excluir">🗑️</button>
                    </div>
                  </div>
                  <div class="goal-values">
                    <span class="current">${formatCurrency(g.currentValue)}</span>
                    <span class="separator">/</span>
                    <span class="target">${formatCurrency(g.targetValue)}</span>
                  </div>
                  <div class="progress-bar large">
                    <div class="progress-fill ${progress >= 100 ? 'completed' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                  </div>
                  <div class="goal-footer">
                    <span class="percentage">${progress.toFixed(1)}%</span>
                    ${daysLeft !== null ? `
                      <span class="deadline ${daysLeft < 0 ? 'overdue' : daysLeft < 30 ? 'warning' : ''}">
                        ${daysLeft < 0 ? `Vencida há ${Math.abs(daysLeft)} dias` : `${daysLeft} dias restantes`}
                      </span>
                    ` : ''}
                  </div>
                  ${remaining > 0 ? `<p class="remaining">Faltam ${formatCurrency(remaining)}</p>` : '<p class="completed-text">🎉 Meta alcançada!</p>'}
                </div>
              `;
            }).join('')}
          </div>
        ` : '<p class="empty-message">Nenhuma meta definida. Crie metas para acompanhar seus objetivos financeiros!</p>'}
      </div>
    `;

    document.getElementById('goalsView').innerHTML = html;
    this.setupFormListeners();
  },

  handleGoalSubmit() {
    const data = {
      name: document.getElementById('goalName').value,
      targetValue: toCents(document.getElementById('goalTarget').value),
      currentValue: toCents(document.getElementById('goalCurrent').value || 0),
      deadline: document.getElementById('goalDeadline').value || null,
      category: document.getElementById('goalCategory').value || null
    };

    if (this.editingId) {
      financeManager.updateGoal(this.editingId, data);
      Toast.show('Meta atualizada com sucesso!', 'success');
    } else {
      financeManager.createGoal(financeManager.currentBusinessId, data);
      Toast.show('Meta criada com sucesso!', 'success');
    }

    this.editingId = null;
    this.renderGoals();
  },

  editGoal(id) {
    const goal = financeManager.getGoal(id);
    if (!goal) return;

    this.editingId = id;
    this.renderGoals();

    document.getElementById('goalName').value = goal.name;
    document.getElementById('goalTarget').value = toReais(goal.targetValue);
    document.getElementById('goalCurrent').value = toReais(goal.currentValue);
    document.getElementById('goalDeadline').value = goal.deadline || '';
    document.getElementById('goalCategory').value = goal.category || '';

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  },

  async deleteGoal(id) {
    const confirmed = await Modal.confirmAction(
      'Excluir Meta',
      'Tem certeza que deseja excluir esta meta?',
      { confirmText: 'Excluir', dangerous: true }
    );
    
    if (!confirmed) return;
    
    if (financeManager.deleteGoal(id)) {
      Toast.show('Meta excluída com sucesso!', 'success');
      this.renderGoals();
    }
  },

  // ============================================
  // RELATÓRIOS
  // ============================================

  renderReports() {
    const businessId = financeManager.currentBusinessId;
    const currentMonth = getCurrentMonthYear();
    const categoryAnalysis = salesManager.getCategoryProfitAnalysis(businessId);
    
    const html = `
      <div class="reports-header">
        <h3>📑 Relatórios Financeiros</h3>
        <div class="report-filters">
          <div class="form-group">
            <label for="reportMonth">Período</label>
            <input type="month" id="reportMonth" value="${currentMonth}" onchange="uiManager.updateReports()">
          </div>
        </div>
      </div>

      <div class="reports-grid">
        <div class="report-card">
          <h4>📊 Resumo do Mês</h4>
          <div id="monthSummaryReport"></div>
        </div>
        
        <div class="report-card">
          <h4>🥧 Despesas por Categoria</h4>
          <canvas id="reportCategoryChart"></canvas>
        </div>
        
        <div class="report-card">
          <h4>📈 Evolução Patrimonial</h4>
          <canvas id="reportWealthChart"></canvas>
        </div>
        
        <div class="report-card wide">
          <h4>📋 Transações do Período</h4>
          <div id="periodTransactionsReport"></div>
        </div>
      </div>

      <!-- Análise de Vendas por Categoria de Produtos -->
      <div class="reports-category-section">
        <h3>📊 Análise de Vendas por Categoria de Produtos</h3>
        
        <div class="category-summary-cards">
          <div class="category-summary-card">
            <h4>Receita Total</h4>
            <div class="value income">${formatCurrency(categoryAnalysis.summary.totalRevenue)}</div>
          </div>
          <div class="category-summary-card">
            <h4>Custo Total</h4>
            <div class="value expense">${formatCurrency(categoryAnalysis.summary.totalCost)}</div>
          </div>
          <div class="category-summary-card">
            <h4>Lucro Total</h4>
            <div class="value ${categoryAnalysis.summary.totalProfit >= 0 ? 'income' : 'expense'}">${formatCurrency(categoryAnalysis.summary.totalProfit)}</div>
          </div>
          <div class="category-summary-card">
            <h4>Margem Média</h4>
            <div class="value ${categoryAnalysis.summary.overallMargin >= 0 ? 'income' : 'expense'}">${categoryAnalysis.summary.overallMargin.toFixed(1)}%</div>
          </div>
        </div>

        <div class="report-card wide">
          <h4>🏆 Ranking de Categorias por Vendas</h4>
          <canvas id="categoryRevenueChart" style="max-height: 300px;"></canvas>
        </div>

        <div class="report-card wide">
          <h4>💰 Lucro por Categoria</h4>
          <canvas id="categoryProfitChart" style="max-height: 300px;"></canvas>
        </div>

        ${categoryAnalysis.categories.length > 0 ? `
          <div class="report-card wide">
            <h4>📋 Detalhamento por Categoria</h4>
            <div class="table-responsive">
              <table class="data-table category-ranking-table">
                <thead>
                  <tr>
                    <th class="rank-cell">#</th>
                    <th>Categoria</th>
                    <th>Qtd Vendida</th>
                    <th>Receita</th>
                    <th>Custo</th>
                    <th>Lucro</th>
                    <th>Margem</th>
                    <th>% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoryAnalysis.categories.map((cat, index) => {
                    const percentOfTotal = categoryAnalysis.summary.totalRevenue > 0 
                      ? (cat.totalRevenue / categoryAnalysis.summary.totalRevenue * 100).toFixed(1) 
                      : 0;
                    return `
                      <tr>
                        <td class="rank-cell"><strong>#${index + 1}</strong></td>
                        <td>
                          <div class="category-cell">
                            <span style="color: ${cat.color}">${cat.icon}</span>
                            <span>${cat.name}</span>
                          </div>
                        </td>
                        <td>${cat.totalSold} un</td>
                        <td class="income">${formatCurrency(cat.totalRevenue)}</td>
                        <td class="expense">${formatCurrency(cat.totalCost)}</td>
                        <td class="${cat.totalProfit >= 0 ? 'income' : 'expense'}">${formatCurrency(cat.totalProfit)}</td>
                        <td class="${cat.profitMargin >= 0 ? 'income' : 'expense'}">${cat.profitMargin.toFixed(1)}%</td>
                        <td>
                          <div class="progress-bar">
                            <div class="progress" style="width: ${percentOfTotal}%; background-color: ${cat.color}"></div>
                          </div>
                          <small>${percentOfTotal}%</small>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : '<p class="empty-message">Nenhuma venda registrada para análise por categoria.</p>'}
      </div>
    `;

    document.getElementById('reportsView').innerHTML = html;
    this.updateReports();
  },

  updateReports() {
    const businessId = financeManager.currentBusinessId;
    const month = document.getElementById('reportMonth')?.value || getCurrentMonthYear();
    
    // Resumo do mês
    const summary = financeManager.getMonthSummary(businessId, month);
    document.getElementById('monthSummaryReport').innerHTML = `
      <div class="summary-stats">
        <div class="stat-row">
          <span>Receitas:</span>
          <span class="income">${formatCurrency(summary.income)}</span>
        </div>
        <div class="stat-row">
          <span>Despesas:</span>
          <span class="expense">${formatCurrency(summary.expense)}</span>
        </div>
        <div class="stat-row total">
          <span>Saldo:</span>
          <span class="${summary.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(summary.balance)}</span>
        </div>
        <div class="stat-row">
          <span>Transações:</span>
          <span>${summary.transactionCount}</span>
        </div>
      </div>
    `;

    // Transações do período
    const transactions = financeManager.getTransactionsByMonth(businessId, month);
    document.getElementById('periodTransactionsReport').innerHTML = transactions.length > 0 ? `
      <div class="table-responsive">
        <table class="data-table compact">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 20).map(t => {
              const category = financeManager.getCategory(t.categoryId);
              return `
                <tr>
                  <td>${formatDate(t.date)}</td>
                  <td>${sanitizeString(t.description)}</td>
                  <td>${category ? `${category.icon} ${category.name}` : '-'}</td>
                  <td class="${t.type === 'receita' ? 'income' : 'expense'}">${formatCurrency(t.amount)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${transactions.length > 20 ? `<p class="more-info">Mostrando 20 de ${transactions.length} transações</p>` : ''}
    ` : '<p class="empty-message">Nenhuma transação no período selecionado.</p>';

    // Gráficos
    this.renderReportCharts(businessId, month);
  },

  renderReportCharts(businessId, month) {
    // Gráfico de categorias de despesas
    const categoryData = financeManager.getExpensesByCategory(businessId, month);
    const categoryCtx = document.getElementById('reportCategoryChart');
    
    if (categoryCtx && typeof Chart !== 'undefined') {
      if (this.charts.reportCategory) this.charts.reportCategory.destroy();
      
      this.charts.reportCategory = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: categoryData.map(c => c.name),
          datasets: [{
            data: categoryData.map(c => toReais(c.total)),
            backgroundColor: categoryData.map(c => c.color)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    }

    // Gráfico de evolução patrimonial
    const wealthData = financeManager.getWealthEvolution(businessId, 6);
    const wealthCtx = document.getElementById('reportWealthChart');
    
    if (wealthCtx && typeof Chart !== 'undefined') {
      if (this.charts.reportWealth) this.charts.reportWealth.destroy();
      
      this.charts.reportWealth = new Chart(wealthCtx, {
        type: 'line',
        data: {
          labels: wealthData.map(w => w.month),
          datasets: [{
            label: 'Patrimônio',
            data: wealthData.map(w => toReais(w.value)),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
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

    // Gráficos de categorias de produtos
    this.renderProductCategoryCharts(businessId);
  },

  renderProductCategoryCharts(businessId) {
    const categoryStats = salesManager.getCategoryStats(businessId);
    
    // Gráfico de receita por categoria
    const revenueCtx = document.getElementById('categoryRevenueChart');
    if (revenueCtx && typeof Chart !== 'undefined' && categoryStats.length > 0) {
      if (this.charts.categoryRevenue) this.charts.categoryRevenue.destroy();
      
      this.charts.categoryRevenue = new Chart(revenueCtx, {
        type: 'bar',
        data: {
          labels: categoryStats.map(c => `${c.icon} ${c.name}`),
          datasets: [{
            label: 'Receita',
            data: categoryStats.map(c => toReais(c.totalRevenue)),
            backgroundColor: categoryStats.map(c => c.color),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => `Receita: ${formatCurrency(context.raw * 100)}`
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: value => formatCurrency(value * 100)
              }
            }
          }
        }
      });
    }

    // Gráfico de lucro por categoria
    const profitCtx = document.getElementById('categoryProfitChart');
    if (profitCtx && typeof Chart !== 'undefined' && categoryStats.length > 0) {
      if (this.charts.categoryProfit) this.charts.categoryProfit.destroy();
      
      this.charts.categoryProfit = new Chart(profitCtx, {
        type: 'bar',
        data: {
          labels: categoryStats.map(c => `${c.icon} ${c.name}`),
          datasets: [
            {
              label: 'Receita',
              data: categoryStats.map(c => toReais(c.totalRevenue)),
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderRadius: 4
            },
            {
              label: 'Custo',
              data: categoryStats.map(c => toReais(c.totalCost)),
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderRadius: 4
            },
            {
              label: 'Lucro',
              data: categoryStats.map(c => toReais(c.totalProfit)),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw * 100)}`
              }
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
  },

  // ============================================
  // IMPORTAR/EXPORTAR
  // ============================================

  renderImportExport() {
    const html = `
      <div class="import-export-section">
        <div class="export-section">
          <h3>📤 Exportar Dados</h3>
          <p>Faça backup dos seus dados ou exporte para outros formatos:</p>
          
          <div class="export-buttons">
            <button onclick="uiManager.exportJSON()" class="btn-export">
              <span class="btn-icon">💾</span>
              <span class="btn-text">Backup Completo (JSON)</span>
            </button>
            <button onclick="uiManager.exportCSV('transactions')" class="btn-export">
              <span class="btn-icon">📊</span>
              <span class="btn-text">Transações (CSV)</span>
            </button>
            <button onclick="uiManager.exportCSV('accounts')" class="btn-export">
              <span class="btn-icon">🏦</span>
              <span class="btn-text">Contas (CSV)</span>
            </button>
            <button onclick="uiManager.exportCSV('categories')" class="btn-export">
              <span class="btn-icon">🏷️</span>
              <span class="btn-text">Categorias (CSV)</span>
            </button>
            <button onclick="uiManager.exportCSV('sales')" class="btn-export">
              <span class="btn-icon">🛒</span>
              <span class="btn-text">Vendas (CSV)</span>
            </button>
            <button onclick="uiManager.exportCSV('debtors')" class="btn-export">
              <span class="btn-icon">👤</span>
              <span class="btn-text">Devedores (CSV)</span>
            </button>
            <button onclick="uiManager.exportExcel()" class="btn-export">
              <span class="btn-icon">📑</span>
              <span class="btn-text">Planilha Completa (XLSX)</span>
            </button>
          </div>
        </div>

        <div class="import-section">
          <h3>📥 Importar Dados</h3>
          <p>Restaure um backup ou importe dados de planilhas:</p>
          
          <div class="import-area">
            <div class="drop-zone" id="dropZone">
              <span class="drop-icon">📁</span>
              <p>Arraste um arquivo aqui ou clique para selecionar</p>
              <small>Formatos aceitos: JSON, CSV, XLSX</small>
              <input type="file" id="importFile" accept=".json,.csv,.xlsx" onchange="uiManager.handleFileImport(this.files[0])" style="display: none;">
            </div>
          </div>
          
          <div class="import-options" id="importOptions" style="display: none;">
            <h4>Opções de Importação CSV/XLSX</h4>
            <div class="form-group">
              <label for="importType">Tipo de dados:</label>
              <select id="importType">
                <option value="transactions">Transações</option>
                <option value="accounts">Contas</option>
                <option value="categories">Categorias</option>
                <option value="sales">Vendas</option>
                <option value="customers">Clientes</option>
                <option value="products">Produtos</option>
                <option value="debtors">Devedores</option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="importReplace"> Substituir dados existentes
              </label>
            </div>
            <button class="btn-primary" id="confirmImport" onclick="uiManager.confirmImport()">Importar</button>
            <button class="btn-secondary" onclick="uiManager.cancelImport()">Cancelar</button>
          </div>
        </div>

        <div class="import-help">
          <h3>📖 Ajuda</h3>
          <div class="help-cards">
            <div class="help-card">
              <h4>Backup JSON</h4>
              <p>Formato completo que preserva todos os dados e configurações. Ideal para backup e restauração.</p>
            </div>
            <div class="help-card">
              <h4>Exportação CSV</h4>
              <p>Formato compatível com Excel e Google Sheets. Útil para análises externas.</p>
            </div>
            <div class="help-card">
              <h4>Planilha XLSX</h4>
              <p>Arquivo Excel com múltiplas abas contendo todos os dados organizados.</p>
            </div>
            <div class="help-card">
              <h4>Importação</h4>
              <p>Importe arquivos JSON para restaurar backup completo, ou CSV/XLSX para importar dados específicos.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('importExportView').innerHTML = html;
    this.setupDropZone();
  },

  setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

    dropZone.addEventListener('click', () => {
      document.getElementById('importFile').click();
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.handleFileImport(file);
    });
  },

  pendingImportData: null,
  pendingImportFile: null,

  handleFileImport(file) {
    if (!file) return;

    this.pendingImportFile = file;
    const reader = new FileReader();
    
    if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (confirm('Isso substituirá todos os dados atuais. Deseja continuar?')) {
            if (financeManager.importAllData(data)) {
              // Também importar dados de vendas e devedores se existirem
              if (data.sales && typeof salesManager !== 'undefined') {
                salesManager.importData(data);
              }
              if (data.debtors && typeof debtorsManager !== 'undefined') {
                debtorsManager.importData(data);
              }
              
              // Registrar no log
              if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
                authManager.log(LOG_ACTIONS.IMPORT_DATA, 'Importou backup dos dados');
              }
              
              Toast.show('Dados importados com sucesso!', 'success');
              location.reload();
            } else {
              Toast.show('Erro ao importar dados', 'error');
            }
          }
        } catch (error) {
          Toast.show('Erro ao ler arquivo: ' + error.message, 'error');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      reader.onload = (e) => {
        try {
          this.pendingImportData = this.parseCSV(e.target.result);
          document.getElementById('importOptions').style.display = 'block';
          Toast.show('Arquivo CSV carregado. Selecione o tipo de dados e confirme.', 'info');
        } catch (error) {
          Toast.show('Erro ao ler arquivo CSV: ' + error.message, 'error');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
      reader.onload = (e) => {
        try {
          if (typeof XLSX === 'undefined') {
            Toast.show('Biblioteca XLSX não carregada', 'error');
            return;
          }
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          this.pendingImportData = this.parseXLSX(workbook);
          document.getElementById('importOptions').style.display = 'block';
          Toast.show('Arquivo XLSX carregado. Selecione o tipo de dados e confirme.', 'info');
        } catch (error) {
          Toast.show('Erro ao ler arquivo XLSX: ' + error.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Toast.show('Formato de arquivo não suportado', 'warning');
    }
  },

  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  },

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  },

  parseXLSX(workbook) {
    // Retorna dados da primeira aba
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet);
  },

  confirmImport() {
    if (!this.pendingImportData || this.pendingImportData.length === 0) {
      Toast.show('Nenhum dado para importar', 'warning');
      return;
    }

    const importType = document.getElementById('importType').value;
    const replace = document.getElementById('importReplace').checked;
    const businessId = financeManager.currentBusinessId;

    try {
      let imported = 0;
      
      switch (importType) {
        case 'transactions':
          imported = this.importTransactions(this.pendingImportData, businessId, replace);
          break;
        case 'accounts':
          imported = this.importAccounts(this.pendingImportData, businessId, replace);
          break;
        case 'categories':
          imported = this.importCategories(this.pendingImportData, businessId, replace);
          break;
        case 'sales':
          imported = this.importSales(this.pendingImportData, businessId, replace);
          break;
        case 'customers':
          imported = this.importCustomers(this.pendingImportData, businessId, replace);
          break;
        case 'products':
          imported = this.importProducts(this.pendingImportData, businessId, replace);
          break;
        case 'debtors':
          imported = this.importDebtors(this.pendingImportData, businessId, replace);
          break;
      }

      // Registrar no log
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.IMPORT_DATA, `Importou ${imported} ${importType}`);
      }

      Toast.show(`${imported} registros importados com sucesso!`, 'success');
      this.cancelImport();
      this.renderImportExport();
    } catch (error) {
      Toast.show('Erro ao importar: ' + error.message, 'error');
    }
  },

  importTransactions(data, businessId, replace) {
    if (replace) {
      // Limpar transações existentes
      const existing = financeManager.getTransactionsByBusiness(businessId);
      existing.forEach(t => financeManager.deleteTransaction(t.id));
    }

    let count = 0;
    data.forEach(row => {
      try {
        const transaction = {
          description: row['Descrição'] || row['description'] || row['Description'] || '',
          amount: toCents(parseFloat(row['Valor'] || row['value'] || row['Value'] || row['amount'] || 0)),
          type: this.normalizeTransactionType(row['Tipo'] || row['type'] || row['Type'] || 'despesa'),
          date: this.normalizeDate(row['Data'] || row['date'] || row['Date']),
          status: row['Status'] || row['status'] || 'pago'
        };
        
        if (transaction.description && transaction.amount > 0) {
          financeManager.createTransaction(businessId, transaction);
          count++;
        }
      } catch (e) {
        console.error('Erro ao importar transação:', e);
      }
    });
    
    return count;
  },

  importAccounts(data, businessId, replace) {
    if (replace) {
      const existing = financeManager.getAccountsByBusiness(businessId);
      existing.forEach(a => financeManager.deleteAccount(a.id));
    }

    let count = 0;
    data.forEach(row => {
      try {
        const account = {
          name: row['Nome'] || row['name'] || row['Name'] || '',
          type: row['Tipo'] || row['type'] || row['Type'] || 'banco',
          balance: toCents(parseFloat(row['Saldo'] || row['balance'] || row['Balance'] || 0))
        };
        
        if (account.name) {
          financeManager.createAccount(businessId, account);
          count++;
        }
      } catch (e) {
        console.error('Erro ao importar conta:', e);
      }
    });
    
    return count;
  },

  importCategories(data, businessId, replace) {
    if (replace) {
      const existing = financeManager.getCategoriesByBusiness(businessId);
      existing.forEach(c => financeManager.deleteCategory(c.id));
    }

    let count = 0;
    data.forEach(row => {
      try {
        const category = {
          name: row['Nome'] || row['name'] || row['Name'] || '',
          type: this.normalizeTransactionType(row['Tipo'] || row['type'] || row['Type'] || 'despesa'),
          icon: row['Ícone'] || row['icon'] || row['Icon'] || '📌',
          color: row['Cor'] || row['color'] || row['Color'] || '#3B82F6'
        };
        
        if (category.name) {
          financeManager.createCategory(businessId, category);
          count++;
        }
      } catch (e) {
        console.error('Erro ao importar categoria:', e);
      }
    });
    
    return count;
  },

  importSales(data, businessId, replace) {
    if (typeof salesManager === 'undefined') {
      Toast.show('Módulo de vendas não disponível', 'warning');
      return 0;
    }

    let count = 0;
    data.forEach(row => {
      try {
        const sale = {
          total: toCents(parseFloat(row['Total'] || row['total'] || 0)),
          paid: toCents(parseFloat(row['Pago'] || row['paid'] || 0)),
          status: row['Status'] || row['status'] || 'pendente',
          date: this.normalizeDate(row['Data'] || row['date'] || row['Date']),
          notes: row['Notas'] || row['notes'] || ''
        };
        
        if (sale.total > 0) {
          salesManager.createSale(businessId, sale);
          count++;
        }
      } catch (e) {
        console.error('Erro ao importar venda:', e);
      }
    });
    
    return count;
  },

  importCustomers(data, businessId, replace) {
    if (typeof salesManager === 'undefined') {
      Toast.show('Módulo de vendas não disponível', 'warning');
      return 0;
    }

    let count = 0;
    data.forEach(row => {
      try {
        const customer = {
          name: row['Nome'] || row['name'] || row['Name'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Telefone'] || row['phone'] || row['Phone'] || '',
          address: row['Endereço'] || row['address'] || row['Address'] || ''
        };
        
        if (customer.name) {
          salesManager.createCustomer(businessId, customer);
          count++;
        }
      } catch (e) {
        console.error('Erro ao importar cliente:', e);
      }
    });
    
    return count;
  },

  importProducts(data, businessId, replace) {
    if (typeof salesManager === 'undefined') {
      Toast.show('Módulo de vendas não disponível', 'warning');
      return 0;
    }

    let count = 0;
    data.forEach(row => {
      try {
        const product = {
          name: row['Nome'] || row['name'] || row['Name'] || '',
          description: row['Descrição'] || row['description'] || '',
          price: toCents(parseFloat(row['Preço'] || row['price'] || row['Price'] || 0)),
          cost: toCents(parseFloat(row['Custo'] || row['cost'] || row['Cost'] || 0)),
          stock: parseInt(row['Estoque'] || row['stock'] || row['Stock'] || 0)
        };
        
        if (product.name) {
          salesManager.createProduct(businessId, product);
          count++;
        }
      } catch (e) {
        console.error('Erro ao importar produto:', e);
      }
    });
    
    return count;
  },

  importDebtors(data, businessId, replace) {
    if (typeof debtorsManager === 'undefined') {
      Toast.show('Módulo de devedores não disponível', 'warning');
      return 0;
    }

    let count = 0;
    data.forEach(row => {
      try {
        const debtor = {
          name: row['Nome'] || row['name'] || row['Name'] || '',
          phone: row['Telefone'] || row['phone'] || row['Phone'] || '',
          email: row['Email'] || row['email'] || '',
          total: toCents(parseFloat(row['Total'] || row['total'] || 0)),
          paid: toCents(parseFloat(row['Pago'] || row['paid'] || 0)),
          status: row['Status'] || row['status'] || 'ativo',
          dueDate: this.normalizeDate(row['Vencimento'] || row['dueDate'] || row['DueDate']),
          notes: row['Notas'] || row['notes'] || ''
        };
        
        if (debtor.name && debtor.total > 0) {
          debtorsManager.createDebtor(businessId, debtor);
          count++;
        }
      } catch (e) {
        console.error('Erro ao importar devedor:', e);
      }
    });
    
    return count;
  },

  normalizeTransactionType(type) {
    const typeMap = {
      'receita': 'receita',
      'income': 'receita',
      'entrada': 'receita',
      'despesa': 'despesa',
      'expense': 'despesa',
      'saída': 'despesa',
      'saida': 'despesa',
      'transferencia': 'transferencia',
      'transfer': 'transferencia'
    };
    return typeMap[type.toLowerCase()] || 'despesa';
  },

  normalizeDate(dateStr) {
    if (!dateStr) return getCurrentDate();
    
    // Tentar diferentes formatos
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return dateStr;
        } else {
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }
    
    // Tentar parse direto
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return getCurrentDate();
  },

  cancelImport() {
    this.pendingImportData = null;
    this.pendingImportFile = null;
    document.getElementById('importOptions').style.display = 'none';
    document.getElementById('importFile').value = '';
  },

  exportCSV(type) {
    const businessId = financeManager.currentBusinessId;
    let csv = '';
    let filename = '';

    switch (type) {
      case 'transactions':
        const transactions = financeManager.getTransactionsByBusiness(businessId);
        csv = 'Data,Descrição,Conta,Categoria,Tipo,Valor,Status\n';
        transactions.forEach(t => {
          const account = financeManager.getAccount(t.accountId);
          const category = financeManager.getCategory(t.categoryId);
          csv += `${formatDate(t.date)},"${t.description}","${account?.name || ''}","${category?.name || ''}",${t.type},${toReais(t.amount)},${t.status}\n`;
        });
        filename = `transacoes_${getCurrentDate()}.csv`;
        break;
        
      case 'accounts':
        const accounts = financeManager.getAccountsByBusiness(businessId);
        csv = 'Nome,Tipo,Saldo\n';
        accounts.forEach(a => {
          csv += `"${a.name}",${a.type},${toReais(a.balance)}\n`;
        });
        filename = `contas_${getCurrentDate()}.csv`;
        break;
        
      case 'categories':
        const categories = financeManager.getCategoriesByBusiness(businessId);
        csv = 'Nome,Tipo,Ícone,Cor\n';
        categories.forEach(c => {
          csv += `"${c.name}",${c.type},"${c.icon}","${c.color}"\n`;
        });
        filename = `categorias_${getCurrentDate()}.csv`;
        break;
        
      case 'sales':
        if (typeof salesManager !== 'undefined') {
          const sales = salesManager.getSalesByBusiness(businessId);
          csv = 'Data,Cliente,Total,Pago,Status,Notas\n';
          sales.forEach(s => {
            const customer = salesManager.getCustomer(s.customerId);
            csv += `${formatDate(s.date)},"${customer?.name || ''}",${toReais(s.total)},${toReais(s.paid)},${s.status},"${s.notes || ''}"\n`;
          });
          filename = `vendas_${getCurrentDate()}.csv`;
        }
        break;
        
      case 'debtors':
        if (typeof debtorsManager !== 'undefined') {
          const debtors = debtorsManager.getDebtorsByBusiness(businessId);
          csv = 'Nome,Telefone,Email,Total,Pago,Status,Vencimento,Notas\n';
          debtors.forEach(d => {
            csv += `"${d.name}","${d.phone || ''}","${d.email || ''}",${toReais(d.total)},${toReais(d.paid)},${d.status},${formatDate(d.dueDate)},"${d.notes || ''}"\n`;
          });
          filename = `devedores_${getCurrentDate()}.csv`;
        }
        break;
    }

    if (csv) {
      // Adicionar BOM para UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Registrar no log
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        authManager.log(LOG_ACTIONS.EXPORT_DATA, `Exportou ${type} em CSV`);
      }
      
      Toast.show('Arquivo exportado com sucesso!', 'success');
    }
  },

  exportExcel() {
    if (typeof XLSX === 'undefined') {
      Toast.show('Biblioteca XLSX não carregada', 'error');
      return;
    }

    const businessId = financeManager.currentBusinessId;
    const workbook = XLSX.utils.book_new();

    // Transações
    const transactions = financeManager.getTransactionsByBusiness(businessId).map(t => ({
      'Data': formatDate(t.date),
      'Descrição': t.description,
      'Conta': financeManager.getAccount(t.accountId)?.name || '',
      'Categoria': financeManager.getCategory(t.categoryId)?.name || '',
      'Tipo': t.type,
      'Valor': toReais(t.amount),
      'Status': t.status
    }));
    if (transactions.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactions), 'Transações');
    }

    // Contas
    const accounts = financeManager.getAccountsByBusiness(businessId).map(a => ({
      'Nome': a.name,
      'Tipo': a.type,
      'Saldo': toReais(a.balance)
    }));
    if (accounts.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(accounts), 'Contas');
    }

    // Categorias
    const categories = financeManager.getCategoriesByBusiness(businessId).map(c => ({
      'Nome': c.name,
      'Tipo': c.type,
      'Ícone': c.icon,
      'Cor': c.color
    }));
    if (categories.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categories), 'Categorias');
    }

    // Vendas (se disponível)
    if (typeof salesManager !== 'undefined') {
      const sales = salesManager.getSalesByBusiness(businessId).map(s => ({
        'Data': formatDate(s.date),
        'Cliente': salesManager.getCustomer(s.customerId)?.name || '',
        'Total': toReais(s.total),
        'Pago': toReais(s.paid),
        'Status': s.status
      }));
      if (sales.length > 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sales), 'Vendas');
      }

      const customers = salesManager.getCustomersByBusiness(businessId).map(c => ({
        'Nome': c.name,
        'Email': c.email || '',
        'Telefone': c.phone || '',
        'Endereço': c.address || ''
      }));
      if (customers.length > 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(customers), 'Clientes');
      }

      const products = salesManager.getProductsByBusiness(businessId).map(p => ({
        'Nome': p.name,
        'Descrição': p.description || '',
        'Preço': toReais(p.price),
        'Custo': toReais(p.cost),
        'Estoque': p.stock || 0
      }));
      if (products.length > 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(products), 'Produtos');
      }
    }

    // Devedores (se disponível)
    if (typeof debtorsManager !== 'undefined') {
      const debtors = debtorsManager.getDebtorsByBusiness(businessId).map(d => ({
        'Nome': d.name,
        'Telefone': d.phone || '',
        'Email': d.email || '',
        'Total': toReais(d.total),
        'Pago': toReais(d.paid),
        'Status': d.status,
        'Vencimento': formatDate(d.dueDate)
      }));
      if (debtors.length > 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(debtors), 'Devedores');
      }
    }

    // Investimentos
    const investments = financeManager.getInvestmentsByBusiness(businessId).map(i => ({
      'Nome': i.name,
      'Tipo': i.type,
      'Valor Investido': toReais(i.initialValue),
      'Valor Atual': toReais(i.currentValue),
      'Data Compra': formatDate(i.purchaseDate)
    }));
    if (investments.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(investments), 'Investimentos');
    }

    // Dívidas
    const debts = financeManager.getDebtsByBusiness(businessId).map(d => ({
      'Nome': d.name,
      'Tipo': d.type,
      'Valor Total': toReais(d.totalValue),
      'Valor Pago': toReais(d.paidValue),
      'Parcelas': `${d.paidInstallments || 0}/${d.installments || 1}`
    }));
    if (debts.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(debts), 'Dívidas');
    }

    // Metas
    const goals = financeManager.getGoalsByBusiness(businessId).map(g => ({
      'Nome': g.name,
      'Valor Meta': toReais(g.targetValue),
      'Valor Atual': toReais(g.currentValue),
      'Data Limite': formatDate(g.deadline)
    }));
    if (goals.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(goals), 'Metas');
    }

    XLSX.writeFile(workbook, `gerenciador_financeiro_${getCurrentDate()}.xlsx`);
    
    // Registrar no log
    if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
      authManager.log(LOG_ACTIONS.EXPORT_DATA, 'Exportou planilha Excel completa');
    }
    
    Toast.show('Planilha exportada com sucesso!', 'success');
  },

  // ============================================
  // CONFIGURAÇÕES
  // ============================================

  renderSettings() {
    const settings = financeManager.getSettings();

    const html = `
      <div class="settings-section">
        <h3>⚙️ Configurações Gerais</h3>
        
        <div class="settings-group">
          <div class="setting-item">
            <div class="setting-info">
              <h4>🌙 Modo Escuro</h4>
              <p>Ativa o tema escuro para reduzir o cansaço visual</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="settingDarkMode" ${settings.darkMode ? 'checked' : ''} onchange="uiManager.toggleDarkMode()">
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <h4>🔔 Notificações</h4>
              <p>Exibe notificações de confirmação das ações</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="settingNotifications" ${settings.notifications ? 'checked' : ''} onchange="uiManager.updateSetting('notifications', this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>👤 Perfis Financeiros</h3>
        <p>Gerencie diferentes perfis para separar finanças pessoais, empresariais, etc.</p>
        
        <div class="profiles-list">
          ${financeManager.businesses.map(b => `
            <div class="profile-item ${b.id === financeManager.currentBusinessId ? 'active' : ''}">
              <div class="profile-info">
                <h4>${sanitizeString(b.name)}</h4>
                <small>${sanitizeString(b.description)}</small>
              </div>
              <div class="profile-actions">
                ${b.id !== financeManager.currentBusinessId ? `
                  <button class="btn-small" onclick="uiManager.switchProfile('${b.id}')">Selecionar</button>
                ` : '<span class="current-badge">Atual</span>'}
              </div>
            </div>
          `).join('')}
        </div>
        
        <button class="btn-secondary" onclick="uiManager.showNewProfileForm()">➕ Novo Perfil</button>
      </div>

      <div class="settings-section danger-zone">
        <h3>⚠️ Zona de Perigo</h3>
        
        <div class="danger-actions">
          <button class="btn-danger" onclick="uiManager.clearAllData()">
            🗑️ Limpar Todos os Dados
          </button>
          <p class="warning-text">Esta ação é irreversível e apagará todos os seus dados.</p>
        </div>
      </div>

      <div class="settings-section">
        <h3>ℹ️ Sobre</h3>
        <div class="about-info">
          <p><strong>${CONFIG.APP_NAME}</strong></p>
          <p>Versão ${CONFIG.APP_VERSION}</p>
          <p>Desenvolvido com ❤️ para ajudar você a controlar suas finanças.</p>
        </div>
      </div>
    `;

    document.getElementById('settingsView').innerHTML = html;
  },

  updateSetting(key, value) {
    financeManager.updateSettings({ [key]: value });
    Toast.show('Configuração atualizada', 'success');
  },

  switchProfile(id) {
    if (financeManager.switchBusiness(id)) {
      Toast.show('Perfil alterado com sucesso!', 'success');
      this.switchView('dashboard');
    }
  },

  async showNewProfileForm() {
    const name = await Modal.prompt(
      'Novo Perfil',
      'Digite o nome do novo perfil:',
      '',
      { placeholder: 'Ex: Empresa, Freelance...', required: true }
    );
    
    if (!name) return;
    
    const description = await Modal.prompt(
      'Descrição',
      'Digite uma descrição (opcional):',
      '',
      { placeholder: 'Ex: Finanças da minha empresa...' }
    );
    
    financeManager.createBusiness(name, description || '', CONFIG.BUSINESS_TYPES.PERSONAL);
    Toast.show('Perfil criado com sucesso!', 'success');
    this.renderSettings();
  },

  async clearAllData() {
    const confirmed = await Modal.confirmAction(
      'Limpar Todos os Dados',
      'ATENÇÃO: Esta ação irá apagar TODOS os seus dados permanentemente. Deseja continuar?',
      { confirmText: 'Sim, Continuar', dangerous: true }
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = await Modal.confirmAction(
      'Confirmação Final',
      'Tem certeza absoluta? Esta ação NÃO pode ser desfeita!',
      { confirmText: 'Limpar Tudo', dangerous: true }
    );
    
    if (!doubleConfirm) return;
    
    // Registrar no log antes de limpar
    if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
      authManager.log(LOG_ACTIONS.CLEAR_DATA, 'Limpou todos os dados');
    }
    
    const result = await financeManager.clearAllData();
    if (result) {
      Toast.show('Dados limpos com sucesso!', 'success');
      setTimeout(() => location.reload(), 1000);
    }
  }
});
