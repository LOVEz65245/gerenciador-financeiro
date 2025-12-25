// ============================================
// GERENCIADOR DE DEVEDORES
// Sistema completo para controle de pessoas que devem dinheiro
// ============================================

class DebtorsManager {
  constructor() {
    this.debtors = [];
    this.loadData();
  }

  // ============================================
  // CARREGAMENTO E SALVAMENTO
  // ============================================

  loadData() {
    this.debtors = this.loadFromStorage(CONFIG.STORAGE_KEYS.DEBTORS) || [];
  }

  /**
   * Alias para loadData (para compatibilidade com sincronização)
   */
  loadAllData() {
    this.loadData();
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

  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      
      // Sincronizar com Google Sheets em tempo real
      this.triggerGoogleSheetsSync(key);
      
      return true;
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
      return false;
    }
  }

  /**
   * Dispara sincronização com Google Sheets baseado na chave de armazenamento
   */
  triggerGoogleSheetsSync(storageKey) {
    if (!window.googleSheetsManager || !window.googleSheetsManager.isConnected) {
      return;
    }

    // Usar debounce para evitar múltiplas sincronizações seguidas
    if (this._syncTimeout) {
      clearTimeout(this._syncTimeout);
    }
    
    this._syncTimeout = setTimeout(() => {
      console.log('🔄 Sincronizando devedores com Google Sheets...');
      window.googleSheetsManager.syncAll().then(() => {
        console.log('✅ Sincronização de devedores concluída');
      }).catch(err => {
        console.error('❌ Erro na sincronização:', err);
      });
    }, 1000); // Aguardar 1 segundo antes de sincronizar
  }

  // ============================================
  // GERENCIAMENTO DE DEVEDORES
  // ============================================

  createDebtor(data) {
    const {
      businessId,
      name,
      email = '',
      phone = '',
      document = '',
      address = '',
      totalAmount,
      paidAmount = 0,
      interestRate = 0,
      dueDate,
      installments = 1,
      description = '',
      notes = ''
    } = data;

    const totalAmountCents = toCents(totalAmount);
    const paidAmountCents = toCents(paidAmount);
    const installmentsCount = parseInt(installments) || 1;
    const installmentValue = Math.ceil(totalAmountCents / installmentsCount);

    // Gerar parcelas
    const installmentsList = [];
    const startDate = new Date(dueDate);
    
    for (let i = 0; i < installmentsCount; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      installmentsList.push({
        id: generateId(),
        number: i + 1,
        amount: installmentValue,
        dueDate: installmentDate.toISOString(),
        paidAmount: 0,
        paidDate: null,
        status: 'pendente'
      });
    }

    // Ajustar última parcela para valor exato
    if (installmentsList.length > 0) {
      const totalInstallments = installmentsList.reduce((sum, inst) => sum + inst.amount, 0);
      const diff = totalAmountCents - totalInstallments;
      installmentsList[installmentsList.length - 1].amount += diff;
    }

    const debtor = {
      id: generateId(),
      businessId,
      name: sanitizeString(name),
      email: sanitizeString(email),
      phone: sanitizeString(phone),
      document: sanitizeString(document),
      address: sanitizeString(address),
      totalAmount: totalAmountCents,
      paidAmount: paidAmountCents,
      remainingAmount: totalAmountCents - paidAmountCents,
      interestRate: parseFloat(interestRate) || 0,
      originalDueDate: new Date(dueDate).toISOString(),
      installments: installmentsList,
      installmentsCount,
      installmentsPaid: 0,
      description: sanitizeString(description),
      notes: sanitizeString(notes),
      status: CONFIG.DEBTOR_STATUS.ACTIVE,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.debtors.push(debtor);
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
    this.updateDebtorStatus(debtor.id);
    return debtor;
  }

  getDebtorsByBusiness(businessId) {
    return this.debtors.filter(d => d.businessId === businessId)
      .sort((a, b) => {
        // Ordenar por status (vencidos primeiro) e depois por data
        const aOverdue = this.isDebtorOverdue(a);
        const bOverdue = this.isDebtorOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return new Date(a.originalDueDate) - new Date(b.originalDueDate);
      });
  }

  getDebtor(id) {
    return this.debtors.find(d => d.id === id);
  }

  updateDebtor(id, updates) {
    const debtor = this.getDebtor(id);
    if (debtor) {
      if (updates.totalAmount !== undefined) {
        updates.totalAmount = toCents(updates.totalAmount);
        updates.remainingAmount = updates.totalAmount - debtor.paidAmount;
      }

      Object.assign(debtor, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : debtor.name,
        email: updates.email !== undefined ? sanitizeString(updates.email) : debtor.email,
        phone: updates.phone !== undefined ? sanitizeString(updates.phone) : debtor.phone,
        document: updates.document !== undefined ? sanitizeString(updates.document) : debtor.document,
        address: updates.address !== undefined ? sanitizeString(updates.address) : debtor.address,
        description: updates.description !== undefined ? sanitizeString(updates.description) : debtor.description,
        notes: updates.notes !== undefined ? sanitizeString(updates.notes) : debtor.notes,
        updatedAt: new Date().toISOString()
      });

      this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
      this.updateDebtorStatus(id);
    }
    return debtor;
  }

  deleteDebtor(id) {
    this.debtors = this.debtors.filter(d => d.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
    return true;
  }

  // ============================================
  // PAGAMENTOS
  // ============================================

  registerPayment(debtorId, amount, paymentDate = new Date(), installmentId = null, notes = '') {
    const debtor = this.getDebtor(debtorId);
    if (!debtor) return null;

    const paymentAmount = toCents(amount);
    
    const payment = {
      id: generateId(),
      amount: paymentAmount,
      date: new Date(paymentDate).toISOString(),
      installmentId,
      notes: sanitizeString(notes)
    };

    // Garantir que payments existe
    if (!debtor.payments || !Array.isArray(debtor.payments)) {
      debtor.payments = [];
    }

    // Garantir que os campos de valor existem (compatibilidade com dados importados)
    if (debtor.paidAmount === undefined) {
      debtor.paidAmount = debtor.paidValue || 0;
    }
    if (debtor.totalAmount === undefined) {
      debtor.totalAmount = debtor.totalValue || 0;
    }

    debtor.payments.push(payment);
    debtor.paidAmount += paymentAmount;
    debtor.remainingAmount = Math.max(0, debtor.totalAmount - debtor.paidAmount);

    // Verificar se installments existe e é um array
    if (debtor.installments && Array.isArray(debtor.installments) && debtor.installments.length > 0) {
      // Atualizar parcela específica se informada
      if (installmentId) {
        const installment = debtor.installments.find(i => i && i.id === installmentId);
        if (installment) {
          installment.paidAmount = (installment.paidAmount || 0) + paymentAmount;
          installment.paidDate = new Date(paymentDate).toISOString();
          if (installment.paidAmount >= (installment.amount || 0)) {
            installment.status = 'pago';
          } else if (installment.paidAmount > 0) {
            installment.status = 'parcial';
          }
        }
      } else {
        // Distribuir pagamento nas parcelas pendentes
        let remainingPayment = paymentAmount;
        for (const installment of debtor.installments) {
          if (!installment) continue;
          if (remainingPayment <= 0) break;
          if (installment.status === 'pago') continue;

          const instAmount = installment.amount || 0;
          const instPaidAmount = installment.paidAmount || 0;
          const installmentRemaining = instAmount - instPaidAmount;
          const paymentForInstallment = Math.min(remainingPayment, installmentRemaining);
          
          installment.paidAmount = instPaidAmount + paymentForInstallment;
          remainingPayment -= paymentForInstallment;

          if (installment.paidAmount >= instAmount) {
            installment.status = 'pago';
            installment.paidDate = new Date(paymentDate).toISOString();
          } else if (installment.paidAmount > 0) {
            installment.status = 'parcial';
          }
        }
      }

      // Contar parcelas pagas
      debtor.installmentsPaid = debtor.installments.filter(i => i && i.status === 'pago').length;
      debtor.installmentsCount = debtor.installments.length;
    }

    debtor.updatedAt = new Date().toISOString();
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
    this.updateDebtorStatus(debtorId);

    return debtor;
  }

  removePayment(debtorId, paymentId) {
    const debtor = this.getDebtor(debtorId);
    if (!debtor) return false;

    // Verificar se payments existe
    if (!debtor.payments || !Array.isArray(debtor.payments)) {
      return false;
    }

    const paymentIndex = debtor.payments.findIndex(p => p && p.id === paymentId);
    if (paymentIndex === -1) return false;

    const payment = debtor.payments[paymentIndex];
    const paymentAmount = payment.amount || 0;
    
    // Garantir que os campos de valor existem
    if (debtor.paidAmount === undefined) {
      debtor.paidAmount = debtor.paidValue || 0;
    }
    if (debtor.totalAmount === undefined) {
      debtor.totalAmount = debtor.totalValue || 0;
    }
    
    // Reverter valores
    debtor.paidAmount = Math.max(0, debtor.paidAmount - paymentAmount);
    debtor.remainingAmount = Math.max(0, debtor.totalAmount - debtor.paidAmount);

    // Reverter parcela se aplicável
    if (payment.installmentId && debtor.installments && Array.isArray(debtor.installments)) {
      const installment = debtor.installments.find(i => i && i.id === payment.installmentId);
      if (installment) {
        installment.paidAmount = Math.max(0, (installment.paidAmount || 0) - paymentAmount);
        installment.paidDate = null;
        if (installment.paidAmount <= 0) {
          installment.status = 'pendente';
          installment.paidAmount = 0;
        } else {
          installment.status = 'parcial';
        }
      }
    }

    debtor.payments.splice(paymentIndex, 1);
    
    // Atualizar contagem de parcelas pagas
    if (debtor.installments && Array.isArray(debtor.installments)) {
      debtor.installmentsPaid = debtor.installments.filter(i => i && i.status === 'pago').length;
    }
    
    debtor.updatedAt = new Date().toISOString();

    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
    this.updateDebtorStatus(debtorId);

    return true;
  }

  // ============================================
  // STATUS E VERIFICAÇÕES
  // ============================================

  isDebtorOverdue(debtor) {
    if (!debtor) return false;
    if (debtor.status === CONFIG.DEBTOR_STATUS.PAID) return false;
    
    // Verificar se installments existe e é um array
    if (!debtor.installments || !Array.isArray(debtor.installments)) {
      // Se não tiver parcelas, verificar pela data de vencimento original
      const dueDate = debtor.originalDueDate || debtor.dueDate;
      return dueDate ? isOverdue(dueDate) : false;
    }
    
    return debtor.installments.some(inst => 
      inst && inst.status !== 'pago' && isOverdue(inst.dueDate)
    );
  }

  getNextDueDate(debtor) {
    // Verificar se debtor e installments existem
    if (!debtor || !debtor.installments || !Array.isArray(debtor.installments)) {
      // Se não tiver parcelas, usar originalDueDate ou dueDate
      return debtor?.originalDueDate || debtor?.dueDate || null;
    }
    
    const pendingInstallments = debtor.installments
      .filter(i => i && i.status !== 'pago')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    return pendingInstallments.length > 0 ? pendingInstallments[0].dueDate : null;
  }

  updateDebtorStatus(debtorId) {
    const debtor = this.getDebtor(debtorId);
    if (!debtor) return;

    // Garantir que remainingAmount existe
    if (debtor.remainingAmount === undefined) {
      const totalAmount = debtor.totalAmount || debtor.totalValue || 0;
      const paidAmount = debtor.paidAmount || debtor.paidValue || 0;
      debtor.remainingAmount = Math.max(0, totalAmount - paidAmount);
    }

    if (debtor.remainingAmount <= 0) {
      debtor.status = CONFIG.DEBTOR_STATUS.PAID;
    } else if (this.isDebtorOverdue(debtor)) {
      // Verificar se installments existe e é um array
      if (debtor.installments && Array.isArray(debtor.installments)) {
        const overdueInstallments = debtor.installments.filter(i => 
          i && i.status !== 'pago' && isOverdue(i.dueDate)
        );
        // Se mais de 30 dias de atraso, marcar como inadimplente
        const oldestOverdue = overdueInstallments.sort((a, b) => 
          new Date(a.dueDate) - new Date(b.dueDate)
        )[0];
        
        if (oldestOverdue && daysBetween(oldestOverdue.dueDate, new Date()) > 30) {
          debtor.status = CONFIG.DEBTOR_STATUS.DEFAULTED;
        } else {
          debtor.status = CONFIG.DEBTOR_STATUS.OVERDUE;
        }
      } else {
        // Se não tiver parcelas, verificar pela data de vencimento original
        const dueDate = debtor.originalDueDate || debtor.dueDate;
        if (dueDate && daysBetween(dueDate, new Date()) > 30) {
          debtor.status = CONFIG.DEBTOR_STATUS.DEFAULTED;
        } else {
          debtor.status = CONFIG.DEBTOR_STATUS.OVERDUE;
        }
      }
    } else if ((debtor.paidAmount || debtor.paidValue || 0) > 0) {
      debtor.status = CONFIG.DEBTOR_STATUS.PARTIAL;
    } else {
      debtor.status = CONFIG.DEBTOR_STATUS.ACTIVE;
    }

    debtor.updatedAt = new Date().toISOString();
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
  }

  // ============================================
  // ESTATÍSTICAS E RELATÓRIOS
  // ============================================

  getStats(businessId) {
    const debtors = this.getDebtorsByBusiness(businessId);
    
    const activeDebtors = debtors.filter(d => d.status !== CONFIG.DEBTOR_STATUS.PAID);
    const paidDebtors = debtors.filter(d => d.status === CONFIG.DEBTOR_STATUS.PAID);
    const overdueDebtors = debtors.filter(d => 
      d.status === CONFIG.DEBTOR_STATUS.OVERDUE || d.status === CONFIG.DEBTOR_STATUS.DEFAULTED
    );

    // Usar função auxiliar para obter valores com fallback
    const getRemainingAmount = (d) => d.remainingAmount || d.remainingValue || 
      ((d.totalAmount || d.totalValue || 0) - (d.paidAmount || d.paidValue || 0));
    const getPaidAmount = (d) => d.paidAmount || d.paidValue || 0;

    const totalToReceive = activeDebtors.reduce((sum, d) => sum + getRemainingAmount(d), 0);
    const totalReceived = debtors.reduce((sum, d) => sum + getPaidAmount(d), 0);
    const totalOverdue = overdueDebtors.reduce((sum, d) => sum + getRemainingAmount(d), 0);

    return {
      totalDebtors: debtors.length,
      activeDebtors: activeDebtors.length,
      paidDebtors: paidDebtors.length,
      overdueDebtors: overdueDebtors.length,
      totalToReceive,
      totalReceived,
      totalOverdue,
      averageDebt: activeDebtors.length > 0 ? totalToReceive / activeDebtors.length : 0
    };
  }

  getOverdueDebtors(businessId) {
    return this.getDebtorsByBusiness(businessId)
      .filter(d => d.status === CONFIG.DEBTOR_STATUS.OVERDUE || d.status === CONFIG.DEBTOR_STATUS.DEFAULTED)
      .sort((a, b) => {
        const aNextDue = this.getNextDueDate(a);
        const bNextDue = this.getNextDueDate(b);
        if (!aNextDue) return 1;
        if (!bNextDue) return -1;
        return new Date(aNextDue) - new Date(bNextDue);
      });
  }

  getUpcomingDues(businessId, days = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.getDebtorsByBusiness(businessId)
      .filter(d => {
        if (d.status === CONFIG.DEBTOR_STATUS.PAID) return false;
        const nextDue = this.getNextDueDate(d);
        if (!nextDue) return false;
        const dueDate = new Date(nextDue);
        return dueDate >= today && dueDate <= futureDate;
      })
      .sort((a, b) => {
        const aNextDue = this.getNextDueDate(a);
        const bNextDue = this.getNextDueDate(b);
        return new Date(aNextDue) - new Date(bNextDue);
      });
  }

  getMonthlyReceivables(businessId, months = 6) {
    const stats = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      let totalDue = 0;
      const debtors = this.getDebtorsByBusiness(businessId);
      
      debtors.forEach(debtor => {
        if (debtor.status === CONFIG.DEBTOR_STATUS.PAID) return;
        
        // Verificar se installments existe e é um array
        if (debtor.installments && Array.isArray(debtor.installments)) {
          debtor.installments.forEach(inst => {
            if (!inst || inst.status === 'pago') return;
            const dueDate = new Date(inst.dueDate);
            if (dueDate >= startOfMonth && dueDate <= endOfMonth) {
              totalDue += (inst.amount || 0) - (inst.paidAmount || 0);
            }
          });
        } else {
          // Se não tiver parcelas, usar o valor restante e a data de vencimento original
          const dueDate = debtor.originalDueDate || debtor.dueDate;
          if (dueDate) {
            const dueDateObj = new Date(dueDate);
            if (dueDateObj >= startOfMonth && dueDateObj <= endOfMonth) {
              const remainingAmount = debtor.remainingAmount || debtor.remainingValue || 
                ((debtor.totalAmount || debtor.totalValue || 0) - (debtor.paidAmount || debtor.paidValue || 0));
              totalDue += remainingAmount;
            }
          }
        }
      });

      stats.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        monthName: date.toLocaleDateString(CONFIG.LOCALE, { month: 'short', year: 'numeric' }),
        totalDue
      });
    }

    return stats;
  }

  // ============================================
  // EXPORTAÇÃO DE DADOS
  // ============================================

  exportData() {
    return {
      debtors: this.debtors
    };
  }

  importData(data) {
    if (data.debtors) {
      this.debtors = data.debtors;
      this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
    }
  }

  // ============================================
  // MÉTODOS GLOBAIS PARA SINCRONIZAÇÃO
  // ============================================

  /**
   * Retorna todos os devedores (para sincronização)
   * @returns {Array} Lista de todos os devedores
   */
  getDebtors() {
    return [...this.debtors];
  }

  /**
   * Salva os dados dos devedores (para sincronização)
   */
  saveData() {
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
  }

  /**
   * Salva todos os dados no localStorage (alias para saveData)
   */
  saveAllData() {
    this.saveToStorage(CONFIG.STORAGE_KEYS.DEBTORS, this.debtors);
  }
}

// Instância global
window.debtorsManager = new DebtorsManager();
