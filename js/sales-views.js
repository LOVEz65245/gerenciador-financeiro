// ============================================
// VIEWS DO SISTEMA DE VENDAS
// ============================================

Object.assign(UIManager.prototype, {

  // ============================================
  // VENDAS
  // ============================================

  renderSales() {
    const businessId = financeManager.currentBusinessId;
    const sales = salesManager.getSalesByBusiness(businessId);
    const stats = salesManager.getSalesStats(businessId);
    const customers = salesManager.getCustomersByBusiness(businessId);
    const products = salesManager.getProductsByBusiness(businessId);

    const html = `
      <div class="sales-stats">
        <div class="stat-card">
          <div class="stat-icon income-bg">🛒</div>
          <div class="stat-info">
            <h3>Total de Vendas</h3>
            <p class="amount">${formatCurrency(stats.totalRevenue)}</p>
            <small>${stats.totalSales} vendas</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon primary-bg">💰</div>
          <div class="stat-info">
            <h3>Recebido</h3>
            <p class="amount income">${formatCurrency(stats.totalReceived)}</p>
            <small>${stats.paidSalesCount} pagas</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning-bg">⏳</div>
          <div class="stat-info">
            <h3>A Receber</h3>
            <p class="amount">${formatCurrency(stats.totalPending)}</p>
            <small>${stats.pendingSalesCount} pendentes</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon expense-bg">⚠️</div>
          <div class="stat-info">
            <h3>Vencidas</h3>
            <p class="amount expense">${formatCurrency(stats.overdueAmount)}</p>
            <small>${stats.overdueSalesCount} vencidas</small>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Venda' : '➕ Nova Venda'}</h3>
        <form id="saleForm" class="sale-form">
          <div class="sale-form-row">
            <div class="form-group">
              <label for="saleCustomer">Cliente</label>
              <select id="saleCustomer" onchange="uiManager.handleCustomerSelect(this.value)">
                <option value="">Selecione ou digite abaixo</option>
                ${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="saleCustomerName">Nome do Cliente</label>
              <input type="text" id="saleCustomerName" placeholder="Nome do cliente (se não cadastrado)">
            </div>
          </div>

          <div class="form-group">
            <label>Itens da Venda *</label>
            <div id="saleItems" class="sale-items">
              <div class="sale-item-row">
                <select class="item-product" onchange="uiManager.handleProductSelect(this)">
                  <option value="">Produto/Serviço</option>
                  ${products.map(p => `<option value="${p.id}" data-price="${toReais(p.price)}">${p.name} - ${formatCurrency(p.price)}</option>`).join('')}
                </select>
                <input type="text" class="item-name" placeholder="Descrição">
                <input type="number" class="item-qty" placeholder="Qtd" value="1" min="1" onchange="uiManager.updateSaleTotal()">
                <input type="number" class="item-price" placeholder="Preço" step="0.01" min="0" onchange="uiManager.updateSaleTotal()">
                <button type="button" class="btn-icon btn-delete" onclick="uiManager.removeSaleItem(this)">🗑️</button>
              </div>
            </div>
            <button type="button" class="btn-secondary btn-sm" onclick="uiManager.addSaleItem()">+ Adicionar Item</button>
          </div>

          <div class="sale-form-row sale-form-row-4">
            <div class="form-group">
              <label for="saleDiscount">Desconto (R$)</label>
              <input type="number" id="saleDiscount" placeholder="0,00" step="0.01" min="0" value="0" onchange="uiManager.updateSaleTotal()">
            </div>
            <div class="form-group">
              <label>Total</label>
              <div class="sale-total" id="saleTotal">${formatCurrency(0)}</div>
            </div>
            <div class="form-group">
              <label for="salePaymentType">Forma de Pagamento *</label>
              <select id="salePaymentType" required onchange="uiManager.handlePaymentTypeChange(this.value)">
                <option value="dinheiro">💵 Dinheiro</option>
                <option value="pix">📱 PIX</option>
                <option value="cartao_debito">💳 Cartão de Débito</option>
                <option value="cartao_credito">💳 Cartão de Crédito</option>
                <option value="transferencia">🏦 Transferência</option>
                <option value="parcelado">📅 Parcelado</option>
                <option value="outro">📌 Outro</option>
              </select>
            </div>
            <div class="form-group" id="installmentsGroup" style="display: none;">
              <label for="saleInstallments">Número de Parcelas</label>
              <input type="number" id="saleInstallments" value="1" min="1" max="360">
            </div>
          </div>

          <div class="sale-form-row">
            <div class="form-group">
              <label for="saleDueDate">Vencimento</label>
              <input type="date" id="saleDueDate" value="${getCurrentDate()}">
            </div>
            <div class="form-group">
              <label for="saleNotes">Observações</label>
              <input type="text" id="saleNotes" placeholder="Observações da venda">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Registrar Venda'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="sales-section">
        <div class="section-header">
          <h3>🛒 Vendas Recentes</h3>
          <div class="filter-group">
            <select id="salesFilter" onchange="uiManager.filterSales(this.value)">
              <option value="all">Todas</option>
              <option value="pending">Pendentes</option>
              <option value="partial">Parciais</option>
              <option value="paid">Pagas</option>
              <option value="overdue">Vencidas</option>
            </select>
          </div>
        </div>
        
        ${sales.length > 0 ? `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Restante</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${sales.slice(0, 20).map(sale => {
                  const customer = sale.customerId ? salesManager.getCustomer(sale.customerId) : null;
                  const statusClass = this.getSaleStatusClass(sale.status);
                  const statusLabel = this.getSaleStatusLabel(sale.status);
                  const isOverdue = sale.dueDate && window.isOverdue(sale.dueDate) && sale.status !== CONFIG.SALE_STATUS.PAID;
                  
                  return `
                    <tr class="${isOverdue ? 'overdue-row' : ''}">
                      <td>${formatDate(sale.date)}</td>
                      <td>${customer ? customer.name : (sale.customerName || 'Cliente não informado')}</td>
                      <td>${sale.items.length} item(ns)</td>
                      <td>${formatCurrency(sale.totalAmount)}</td>
                      <td class="income">${formatCurrency(sale.paidAmount)}</td>
                      <td class="${sale.remainingAmount > 0 ? 'expense' : ''}">${formatCurrency(sale.remainingAmount)}</td>
                      <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                      <td class="actions">
                        <button class="btn-icon" onclick="uiManager.viewSaleDetails('${sale.id}')" title="Detalhes">👁️</button>
                        ${sale.status !== CONFIG.SALE_STATUS.PAID && sale.status !== CONFIG.SALE_STATUS.CANCELLED ? 
                          `<button class="btn-icon" onclick="uiManager.showPaymentModal('${sale.id}')" title="Receber">💰</button>` : ''}
                        <button class="btn-icon btn-delete" onclick="uiManager.deleteSale('${sale.id}')" title="Excluir">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="empty-message">Nenhuma venda registrada. Comece registrando sua primeira venda!</p>'}
      </div>
    `;

    document.getElementById('salesView').innerHTML = html;
    this.setupFormListeners();
  },

  handleCustomerSelect(customerId) {
    const customerNameInput = document.getElementById('saleCustomerName');
    if (customerId) {
      const customer = salesManager.getCustomer(customerId);
      if (customer) {
        customerNameInput.value = customer.name;
        customerNameInput.disabled = true;
      }
    } else {
      customerNameInput.value = '';
      customerNameInput.disabled = false;
    }
  },

  handleProductSelect(selectElement) {
    const row = selectElement.closest('.sale-item-row');
    const nameInput = row.querySelector('.item-name');
    const priceInput = row.querySelector('.item-price');
    
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (selectedOption.value) {
      const product = salesManager.getProduct(selectedOption.value);
      if (product) {
        nameInput.value = product.name;
        priceInput.value = toReais(product.price);
        this.updateSaleTotal();
      }
    }
  },

  handlePaymentTypeChange(paymentType) {
    const installmentsGroup = document.getElementById('installmentsGroup');
    if (paymentType === 'parcelado') {
      installmentsGroup.style.display = 'block';
    } else {
      installmentsGroup.style.display = 'none';
      document.getElementById('saleInstallments').value = 1;
    }
  },

  addSaleItem() {
    const products = salesManager.getProductsByBusiness(financeManager.currentBusinessId);
    const container = document.getElementById('saleItems');
    const row = document.createElement('div');
    row.className = 'sale-item-row';
    row.innerHTML = `
      <select class="item-product" onchange="uiManager.handleProductSelect(this)">
        <option value="">Produto/Serviço</option>
        ${products.map(p => `<option value="${p.id}" data-price="${toReais(p.price)}">${p.name} - ${formatCurrency(p.price)}</option>`).join('')}
      </select>
      <input type="text" class="item-name" placeholder="Descrição">
      <input type="number" class="item-qty" placeholder="Qtd" value="1" min="1" onchange="uiManager.updateSaleTotal()">
      <input type="number" class="item-price" placeholder="Preço" step="0.01" min="0" onchange="uiManager.updateSaleTotal()">
      <button type="button" class="btn-icon btn-delete" onclick="uiManager.removeSaleItem(this)">🗑️</button>
    `;
    container.appendChild(row);
  },

  removeSaleItem(button) {
    const rows = document.querySelectorAll('.sale-item-row');
    if (rows.length > 1) {
      button.closest('.sale-item-row').remove();
      this.updateSaleTotal();
    } else {
      Toast.show('A venda precisa ter pelo menos um item', 'warning');
    }
  },

  updateSaleTotal() {
    const rows = document.querySelectorAll('.sale-item-row');
    let subtotal = 0;

    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
      const price = parseFloat(row.querySelector('.item-price').value) || 0;
      subtotal += qty * price;
    });

    const discount = uiManager.parseCurrencyValue(document.getElementById('saleDiscount').value) || 0;
    const total = Math.max(0, subtotal - discount);

    document.getElementById('saleTotal').textContent = formatCurrency(toCents(total));
  },

  handleSaleSubmit() {
    const customerId = document.getElementById('saleCustomer').value;
    const customerName = document.getElementById('saleCustomerName').value;
    const discount = uiManager.parseCurrencyValue(document.getElementById('saleDiscount').value) || 0;
    const paymentType = document.getElementById('salePaymentType').value;
    const installments = parseInt(document.getElementById('saleInstallments').value) || 1;
    const dueDate = document.getElementById('saleDueDate').value;
    const notes = document.getElementById('saleNotes').value;

    // Coletar itens
    const items = [];
    const rows = document.querySelectorAll('.sale-item-row');
    
    rows.forEach(row => {
      const productId = row.querySelector('.item-product').value;
      const productName = row.querySelector('.item-name').value;
      const quantity = parseFloat(row.querySelector('.item-qty').value) || 0;
      const price = parseFloat(row.querySelector('.item-price').value) || 0;

      if (productName && quantity > 0 && price > 0) {
        items.push({ productId, productName, quantity, price });
      }
    });

    if (items.length === 0) {
      Toast.show('Adicione pelo menos um item à venda', 'error');
      return;
    }

    const saleData = {
      businessId: financeManager.currentBusinessId,
      customerId: customerId || null,
      customerName,
      items,
      discount,
      paymentType,
      installments,
      dueDate,
      notes
    };

    if (this.editingId) {
      salesManager.updateSale(this.editingId, saleData);
      Toast.show('Venda atualizada com sucesso!', 'success');
      authManager.log('UPDATE_SALE', 'Venda atualizada', { saleId: this.editingId });
    } else {
      const sale = salesManager.createSale(saleData);
      Toast.show('Venda registrada com sucesso!', 'success');
      authManager.log('CREATE_SALE', 'Nova venda registrada', { saleId: sale.id, total: sale.totalAmount });
    }

    this.editingId = null;
    this.renderSales();
  },

  viewSaleDetails(saleId) {
    const sale = salesManager.getSale(saleId);
    if (!sale) return;

    const customer = sale.customerId ? salesManager.getCustomer(sale.customerId) : null;
    const statusClass = this.getSaleStatusClass(sale.status);
    const statusLabel = this.getSaleStatusLabel(sale.status);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3>📋 Detalhes da Venda</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="sale-details-header">
            <div>
              <p><strong>Cliente:</strong> ${customer ? customer.name : (sale.customerName || 'Não informado')}</p>
              <p><strong>Data:</strong> ${formatDateTime(sale.date)}</p>
              <p><strong>Pagamento:</strong> ${this.getPaymentTypeLabel(sale.paymentType)}</p>
              ${sale.dueDate ? `<p><strong>Vencimento:</strong> ${formatDate(sale.dueDate)}</p>` : ''}
            </div>
            <div>
              <span class="status-badge ${statusClass} status-lg">${statusLabel}</span>
            </div>
          </div>

          <h4>Itens</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Preço Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                <td>${formatCurrency(sale.subtotal)}</td>
              </tr>
              ${sale.discount > 0 ? `
                <tr>
                  <td colspan="3" class="text-right"><strong>Desconto:</strong></td>
                  <td class="expense">-${formatCurrency(sale.discount)}</td>
                </tr>
              ` : ''}
              <tr>
                <td colspan="3" class="text-right"><strong>Total:</strong></td>
                <td><strong>${formatCurrency(sale.totalAmount)}</strong></td>
              </tr>
              <tr>
                <td colspan="3" class="text-right"><strong>Pago:</strong></td>
                <td class="income">${formatCurrency(sale.paidAmount)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-right"><strong>Restante:</strong></td>
                <td class="${sale.remainingAmount > 0 ? 'expense' : ''}">${formatCurrency(sale.remainingAmount)}</td>
              </tr>
            </tfoot>
          </table>

          ${sale.payments.length > 0 ? `
            <h4>Histórico de Pagamentos</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${sale.payments.map(p => `
                  <tr>
                    <td>${formatDateTime(p.date)}</td>
                    <td class="income">${formatCurrency(p.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${sale.notes ? `<p class="sale-notes"><strong>Observações:</strong> ${sale.notes}</p>` : ''}
        </div>
        <div class="modal-footer">
          ${sale.status !== CONFIG.SALE_STATUS.PAID && sale.status !== CONFIG.SALE_STATUS.CANCELLED ? 
            `<button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); uiManager.showPaymentModal('${sale.id}')">💰 Receber Pagamento</button>` : ''}
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  showPaymentModal(saleId) {
    const sale = salesManager.getSale(saleId);
    if (!sale) return;

    // Obter contas disponíveis
    const accounts = financeManager.getAccountsByBusiness(financeManager.currentBusinessId);
    const accountsOptions = accounts.map(acc => 
      `<option value="${acc.id}">${acc.icon || '🏦'} ${acc.name}</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>💰 Receber Pagamento</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <p><strong>Valor restante:</strong> ${formatCurrency(sale.remainingAmount)}</p>
          <div class="form-group">
            <label for="paymentAmount">Valor do Pagamento (R$) *</label>
            <input type="number" id="paymentAmount" value="${toReais(sale.remainingAmount)}" step="0.01" min="0.01" max="${toReais(sale.remainingAmount)}">
          </div>
          <div class="form-group">
            <label for="paymentAccount">Conta/Banco de Recebimento *</label>
            <select id="paymentAccount" required>
              <option value="">Selecione onde recebeu</option>
              ${accountsOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="paymentDate">Data do Pagamento</label>
            <input type="date" id="paymentDate" value="${getCurrentDate()}">
          </div>
          <div class="form-group">
            <label for="paymentNotes">Observações</label>
            <input type="text" id="paymentNotes" placeholder="Observações do pagamento (opcional)">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" onclick="uiManager.processSalePayment('${sale.id}')">Confirmar Pagamento</button>
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  processSalePayment(saleId) {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    const accountId = document.getElementById('paymentAccount').value;
    const notes = document.getElementById('paymentNotes')?.value || '';

    if (!amount || amount <= 0) {
      Toast.show('Informe um valor válido', 'error');
      return;
    }

    if (!accountId) {
      Toast.show('Selecione a conta/banco onde recebeu o pagamento', 'error');
      return;
    }

    // Obter informações da conta
    const account = financeManager.getAccount(accountId);
    const accountName = account ? account.name : 'Conta não identificada';

    // Registrar o pagamento da venda com a conta
    salesManager.registerSalePayment(saleId, amount, date, accountId, notes);
    
    // Criar transação de receita na conta selecionada
    const sale = salesManager.getSale(saleId);
    const customer = sale?.customerId ? salesManager.getCustomer(sale.customerId) : null;
    const customerName = customer?.name || sale?.customerName || 'Cliente';
    
    financeManager.createTransaction({
      date: date,
      description: `Recebimento venda - ${customerName}`,
      amount: toCents(amount),
      type: 'income',
      accountId: accountId,
      categoryId: null, // Categoria de vendas
      status: 'paid',
      notes: notes || `Pagamento de venda #${saleId.substring(0, 8)}`
    });

    Toast.show(`Pagamento de ${formatCurrency(toCents(amount))} registrado em ${accountName}!`, 'success');
    
    // Registrar log se authManager estiver disponível
    if (typeof authManager !== 'undefined' && authManager.log) {
      authManager.log('RECEIVE_SALE_PAYMENT', `Pagamento de venda recebido em ${accountName}`, { 
        saleId, 
        amount: toCents(amount), 
        accountId,
        accountName,
        notes
      });
    }
    
    document.querySelector('.modal-overlay').remove();
    this.renderSales();
  },

  deleteSale(saleId) {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return;

    if (salesManager.deleteSale(saleId)) {
      Toast.show('Venda excluída com sucesso!', 'success');
      authManager.log('DELETE_SALE', 'Venda excluída', { saleId });
      this.renderSales();
    }
  },

  filterSales(filter) {
    const rows = document.querySelectorAll('.sales-section tbody tr');
    rows.forEach(row => {
      const statusBadge = row.querySelector('.status-badge');
      if (!statusBadge) return;

      const status = statusBadge.textContent.toLowerCase();
      let show = true;

      switch (filter) {
        case 'pending':
          show = status === 'pendente';
          break;
        case 'partial':
          show = status === 'parcial';
          break;
        case 'paid':
          show = status === 'pago';
          break;
        case 'overdue':
          show = row.classList.contains('overdue-row');
          break;
      }

      row.style.display = show ? '' : 'none';
    });
  },

  getSaleStatusClass(status) {
    const classes = {
      [CONFIG.SALE_STATUS.PENDING]: 'status-pending',
      [CONFIG.SALE_STATUS.PARTIAL]: 'status-partial',
      [CONFIG.SALE_STATUS.PAID]: 'status-paid',
      [CONFIG.SALE_STATUS.CANCELLED]: 'status-cancelled',
      [CONFIG.SALE_STATUS.OVERDUE]: 'status-overdue'
    };
    return classes[status] || 'status-pending';
  },

  getSaleStatusLabel(status) {
    const labels = {
      [CONFIG.SALE_STATUS.PENDING]: 'Pendente',
      [CONFIG.SALE_STATUS.PARTIAL]: 'Parcial',
      [CONFIG.SALE_STATUS.PAID]: 'Pago',
      [CONFIG.SALE_STATUS.CANCELLED]: 'Cancelado',
      [CONFIG.SALE_STATUS.OVERDUE]: 'Vencido'
    };
    return labels[status] || 'Pendente';
  },

  getPaymentTypeLabel(type) {
    const labels = {
      'dinheiro': '💵 Dinheiro',
      'pix': '📱 PIX',
      'cartao_debito': '💳 Cartão de Débito',
      'cartao_credito': '💳 Cartão de Crédito',
      'transferencia': '🏦 Transferência',
      'parcelado': '📅 Parcelado',
      'outro': '📌 Outro'
    };
    return labels[type] || type;
  },

  // ============================================
  // CLIENTES
  // ============================================

  renderCustomers() {
    const businessId = financeManager.currentBusinessId;
    const customers = salesManager.getCustomersByBusiness(businessId);

    const html = `
      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Cliente' : '➕ Novo Cliente'}</h3>
        <form id="customerForm" class="form-grid">
          <div class="form-group">
            <label for="custName">Nome *</label>
            <input type="text" id="custName" placeholder="Nome completo" required maxlength="${CONFIG.LIMITS.MAX_NAME_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="custEmail">E-mail</label>
            <input type="email" id="custEmail" placeholder="email@exemplo.com">
          </div>

          <div class="form-group">
            <label for="custPhone">Telefone</label>
            <input type="tel" id="custPhone" placeholder="(00) 00000-0000">
          </div>

          <div class="form-group">
            <label for="custDocument">CPF/CNPJ</label>
            <input type="text" id="custDocument" placeholder="000.000.000-00">
          </div>

          <div class="form-group full-width">
            <label for="custAddress">Endereço</label>
            <input type="text" id="custAddress" placeholder="Endereço completo">
          </div>

          <div class="form-group full-width">
            <label for="custNotes">Observações</label>
            <textarea id="custNotes" placeholder="Observações sobre o cliente" rows="2"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="customers-section">
        <h3>👥 Clientes Cadastrados</h3>
        ${customers.length > 0 ? `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Compras</th>
                  <th>Total Gasto</th>
                  <th>Última Compra</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(c => `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${formatPhone(c.phone) || '-'}</td>
                    <td>${c.email || '-'}</td>
                    <td>${c.totalPurchases}</td>
                    <td>${formatCurrency(c.totalSpent)}</td>
                    <td>${c.lastPurchase ? formatDate(c.lastPurchase) : '-'}</td>
                    <td class="actions">
                      <button class="btn-icon" onclick="uiManager.editCustomer('${c.id}')" title="Editar">✏️</button>
                      <button class="btn-icon btn-delete" onclick="uiManager.deleteCustomer('${c.id}')" title="Excluir">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="empty-message">Nenhum cliente cadastrado. Adicione seus clientes para um melhor controle!</p>'}
      </div>
    `;

    document.getElementById('customersView').innerHTML = html;
    this.setupFormListeners();
  },

  handleCustomerSubmit() {
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const phone = document.getElementById('custPhone').value;
    const custDocument = document.getElementById('custDocument').value;
    const address = document.getElementById('custAddress').value;
    const notes = document.getElementById('custNotes').value;

    const customerData = {
      businessId: financeManager.currentBusinessId,
      name,
      email,
      phone,
      document: custDocument,
      address,
      notes
    };

    if (this.editingId) {
      salesManager.updateCustomer(this.editingId, customerData);
      Toast.show('Cliente atualizado com sucesso!', 'success');
      authManager.log('UPDATE_CUSTOMER', 'Cliente atualizado', { customerId: this.editingId });
    } else {
      const customer = salesManager.createCustomer(customerData);
      Toast.show('Cliente cadastrado com sucesso!', 'success');
      authManager.log('CREATE_CUSTOMER', 'Novo cliente cadastrado', { customerId: customer.id });
    }

    this.editingId = null;
    this.renderCustomers();
  },

  editCustomer(id) {
    const customer = salesManager.getCustomer(id);
    if (!customer) return;

    this.editingId = id;
    this.renderCustomers();

    document.getElementById('custName').value = customer.name;
    document.getElementById('custEmail').value = customer.email || '';
    document.getElementById('custPhone').value = customer.phone || '';
    document.getElementById('custDocument').value = customer.document || '';
    document.getElementById('custAddress').value = customer.address || '';
    document.getElementById('custNotes').value = customer.notes || '';

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
  },

  deleteCustomer(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    if (salesManager.deleteCustomer(id)) {
      Toast.show('Cliente excluído com sucesso!', 'success');
      authManager.log('DELETE_CUSTOMER', 'Cliente excluído', { customerId: id });
      this.renderCustomers();
    }
  },

  // ============================================
  // PRODUTOS
  // ============================================

  renderProducts() {
    const businessId = financeManager.currentBusinessId;
    const products = salesManager.getProductsByBusiness(businessId);
    const categories = salesManager.getProductCategories();
    const categoryStats = salesManager.getCategoryStats(businessId);

    const html = `
      <div class="products-stats">
        <div class="stat-card">
          <div class="stat-icon primary-bg">📦</div>
          <div class="stat-info">
            <h3>Total de Produtos</h3>
            <p class="amount">${products.length}</p>
            <small>produtos ativos</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon income-bg">🏷️</div>
          <div class="stat-info">
            <h3>Categorias</h3>
            <p class="amount">${categories.length}</p>
            <small>categorias ativas</small>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning-bg">📊</div>
          <div class="stat-info">
            <h3>Mais Vendida</h3>
            <p class="amount">${categoryStats[0] ? categoryStats[0].name : '-'}</p>
            <small>${categoryStats[0] ? formatCurrency(categoryStats[0].totalRevenue) : ''}</small>
          </div>
        </div>
      </div>

      <!-- Seção de Categorias de Produtos -->
      <div class="form-section">
        <h3>🏷️ Categorias de Produtos</h3>
        <div class="categories-management">
          <div class="category-form-inline">
            <input type="text" id="newCategoryName" placeholder="Nome da categoria" maxlength="50">
            <select id="newCategoryIcon">
              <option value="📦">📦 Geral</option>
              <option value="📱">📱 Eletrônicos</option>
              <option value="👕">👕 Roupas</option>
              <option value="🍔">🍔 Alimentos</option>
              <option value="🥤">🥤 Bebidas</option>
              <option value="🏠">🏠 Casa</option>
              <option value="💄">💄 Beleza</option>
              <option value="⚽">⚽ Esportes</option>
              <option value="🔧">🔧 Serviços</option>
              <option value="🎮">🎮 Games</option>
              <option value="📚">📚 Livros</option>
              <option value="🎁">🎁 Presentes</option>
            </select>
            <input type="color" id="newCategoryColor" value="#3B82F6">
            <button type="button" class="btn-primary btn-sm" onclick="uiManager.addProductCategory()">+ Adicionar</button>
          </div>
          
          <div class="categories-list">
            ${categories.map(cat => `
              <div class="category-tag" style="background-color: ${cat.color}20; border-color: ${cat.color}">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${cat.name}</span>
                <button class="btn-icon btn-sm" onclick="uiManager.editProductCategory('${cat.id}')" title="Editar">✏️</button>
                <button class="btn-icon btn-sm btn-delete" onclick="uiManager.deleteProductCategory('${cat.id}')" title="Excluir">×</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>${this.editingId ? '✏️ Editar Produto' : '➕ Novo Produto/Serviço'}</h3>
        <form id="productForm" class="form-grid">
          <div class="form-group">
            <label for="prodName">Nome *</label>
            <input type="text" id="prodName" placeholder="Nome do produto/serviço" required maxlength="${CONFIG.LIMITS.MAX_NAME_LENGTH}">
          </div>
          
          <div class="form-group">
            <label for="prodCategory">Categoria *</label>
            <select id="prodCategory" required>
              <option value="">Selecione uma categoria</option>
              ${categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="prodPrice">Preço de Venda (R$) *</label>
            <input type="number" id="prodPrice" placeholder="0,00" step="0.01" min="0.01" required>
          </div>

          <div class="form-group">
            <label for="prodCost">Custo (R$)</label>
            <input type="number" id="prodCost" placeholder="0,00" step="0.01" min="0">
          </div>

          <div class="form-group">
            <label for="prodStock">Estoque</label>
            <input type="number" id="prodStock" placeholder="0" min="0" value="0">
          </div>

          <div class="form-group">
            <label for="prodUnit">Unidade</label>
            <select id="prodUnit">
              <option value="un">Unidade</option>
              <option value="kg">Kg</option>
              <option value="g">Grama</option>
              <option value="l">Litro</option>
              <option value="ml">ML</option>
              <option value="m">Metro</option>
              <option value="h">Hora</option>
              <option value="serv">Serviço</option>
            </select>
          </div>

          <div class="form-group full-width">
            <label for="prodDescription">Descrição</label>
            <textarea id="prodDescription" placeholder="Descrição do produto/serviço" rows="2"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">${this.editingId ? 'Salvar Alterações' : 'Cadastrar Produto'}</button>
            ${this.editingId ? '<button type="button" class="btn-secondary" onclick="uiManager.cancelEdit()">Cancelar</button>' : ''}
          </div>
        </form>
      </div>

      <div class="products-section">
        <div class="section-header">
          <h3>📦 Produtos e Serviços</h3>
          <div class="filter-group">
            <select id="productCategoryFilter" onchange="uiManager.filterProductsByCategory(this.value)">
              <option value="all">Todas as Categorias</option>
              ${categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
            </select>
          </div>
        </div>
        ${products.length > 0 ? `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Custo</th>
                  <th>Margem</th>
                  <th>Estoque</th>
                  <th>Vendidos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(p => {
                  const category = p.categoryId ? salesManager.getProductCategory(p.categoryId) : null;
                  const margin = p.cost > 0 ? ((p.price - p.cost) / p.cost * 100).toFixed(1) : 0;
                  return `
                    <tr data-category="${p.categoryId || ''}">
                      <td><strong>${p.name}</strong></td>
                      <td>
                        ${category ? `
                          <span class="category-badge" style="background-color: ${category.color}20; color: ${category.color}">
                            ${category.icon} ${category.name}
                          </span>
                        ` : (p.category || '-')}
                      </td>
                      <td>${formatCurrency(p.price)}</td>
                      <td>${formatCurrency(p.cost)}</td>
                      <td class="${margin > 0 ? 'income' : ''}">${margin}%</td>
                      <td>${p.stock} ${p.unit}</td>
                      <td>${p.totalSold}</td>
                      <td class="actions">
                        <button class="btn-icon" onclick="uiManager.editProduct('${p.id}')" title="Editar">✏️</button>
                        <button class="btn-icon btn-delete" onclick="uiManager.deleteProduct('${p.id}')" title="Excluir">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="empty-message">Nenhum produto cadastrado. Adicione seus produtos para facilitar as vendas!</p>'}
      </div>

      <!-- Análise por Categoria -->
      ${categoryStats.length > 0 ? `
        <div class="category-analysis-section">
          <h3>📊 Análise por Categoria</h3>
          <div class="category-analysis-grid">
            ${categoryStats.map((stat, index) => `
              <div class="category-analysis-card" style="border-left: 4px solid ${stat.color}">
                <div class="category-analysis-header">
                  <span class="category-rank">#${index + 1}</span>
                  <span class="category-icon-lg">${stat.icon}</span>
                  <h4>${stat.name}</h4>
                </div>
                <div class="category-analysis-stats">
                  <div class="stat-row">
                    <span>Vendas:</span>
                    <strong>${stat.totalSold} un</strong>
                  </div>
                  <div class="stat-row">
                    <span>Receita:</span>
                    <strong class="income">${formatCurrency(stat.totalRevenue)}</strong>
                  </div>
                  <div class="stat-row">
                    <span>Custo:</span>
                    <strong class="expense">${formatCurrency(stat.totalCost)}</strong>
                  </div>
                  <div class="stat-row highlight">
                    <span>Lucro:</span>
                    <strong class="${stat.totalProfit >= 0 ? 'income' : 'expense'}">${formatCurrency(stat.totalProfit)}</strong>
                  </div>
                  <div class="stat-row">
                    <span>Margem:</span>
                    <strong class="${stat.profitMargin >= 0 ? 'income' : 'expense'}">${stat.profitMargin.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    document.getElementById('productsView').innerHTML = html;
    this.setupFormListeners();
  },

  addProductCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value;
    const color = document.getElementById('newCategoryColor').value;

    if (!name) {
      Toast.show('Informe o nome da categoria', 'error');
      return;
    }

    salesManager.createProductCategory({ name, icon, color });
    Toast.show('Categoria criada com sucesso!', 'success');
    authManager.log('CREATE_PRODUCT_CATEGORY', 'Nova categoria de produto criada', { name });
    
    document.getElementById('newCategoryName').value = '';
    this.renderProducts();
  },

  editProductCategory(id) {
    const category = salesManager.getProductCategory(id);
    if (!category) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>✏️ Editar Categoria</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="editCatName">Nome *</label>
            <input type="text" id="editCatName" value="${category.name}" maxlength="50">
          </div>
          <div class="form-group">
            <label for="editCatIcon">Ícone</label>
            <select id="editCatIcon">
              <option value="📦" ${category.icon === '📦' ? 'selected' : ''}>📦 Geral</option>
              <option value="📱" ${category.icon === '📱' ? 'selected' : ''}>📱 Eletrônicos</option>
              <option value="👕" ${category.icon === '👕' ? 'selected' : ''}>👕 Roupas</option>
              <option value="🍔" ${category.icon === '🍔' ? 'selected' : ''}>🍔 Alimentos</option>
              <option value="🥤" ${category.icon === '🥤' ? 'selected' : ''}>🥤 Bebidas</option>
              <option value="🏠" ${category.icon === '🏠' ? 'selected' : ''}>🏠 Casa</option>
              <option value="💄" ${category.icon === '💄' ? 'selected' : ''}>💄 Beleza</option>
              <option value="⚽" ${category.icon === '⚽' ? 'selected' : ''}>⚽ Esportes</option>
              <option value="🔧" ${category.icon === '🔧' ? 'selected' : ''}>🔧 Serviços</option>
              <option value="🎮" ${category.icon === '🎮' ? 'selected' : ''}>🎮 Games</option>
              <option value="📚" ${category.icon === '📚' ? 'selected' : ''}>📚 Livros</option>
              <option value="🎁" ${category.icon === '🎁' ? 'selected' : ''}>🎁 Presentes</option>
            </select>
          </div>
          <div class="form-group">
            <label for="editCatColor">Cor</label>
            <input type="color" id="editCatColor" value="${category.color}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" onclick="uiManager.saveProductCategory('${id}')">Salvar</button>
          <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  saveProductCategory(id) {
    const name = document.getElementById('editCatName').value.trim();
    const icon = document.getElementById('editCatIcon').value;
    const color = document.getElementById('editCatColor').value;

    if (!name) {
      Toast.show('Informe o nome da categoria', 'error');
      return;
    }

    salesManager.updateProductCategory(id, { name, icon, color });
    Toast.show('Categoria atualizada com sucesso!', 'success');
    authManager.log('UPDATE_PRODUCT_CATEGORY', 'Categoria de produto atualizada', { categoryId: id });
    
    document.querySelector('.modal-overlay').remove();
    this.renderProducts();
  },

  deleteProductCategory(id) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    if (salesManager.deleteProductCategory(id)) {
      Toast.show('Categoria excluída com sucesso!', 'success');
      authManager.log('DELETE_PRODUCT_CATEGORY', 'Categoria de produto excluída', { categoryId: id });
      this.renderProducts();
    }
  },

  filterProductsByCategory(categoryId) {
    const rows = document.querySelectorAll('.products-section tbody tr');
    rows.forEach(row => {
      if (categoryId === 'all') {
        row.style.display = '';
      } else {
        row.style.display = row.dataset.category === categoryId ? '' : 'none';
      }
    });
  },

  handleProductSubmit() {
    const name = document.getElementById('prodName').value;
    const categoryId = document.getElementById('prodCategory').value;
    const price = uiManager.parseCurrencyValue(document.getElementById('prodPrice').value);
    const cost = uiManager.parseCurrencyValue(document.getElementById('prodCost').value) || 0;
    const stock = parseInt(document.getElementById('prodStock').value) || 0;
    const unit = document.getElementById('prodUnit').value;
    const description = document.getElementById('prodDescription').value;

    if (!categoryId) {
      Toast.show('Selecione uma categoria', 'error');
      return;
    }

    const category = salesManager.getProductCategory(categoryId);

    const productData = {
      businessId: financeManager.currentBusinessId,
      name,
      categoryId,
      category: category ? category.name : '',
      price,
      cost,
      stock,
      unit,
      description
    };

    if (this.editingId) {
      salesManager.updateProduct(this.editingId, productData);
      Toast.show('Produto atualizado com sucesso!', 'success');
      authManager.log('UPDATE_PRODUCT', 'Produto atualizado', { productId: this.editingId });
    } else {
      const product = salesManager.createProduct(productData);
      Toast.show('Produto cadastrado com sucesso!', 'success');
      authManager.log('CREATE_PRODUCT', 'Novo produto cadastrado', { productId: product.id });
    }

    this.editingId = null;
    this.renderProducts();
  },

  editProduct(id) {
    const product = salesManager.getProduct(id);
    if (!product) return;

    this.editingId = id;
    this.renderProducts();

    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.categoryId || '';
    document.getElementById('prodPrice').value = toReais(product.price);
    document.getElementById('prodCost').value = toReais(product.cost);
    document.getElementById('prodStock').value = product.stock;
    document.getElementById('prodUnit').value = product.unit;
    document.getElementById('prodDescription').value = product.description || '';

    document.querySelector('.form-section:nth-of-type(2)').scrollIntoView({ behavior: 'smooth' });
  },

  deleteProduct(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    if (salesManager.deleteProduct(id)) {
      Toast.show('Produto excluído com sucesso!', 'success');
      authManager.log('DELETE_PRODUCT', 'Produto excluído', { productId: id });
      this.renderProducts();
    }
  }
});
