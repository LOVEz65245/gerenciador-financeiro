// ============================================
// VIEWS DO SISTEMA DE DEVEDORES
// ============================================

Object.assign(UIManager.prototype, {

  // ============================================
  // DEVEDORES
  // ============================================

  renderDebtors() {
    const businessId = financeManager.currentBusinessId;
    const debtors = debtorsManager.getDebtorsByBusiness(businessId);
    const stats = debtorsManager.getStats(businessId);
    const overdueDebtors = debtorsManager.getOverdueDebtors(businessId);
    const upcomingDues = debtorsManager.getUpcomingDues(businessId, 7);

    const html = `
      <div class="debtors-stats">
        <div class="stat-card">
          <div class="stat-icon primary-bg">👥</div>
          <div class="stat-info">
            <h3>Total de Devedores</h3>
            <p class="amount">${stats.totalDebtors}</p>
            <small>${stats.activeDebtors} ativos</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning-bg">💰</div>
          <div class="stat-info">
            <h3>A Receber</h3>
            <p class="amount">${formatCurrency(stats.totalToReceive)}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon income-bg">✅</div>
          <div class="stat-info">
            <h3>Recebido</h3>
            <p class="amount income">${formatCurrency(stats.totalReceived)}</p>
            <small>${stats.paidDebtors} quitados</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon expense-bg">⚠️</div>
          <div class="stat-info">
            <h3>Em Atraso</h3>
            <p class="amount expense">${formatCurrency(stats.totalOverdue)}</p>
            <small>${stats.overdueDebtors} devedores</small>
          </div>
        </div>
      </div>

      ${overdueDebtors.length > 0 ? `
        <div class="alert-section alert-danger">
          <h4>⚠️ Devedores em Atraso (${overdueDebtors.length})</h4>
          <div class="overdue-list">
            ${overdueDebtors.slice(0, 5).map(d => {
              const nextDue = debtorsManager.getNextDueDate(d);
              const daysLate = nextDue ? Math.abs(daysUntilDue(nextDue)) : 0;
              const remainingAmount = d.remainingAmount || d.remainingValue || 
                ((d.totalAmount || d.totalValue || 0) - (d.paidAmount || d.paidValue || 0));
              return `
                <div class="overdue-item">
                  <div class="overdue-info">
                    <strong>${d.name || 'Sem nome'}</strong>
                    <span class="overdue-amount">${formatCurrency(remainingAmount)}</span>
                  </div>
                  <div class="overdue-details">
                    <span class="days-late">${daysLate} dias em atraso</span>
                    <button class="btn-sm btn-primary" onclick="uiManager.showDebtorPaymentModal('${d.id}')">Receber</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${upcomingDues.length > 0 ? `
        <div class="alert-section alert-warning">
          <h4>📅 Vencimentos Próximos (7 dias)</h4>
          <div class="upcoming-list">
            ${upcomingDues.slice(0, 5).map(d => {
              const nextDue = debtorsManager.getNextDueDate(d);
              const daysLeft = nextDue ? daysUntilDue(nextDue) : 0;
              const remainingAmount = d.remainingAmount || d.remainingValue || 
                ((d.totalAmount || d.totalValue || 0) - (d.paidAmount || d.paidValue || 0));
              return `
                <div class="upcoming-item">
                  <div class="upcoming-info">
                    <strong>${d.name || 'Sem nome'}</strong>
                    <span>${formatCurrency(remainingAmount)}</span>
                  </div>
                  <div class="upcoming-details">
                    <span class="days-left">${daysLeft === 0 ? 'Vence hoje' : `Vence em ${daysLeft} dia(s)`}</span>
                    <span class="due-date">${formatDate(nextDue)}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Devedor' : '➕ Novo Devedor'}</h3>
        <form id="debtorForm" class="form-grid">
          <div class="form-group">
            <label for="debtorName">Nome *</label>
            <input type="text" id="debtorName" placeholder="Nome completo" required maxlength="${CONFIG.LIMITS.MAX_NAME_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="debtorPhone">Telefone</label>
            <input type="tel" id="debtorPhone" placeholder="(00) 00000-0000">
          </div>

          <div class="form-group">
            <label for="debtorEmail">E-mail</label>
            <input type="email" id="debtorEmail" placeholder="email@exemplo.com">
          </div>

          <div class="form-group">
            <label for="debtorDocument">CPF/CNPJ</label>
            <input type="text" id="debtorDocument" placeholder="000.000.000-00">
          </div>

          <div class="form-group full-width">
            <label for="debtorAddress">Endereço</label>
            <input type="text" id="debtorAddress" placeholder="Endereço completo">
          </div>

          <div class="form-group">
            <label for="debtorAmount">Valor Total (R$) *</label>
            <input type="number" id="debtorAmount" placeholder="0,00" step="0.01" min="0.01" required>
          </div>

          <div class="form-group">
            <label for="debtorInterest">Taxa de Juros (% ao mês)</label>
            <input type="number" id="debtorInterest" placeholder="0" step="0.1" min="0" value="0">
          </div>

          <div class="form-group">
            <label for="debtorDueDate">Primeiro Vencimento *</label>
            <input type="date" id="debtorDueDate" required>
          </div>

          <div class="form-group">
            <label for="debtorInstallments">Número de Parcelas</label>
            <input type="number" id="debtorInstallments" value="1" min="1" max="${CONFIG.LIMITS.MAX_INSTALLMENTS}">
          </div>

          <div class="form-group full-width">
            <label for="debtorDescription">Descrição da Dívida</label>
            <input type="text" id="debtorDescription" placeholder="Ex: Empréstimo pessoal, Venda fiado...">
          </div>

          <div class="form-group full-width">
            <label for="debtorNotes">Observações</label>
            <textarea id="debtorNotes" placeholder="Observações adicionais" rows="2"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Cadastrar Devedor'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="debtors-section">
        <div class="section-header">
          <h3>👥 Lista de Devedores</h3>
          <div class="filter-group">
            <select id="debtorsFilter" onchange="uiManager.filterDebtors(this.value)">
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="partial">Pagamento Parcial</option>
              <option value="overdue">Em Atraso</option>
              <option value="defaulted">Inadimplentes</option>
              <option value="paid">Quitados</option>
            </select>
          </div>
        </div>
        
        ${debtors.length > 0 ? `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Valor Total</th>
                  <th>Pago</th>
                  <th>Restante</th>
                  <th>Parcelas</th>
                  <th>Próx. Venc.</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${debtors.map(d => {
                  const statusClass = this.getDebtorStatusClass(d.status);
                  const statusLabel = this.getDebtorStatusLabel(d.status);
                  const nextDue = debtorsManager.getNextDueDate(d);
                  const isOverdue = d.status === CONFIG.DEBTOR_STATUS.OVERDUE || d.status === CONFIG.DEBTOR_STATUS.DEFAULTED;
                  
                  // Usar valores com fallback para compatibilidade
                  const totalAmount = d.totalAmount || d.totalValue || 0;
                  const paidAmount = d.paidAmount || d.paidValue || 0;
                  const remainingAmount = d.remainingAmount || d.remainingValue || (totalAmount - paidAmount);
                  const installmentsPaid = d.installmentsPaid || 0;
                  const installmentsCount = d.installmentsCount || (d.installments ? d.installments.length : 1);
                  
                  return `
                    <tr class="${isOverdue ? 'overdue-row' : ''}" data-status="${d.status}">
                      <td>
                        <strong>${d.name || 'Sem nome'}</strong>
                        ${d.description ? `<br><small class="text-muted">${d.description}</small>` : ''}
                      </td>
                      <td>${formatPhone(d.phone) || '-'}</td>
                      <td>${formatCurrency(totalAmount)}</td>
                      <td class="income">${formatCurrency(paidAmount)}</td>
                      <td class="${remainingAmount > 0 ? 'expense' : ''}">${formatCurrency(remainingAmount)}</td>
                      <td>${installmentsPaid}/${installmentsCount}</td>
                      <td>${nextDue ? formatDate(nextDue) : '-'}</td>
                      <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                      <td class="actions">
                        <button class="btn-icon" onclick="uiManager.viewDebtorDetails('${d.id}')" title="Detalhes">👁️</button>
                        ${d.status !== CONFIG.DEBTOR_STATUS.PAID ? 
                          `<button class="btn-icon" onclick="uiManager.showDebtorPaymentModal('${d.id}')" title="Receber">💰</button>` : ''}
                        <button class="btn-icon" onclick="uiManager.editDebtor('${d.id}')" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete" onclick="uiManager.deleteDebtor('${d.id}')" title="Excluir">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="empty-message">Nenhum devedor cadastrado. Registre pessoas que devem dinheiro para você!</p>'}
      </div>
    `;

    document.getElementById('debtorsView').innerHTML = html;
    this.setupFormListeners();
  },

  handleDebtorSubmit() {
    const name = document.getElementById('debtorName').value;
    const phone = document.getElementById('debtorPhone').value;
    const email = document.getElementById('debtorEmail').value;
    const documentVal = document.getElementById('debtorDocument').value;
    const address = document.getElementById('debtorAddress').value;
    const totalAmount = uiManager.parseCurrencyValue(document.getElementById('debtorAmount').value);
    const interestRate = parseFloat(document.getElementById('debtorInterest').value) || 0;
    const dueDate = document.getElementById('debtorDueDate').value;
    const installments = parseInt(document.getElementById('debtorInstallments').value) || 1;
    const description = document.getElementById('debtorDescription').value;
    const notes = document.getElementById('debtorNotes').value;

    if (!dueDate) {
      Toast.show('Informe a data de vencimento', 'error');
      return;
    }

    const debtorData = {
      businessId: financeManager.currentBusinessId,
      name,
      phone,
      email,
      document: documentVal,
      address,
      totalAmount,
      interestRate,
      dueDate,
      installments,
      description,
      notes
    };

    if (this.editingId) {
      debtorsManager.updateDebtor(this.editingId, debtorData);
      Toast.show('Devedor atualizado com sucesso!', 'success');
    } else {
      debtorsManager.createDebtor(debtorData);
      Toast.show('Devedor cadastrado com sucesso!', 'success');
    }

    this.editingId = null;
    this.renderDebtors();
  },

  editDebtor(id) {
    const debtor = debtorsManager.getDebtor(id);
    if (!debtor) return;

    this.editingId = id;
    this.renderDebtors();

    document.getElementById('debtorName').value = debtor.name;
    document.getElementById('debtorPhone').value = debtor.phone || '';
    document.getElementById('debtorEmail').value = debtor.email || '';
    document.getElementById('debtorDocument').value = debtor.document || '';
    document.getElementById('debtorAddress').value = debtor.address || '';
    document.getElementById('debtorAmount').value = toReais(debtor.totalAmount);
    document.getElementById('debtorInterest').value = debtor.interestRate || 0;
    document.getElementById('debtorDueDate').value = debtor.originalDueDate ? debtor.originalDueDate.split('T')[0] : '';
    document.getElementById('debtorInstallments').value = debtor.installmentsCount;
    document.getElementById('debtorDescription').value = debtor.description || '';
    document.getElementById('debtorNotes').value = debtor.notes || '';

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  },

  deleteDebtor(id) {
    if (!confirm('Tem certeza que deseja excluir este devedor e todo seu histórico?')) return;

    if (debtorsManager.deleteDebtor(id)) {
      Toast.show('Devedor excluído com sucesso!', 'success');
      this.renderDebtors();
    }
  },

  viewDebtorDetails(debtorId) {
    const debtor = debtorsManager.getDebtor(debtorId);
    if (!debtor) return;

    // Usar valores com fallback para compatibilidade
    const totalAmount = debtor.totalAmount || debtor.totalValue || 0;
    const paidAmount = debtor.paidAmount || debtor.paidValue || 0;
    const remainingAmount = debtor.remainingAmount || debtor.remainingValue || (totalAmount - paidAmount);
    const installments = debtor.installments && Array.isArray(debtor.installments) ? debtor.installments : [];
    const installmentsPaid = debtor.installmentsPaid || installments.filter(i => i && i.status === 'pago').length;
    const installmentsCount = debtor.installmentsCount || installments.length || 1;
    const interestRate = debtor.interestRate || 0;
    const payments = debtor.payments && Array.isArray(debtor.payments) ? debtor.payments : [];

    const statusLabel = this.getDebtorStatusLabel(debtor.status);
    const progress = totalAmount > 0 ? (paidAmount / totalAmount * 100).toFixed(1) : 0;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>📋 Detalhes do Devedor</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="debtor-details-header">
            <div class="debtor-info">
              <h2>${debtor.name}</h2>
              <span class="status-badge ${this.getDebtorStatusClass(debtor.status)}">${statusLabel}</span>
            </div>
            <div class="debtor-contact">
              ${debtor.phone ? `<p>📱 ${formatPhone(debtor.phone)}</p>` : ''}
              ${debtor.email ? `<p>📧 ${debtor.email}</p>` : ''}
              ${debtor.document ? `<p>📄 ${formatDocument(debtor.document)}</p>` : ''}
            </div>
          </div>

          ${debtor.address ? `<p class="debtor-address">📍 ${debtor.address}</p>` : ''}
          ${debtor.description ? `<p class="debtor-description"><strong>Descrição:</strong> ${debtor.description}</p>` : ''}

          <div class="debtor-summary">
            <div class="summary-item">
              <label>Valor Total</label>
              <span>${formatCurrency(totalAmount)}</span>
            </div>
            <div class="summary-item">
              <label>Valor Pago</label>
              <span class="income">${formatCurrency(paidAmount)}</span>
            </div>
            <div class="summary-item">
              <label>Valor Restante</label>
              <span class="${remainingAmount > 0 ? 'expense' : ''}">${formatCurrency(remainingAmount)}</span>
            </div>
            ${interestRate > 0 ? `
              <div class="summary-item">
                <label>Taxa de Juros</label>
                <span>${interestRate}% ao mês</span>
              </div>
            ` : ''}
          </div>

          <div class="progress-section">
            <label>Progresso do Pagamento</label>
            <div class="progress-bar large">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-label">${progress}% pago</span>
          </div>

          ${installments.length > 0 ? `
          <h4>📅 Parcelas (${installmentsPaid}/${installmentsCount})</h4>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Parcela</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Pago</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                ${installments.map(inst => {
                  if (!inst) return '';
                  const instPaidAmount = inst.paidAmount || 0;
                  const instAmount = inst.amount || 0;
                  const instOverdue = inst.status !== 'pago' && isOverdue(inst.dueDate);
                  const instStatusClass = inst.status === 'pago' ? 'status-paid' : (instOverdue ? 'status-overdue' : (inst.status === 'parcial' ? 'status-partial' : 'status-pending'));
                  const instStatusLabel = inst.status === 'pago' ? 'Pago' : (instOverdue ? 'Vencido' : (inst.status === 'parcial' ? 'Parcial' : 'Pendente'));
                  
                  return `
                    <tr class="${instOverdue ? 'overdue-row' : ''}">
                      <td>${inst.number || 1}ª</td>
                      <td>${formatDate(inst.dueDate)}</td>
                      <td>${formatCurrency(instAmount)}</td>
                      <td class="${instPaidAmount > 0 ? 'income' : ''}">${formatCurrency(instPaidAmount)}</td>
                      <td><span class="status-badge ${instStatusClass}">${instStatusLabel}</span></td>
                      <td>
                        ${inst.status !== 'pago' ? 
                          `<button class="btn-sm btn-primary" onclick="uiManager.showInstallmentPaymentModal('${debtor.id}', '${inst.id}', ${instAmount - instPaidAmount})">Receber</button>` : 
                          (inst.paidDate ? `<small>${formatDate(inst.paidDate)}</small>` : '')}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          ` : ''}

          ${payments.length > 0 ? `
            <h4>💰 Histórico de Pagamentos</h4>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Observação</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  ${payments.map(p => `
                    <tr>
                      <td>${formatDateTime(p.date)}</td>
                      <td class="income">${formatCurrency(p.amount || 0)}</td>
                      <td>${p.notes || '-'}</td>
                      <td>
                        <button class="btn-icon btn-delete" onclick="uiManager.removeDebtorPayment('${debtor.id}', '${p.id}')" title="Remover">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${debtor.notes ? `<p class="debtor-notes"><strong>Observações:</strong> ${debtor.notes}</p>` : ''}
        </div>
        <div class="modal-footer">
          ${debtor.status !== CONFIG.DEBTOR_STATUS.PAID ? 
            `<button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); uiManager.showDebtorPaymentModal('${debtor.id}')">💰 Receber Pagamento</button>` : ''}
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  showDebtorPaymentModal(debtorId) {
    const debtor = debtorsManager.getDebtor(debtorId);
    if (!debtor) return;

    // Usar valores com fallback para compatibilidade
    const remainingAmount = debtor.remainingAmount || debtor.remainingValue || 
      ((debtor.totalAmount || debtor.totalValue || 0) - (debtor.paidAmount || debtor.paidValue || 0));

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>💰 Receber Pagamento</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <p><strong>Devedor:</strong> ${debtor.name || 'Sem nome'}</p>
          <p><strong>Valor restante:</strong> ${formatCurrency(remainingAmount)}</p>
          
          <div class="form-group">
            <label for="debtorPaymentAmount">Valor do Pagamento (R$) *</label>
            <input type="number" id="debtorPaymentAmount" value="${toReais(remainingAmount)}" step="0.01" min="0.01">
          </div>
          <div class="form-group">
            <label for="debtorPaymentDate">Data do Pagamento</label>
            <input type="date" id="debtorPaymentDate" value="${getCurrentDate()}">
          </div>
          <div class="form-group">
            <label for="debtorPaymentNotes">Observação</label>
            <input type="text" id="debtorPaymentNotes" placeholder="Observação do pagamento">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" onclick="uiManager.processDebtorPayment('${debtor.id}')">Confirmar Pagamento</button>
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  showInstallmentPaymentModal(debtorId, installmentId, remainingAmount) {
    const debtor = debtorsManager.getDebtor(debtorId);
    if (!debtor) return;

    // Verificar se installments existe e é um array
    if (!debtor.installments || !Array.isArray(debtor.installments)) {
      Toast.show('Este devedor não possui parcelas cadastradas', 'error');
      return;
    }

    const installment = debtor.installments.find(i => i && i.id === installmentId);
    if (!installment) {
      Toast.show('Parcela não encontrada', 'error');
      return;
    }

    const installmentsCount = debtor.installmentsCount || debtor.installments.length || 1;
    const instAmount = installment.amount || 0;
    const instPaidAmount = installment.paidAmount || 0;
    const instRemainingAmount = remainingAmount || (instAmount - instPaidAmount);

    // Fechar modal de detalhes se existir
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>💰 Receber Parcela ${installment.number || 1}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <p><strong>Devedor:</strong> ${debtor.name || 'Sem nome'}</p>
          <p><strong>Parcela:</strong> ${installment.number || 1}ª de ${installmentsCount}</p>
          <p><strong>Valor da parcela:</strong> ${formatCurrency(instAmount)}</p>
          <p><strong>Valor restante:</strong> ${formatCurrency(instRemainingAmount)}</p>
          
          <div class="form-group">
            <label for="instPaymentAmount">Valor do Pagamento (R$) *</label>
            <input type="number" id="instPaymentAmount" value="${toReais(instRemainingAmount)}" step="0.01" min="0.01">
          </div>
          <div class="form-group">
            <label for="instPaymentDate">Data do Pagamento</label>
            <input type="date" id="instPaymentDate" value="${getCurrentDate()}">
          </div>
          <div class="form-group">
            <label for="instPaymentNotes">Observação</label>
            <input type="text" id="instPaymentNotes" placeholder="Observação do pagamento">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" onclick="uiManager.processInstallmentPayment('${debtor.id}', '${installmentId}')">Confirmar Pagamento</button>
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  processDebtorPayment(debtorId) {
    const amount = parseFloat(document.getElementById('debtorPaymentAmount').value);
    const date = document.getElementById('debtorPaymentDate').value;
    const notes = document.getElementById('debtorPaymentNotes').value;

    if (!amount || amount <= 0) {
      Toast.show('Informe um valor válido', 'error');
      return;
    }

    debtorsManager.registerPayment(debtorId, amount, date, null, notes);
    Toast.show('Pagamento registrado com sucesso!', 'success');
    
    document.querySelector('.modal-overlay').remove();
    this.renderDebtors();
  },

  processInstallmentPayment(debtorId, installmentId) {
    const amount = parseFloat(document.getElementById('instPaymentAmount').value);
    const date = document.getElementById('instPaymentDate').value;
    const notes = document.getElementById('instPaymentNotes').value;

    if (!amount || amount <= 0) {
      Toast.show('Informe um valor válido', 'error');
      return;
    }

    debtorsManager.registerPayment(debtorId, amount, date, installmentId, notes);
    Toast.show('Pagamento registrado com sucesso!', 'success');
    
    document.querySelector('.modal-overlay').remove();
    this.renderDebtors();
  },

  removeDebtorPayment(debtorId, paymentId) {
    if (!confirm('Tem certeza que deseja remover este pagamento?')) return;

    if (debtorsManager.removePayment(debtorId, paymentId)) {
      Toast.show('Pagamento removido com sucesso!', 'success');
      
      // Fechar modal e reabrir detalhes
      document.querySelector('.modal-overlay').remove();
      this.viewDebtorDetails(debtorId);
    }
  },

  filterDebtors(filter) {
    const rows = document.querySelectorAll('.debtors-section tbody tr');
    rows.forEach(row => {
      const status = row.dataset.status;
      let show = true;

      switch (filter) {
        case 'active':
          show = status === CONFIG.DEBTOR_STATUS.ACTIVE;
          break;
        case 'partial':
          show = status === CONFIG.DEBTOR_STATUS.PARTIAL;
          break;
        case 'overdue':
          show = status === CONFIG.DEBTOR_STATUS.OVERDUE;
          break;
        case 'defaulted':
          show = status === CONFIG.DEBTOR_STATUS.DEFAULTED;
          break;
        case 'paid':
          show = status === CONFIG.DEBTOR_STATUS.PAID;
          break;
      }

      row.style.display = show ? '' : 'none';
    });
  },

  getDebtorStatusClass(status) {
    const classes = {
      [CONFIG.DEBTOR_STATUS.ACTIVE]: 'status-pending',
      [CONFIG.DEBTOR_STATUS.PARTIAL]: 'status-partial',
      [CONFIG.DEBTOR_STATUS.PAID]: 'status-paid',
      [CONFIG.DEBTOR_STATUS.OVERDUE]: 'status-overdue',
      [CONFIG.DEBTOR_STATUS.NEGOTIATING]: 'status-warning',
      [CONFIG.DEBTOR_STATUS.DEFAULTED]: 'status-danger'
    };
    return classes[status] || 'status-pending';
  },

  getDebtorStatusLabel(status) {
    const labels = {
      [CONFIG.DEBTOR_STATUS.ACTIVE]: 'Ativo',
      [CONFIG.DEBTOR_STATUS.PARTIAL]: 'Parcial',
      [CONFIG.DEBTOR_STATUS.PAID]: 'Quitado',
      [CONFIG.DEBTOR_STATUS.OVERDUE]: 'Vencido',
      [CONFIG.DEBTOR_STATUS.NEGOTIATING]: 'Negociando',
      [CONFIG.DEBTOR_STATUS.DEFAULTED]: 'Inadimplente'
    };
    return labels[status] || 'Ativo';
  }
});
