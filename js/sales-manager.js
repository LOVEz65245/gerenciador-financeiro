// ============================================
// GERENCIADOR DE VENDAS E CLIENTES
// Sistema completo para controle de vendas
// ============================================

class SalesManager {
  constructor() {
    this.sales = [];
    this.customers = [];
    this.products = [];
    this.productCategories = [];
    this.loadData();
  }

  // ============================================
  // CARREGAMENTO E SALVAMENTO
  // ============================================

  loadData() {
    this.sales = this.loadFromStorage(CONFIG.STORAGE_KEYS.SALES) || [];
    this.customers = this.loadFromStorage(CONFIG.STORAGE_KEYS.CUSTOMERS) || [];
    this.products = this.loadFromStorage(CONFIG.STORAGE_KEYS.PRODUCTS) || [];
    this.productCategories = this.loadFromStorage(CONFIG.STORAGE_KEYS.PRODUCT_CATEGORIES) || [];
  }

  /**
   * Alias para loadData (para compatibilidade com sincronização)
   */
  loadAllData() {
    this.loadData();
    
    // Inicializar categorias padrão se não existirem
    if (this.productCategories.length === 0) {
      this.initializeDefaultProductCategories();
    }
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
      console.log('🔄 Sincronizando vendas/produtos com Google Sheets...');
      window.googleSheetsManager.syncAll().then(() => {
        console.log('✅ Sincronização de vendas/produtos concluída');
      }).catch(err => {
        console.error('❌ Erro na sincronização:', err);
      });
    }, 1000); // Aguardar 1 segundo antes de sincronizar
  }

  // ============================================
  // GERENCIAMENTO DE CATEGORIAS DE PRODUTOS
  // ============================================

  initializeDefaultProductCategories() {
    const defaultCategories = CONFIG.DEFAULT_PRODUCT_CATEGORIES || [
      { name: 'Eletrônicos', icon: '📱', color: '#3B82F6' },
      { name: 'Roupas', icon: '👕', color: '#EC4899' },
      { name: 'Alimentos', icon: '🍔', color: '#F59E0B' },
      { name: 'Bebidas', icon: '🥤', color: '#06B6D4' },
      { name: 'Casa e Jardim', icon: '🏠', color: '#10B981' },
      { name: 'Beleza', icon: '💄', color: '#D946EF' },
      { name: 'Esportes', icon: '⚽', color: '#EF4444' },
      { name: 'Serviços', icon: '🔧', color: '#8B5CF6' },
      { name: 'Outros', icon: '📦', color: '#64748B' }
    ];

    defaultCategories.forEach(cat => {
      this.createProductCategory({
        name: cat.name,
        icon: cat.icon,
        color: cat.color
      });
    });
  }

  createProductCategory(data) {
    const { name, icon = '📦', color = '#64748B' } = data;

    const category = {
      id: generateId(),
      name: sanitizeString(name),
      icon: icon,
      color: color,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.productCategories.push(category);
    this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCT_CATEGORIES, this.productCategories);
    return category;
  }

  getProductCategories() {
    return this.productCategories.filter(c => c.isActive);
  }

  getProductCategory(id) {
    return this.productCategories.find(c => c.id === id);
  }

  updateProductCategory(id, updates) {
    const category = this.getProductCategory(id);
    if (category) {
      Object.assign(category, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : category.name,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCT_CATEGORIES, this.productCategories);
    }
    return category;
  }

  deleteProductCategory(id) {
    // Verificar se há produtos vinculados
    const hasProducts = this.products.some(p => p.categoryId === id && p.isActive);
    if (hasProducts) {
      Toast.show('Não é possível excluir categoria com produtos vinculados', 'error');
      return false;
    }

    const category = this.getProductCategory(id);
    if (category) {
      category.isActive = false;
      category.updatedAt = new Date().toISOString();
      this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCT_CATEGORIES, this.productCategories);
    }
    return true;
  }

  // ============================================
  // GERENCIAMENTO DE CLIENTES
  // ============================================

  createCustomer(data) {
    const {
      businessId,
      name,
      email = '',
      phone = '',
      document = '',
      address = '',
      notes = ''
    } = data;

    const customer = {
      id: generateId(),
      businessId,
      name: sanitizeString(name),
      email: sanitizeString(email),
      phone: sanitizeString(phone),
      document: sanitizeString(document),
      address: sanitizeString(address),
      notes: sanitizeString(notes),
      totalPurchases: 0,
      totalSpent: 0,
      lastPurchase: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.customers.push(customer);
    this.saveToStorage(CONFIG.STORAGE_KEYS.CUSTOMERS, this.customers);
    return customer;
  }

  getCustomersByBusiness(businessId) {
    return this.customers.filter(c => c.businessId === businessId);
  }

  getCustomer(id) {
    return this.customers.find(c => c.id === id);
  }

  updateCustomer(id, updates) {
    const customer = this.getCustomer(id);
    if (customer) {
      Object.assign(customer, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : customer.name,
        email: updates.email !== undefined ? sanitizeString(updates.email) : customer.email,
        phone: updates.phone !== undefined ? sanitizeString(updates.phone) : customer.phone,
        document: updates.document !== undefined ? sanitizeString(updates.document) : customer.document,
        address: updates.address !== undefined ? sanitizeString(updates.address) : customer.address,
        notes: updates.notes !== undefined ? sanitizeString(updates.notes) : customer.notes,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.CUSTOMERS, this.customers);
    }
    return customer;
  }

  deleteCustomer(id) {
    // Verificar se há vendas vinculadas
    const hasSales = this.sales.some(s => s.customerId === id);
    if (hasSales) {
      Toast.show('Não é possível excluir cliente com vendas vinculadas', 'error');
      return false;
    }

    this.customers = this.customers.filter(c => c.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.CUSTOMERS, this.customers);
    return true;
  }

  updateCustomerStats(customerId) {
    const customer = this.getCustomer(customerId);
    if (!customer) return;

    const customerSales = this.sales.filter(s => s.customerId === customerId && s.status !== CONFIG.SALE_STATUS.CANCELLED);
    customer.totalPurchases = customerSales.length;
    customer.totalSpent = customerSales.reduce((sum, s) => sum + s.paidAmount, 0);
    customer.lastPurchase = customerSales.length > 0 
      ? customerSales.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date 
      : null;
    customer.updatedAt = new Date().toISOString();
    
    this.saveToStorage(CONFIG.STORAGE_KEYS.CUSTOMERS, this.customers);
  }

  // ============================================
  // GERENCIAMENTO DE PRODUTOS
  // ============================================

  createProduct(data) {
    const {
      businessId,
      name,
      description = '',
      price,
      cost = 0,
      stock = 0,
      unit = 'un',
      categoryId = '',
      category = '' // Mantém compatibilidade com versão anterior
    } = data;

    const product = {
      id: generateId(),
      businessId,
      name: sanitizeString(name),
      description: sanitizeString(description),
      price: toCents(price),
      cost: toCents(cost),
      stock: parseInt(stock) || 0,
      unit: sanitizeString(unit),
      categoryId: categoryId || '', // ID da categoria
      category: sanitizeString(category), // Nome da categoria (legado)
      isActive: true,
      totalSold: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.products.push(product);
    this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCTS, this.products);
    return product;
  }

  getProductsByBusiness(businessId) {
    return this.products.filter(p => p.businessId === businessId && p.isActive);
  }

  getProductsByCategory(businessId, categoryId) {
    return this.products.filter(p => 
      p.businessId === businessId && 
      p.isActive && 
      p.categoryId === categoryId
    );
  }

  getProduct(id) {
    return this.products.find(p => p.id === id);
  }

  updateProduct(id, updates) {
    const product = this.getProduct(id);
    if (product) {
      if (updates.price !== undefined) updates.price = toCents(updates.price);
      if (updates.cost !== undefined) updates.cost = toCents(updates.cost);
      if (updates.stock !== undefined) updates.stock = parseInt(updates.stock) || 0;

      Object.assign(product, {
        ...updates,
        name: updates.name ? sanitizeString(updates.name) : product.name,
        description: updates.description !== undefined ? sanitizeString(updates.description) : product.description,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCTS, this.products);
    }
    return product;
  }

  deleteProduct(id) {
    const product = this.getProduct(id);
    if (product) {
      product.isActive = false;
      product.updatedAt = new Date().toISOString();
      this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCTS, this.products);
    }
    return true;
  }

  updateProductStock(productId, quantity, operation = 'subtract') {
    const product = this.getProduct(productId);
    if (!product) return;

    if (operation === 'subtract') {
      product.stock = Math.max(0, product.stock - quantity);
      product.totalSold += quantity;
    } else {
      product.stock += quantity;
    }
    product.updatedAt = new Date().toISOString();
    this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCTS, this.products);
  }

  // ============================================
  // GERENCIAMENTO DE VENDAS
  // ============================================

  createSale(data) {
    const {
      businessId,
      customerId = null,
      customerName = '',
      items = [],
      discount = 0,
      paymentType,
      installments = 1,
      dueDate = null,
      accountId = null,
      notes = ''
    } = data;

    // Calcular totais
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = toCents(discount);
    const totalAmount = subtotal - discountAmount;

    const sale = {
      id: generateId(),
      businessId,
      customerId,
      customerName: customerId ? '' : sanitizeString(customerName),
      items: items.map(item => {
        const product = item.productId ? this.getProduct(item.productId) : null;
        return {
          productId: item.productId,
          productName: sanitizeString(item.productName),
          categoryId: product ? product.categoryId : '',
          quantity: parseInt(item.quantity) || 1,
          price: toCents(item.price),
          cost: product ? product.cost : 0,
          total: toCents(item.price) * (parseInt(item.quantity) || 1)
        };
      }),
      subtotal,
      discount: discountAmount,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      paymentType,
      installments: parseInt(installments) || 1,
      installmentsPaid: 0,
      installmentValue: Math.ceil(totalAmount / (parseInt(installments) || 1)),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      accountId,
      status: CONFIG.SALE_STATUS.PENDING,
      payments: [],
      notes: sanitizeString(notes),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Atualizar estoque dos produtos
    items.forEach(item => {
      if (item.productId) {
        this.updateProductStock(item.productId, parseInt(item.quantity) || 1, 'subtract');
      }
    });

    this.sales.push(sale);
    this.saveToStorage(CONFIG.STORAGE_KEYS.SALES, this.sales);

    // Atualizar estatísticas do cliente
    if (customerId) {
      this.updateCustomerStats(customerId);
    }

    return sale;
  }

  getSalesByBusiness(businessId) {
    return this.sales.filter(s => s.businessId === businessId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  getSale(id) {
    return this.sales.find(s => s.id === id);
  }

  updateSale(id, updates) {
    const sale = this.getSale(id);
    if (sale) {
      Object.assign(sale, {
        ...updates,
        notes: updates.notes !== undefined ? sanitizeString(updates.notes) : sale.notes,
        updatedAt: new Date().toISOString()
      });
      this.saveToStorage(CONFIG.STORAGE_KEYS.SALES, this.sales);
    }
    return sale;
  }

  deleteSale(id) {
    const sale = this.getSale(id);
    if (!sale) return false;

    // Reverter estoque
    sale.items.forEach(item => {
      if (item.productId) {
        this.updateProductStock(item.productId, item.quantity, 'add');
      }
    });

    this.sales = this.sales.filter(s => s.id !== id);
    this.saveToStorage(CONFIG.STORAGE_KEYS.SALES, this.sales);

    // Atualizar estatísticas do cliente
    if (sale.customerId) {
      this.updateCustomerStats(sale.customerId);
    }

    return true;
  }

  registerSalePayment(saleId, amount, paymentDate = new Date(), accountId = null, notes = '') {
    const sale = this.getSale(saleId);
    if (!sale) return null;

    const paymentAmount = toCents(amount);
    
    // Obter nome da conta se disponível
    let accountName = '';
    if (accountId && typeof financeManager !== 'undefined') {
      const account = financeManager.getAccount(accountId);
      accountName = account ? account.name : '';
    }
    
    const payment = {
      id: generateId(),
      amount: paymentAmount,
      date: new Date(paymentDate).toISOString(),
      accountId,
      accountName,
      notes
    };

    sale.payments.push(payment);
    sale.paidAmount += paymentAmount;
    sale.remainingAmount = Math.max(0, sale.totalAmount - sale.paidAmount);
    sale.installmentsPaid = Math.floor(sale.paidAmount / sale.installmentValue);

    // Atualizar status
    if (sale.remainingAmount === 0) {
      sale.status = CONFIG.SALE_STATUS.PAID;
    } else if (sale.paidAmount > 0) {
      sale.status = CONFIG.SALE_STATUS.PARTIAL;
    }

    sale.updatedAt = new Date().toISOString();
    this.saveToStorage(CONFIG.STORAGE_KEYS.SALES, this.sales);

    // Atualizar estatísticas do cliente
    if (sale.customerId) {
      this.updateCustomerStats(sale.customerId);
    }

    return sale;
  }

  cancelSale(id) {
    const sale = this.getSale(id);
    if (!sale) return false;

    sale.status = CONFIG.SALE_STATUS.CANCELLED;
    sale.updatedAt = new Date().toISOString();

    // Reverter estoque
    sale.items.forEach(item => {
      if (item.productId) {
        this.updateProductStock(item.productId, item.quantity, 'add');
      }
    });

    this.saveToStorage(CONFIG.STORAGE_KEYS.SALES, this.sales);

    // Atualizar estatísticas do cliente
    if (sale.customerId) {
      this.updateCustomerStats(sale.customerId);
    }

    return true;
  }

  // ============================================
  // ESTATÍSTICAS E RELATÓRIOS
  // ============================================

  getSalesStats(businessId, startDate = null, endDate = null) {
    let sales = this.getSalesByBusiness(businessId)
      .filter(s => s.status !== CONFIG.SALE_STATUS.CANCELLED);

    if (startDate) {
      sales = sales.filter(s => new Date(s.date) >= new Date(startDate));
    }
    if (endDate) {
      sales = sales.filter(s => new Date(s.date) <= new Date(endDate));
    }

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalReceived = sales.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalPending = sales.reduce((sum, s) => sum + s.remainingAmount, 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    const pendingSales = sales.filter(s => s.status === CONFIG.SALE_STATUS.PENDING || s.status === CONFIG.SALE_STATUS.PARTIAL);
    const paidSales = sales.filter(s => s.status === CONFIG.SALE_STATUS.PAID);
    const overdueSales = sales.filter(s => 
      (s.status === CONFIG.SALE_STATUS.PENDING || s.status === CONFIG.SALE_STATUS.PARTIAL) && 
      s.dueDate && isOverdue(s.dueDate)
    );

    return {
      totalSales,
      totalRevenue,
      totalReceived,
      totalPending,
      averageTicket,
      pendingSalesCount: pendingSales.length,
      paidSalesCount: paidSales.length,
      overdueSalesCount: overdueSales.length,
      overdueAmount: overdueSales.reduce((sum, s) => sum + s.remainingAmount, 0)
    };
  }

  // ============================================
  // ESTATÍSTICAS POR CATEGORIA
  // ============================================

  getCategoryStats(businessId, startDate = null, endDate = null) {
    let sales = this.getSalesByBusiness(businessId)
      .filter(s => s.status !== CONFIG.SALE_STATUS.CANCELLED);

    if (startDate) {
      sales = sales.filter(s => new Date(s.date) >= new Date(startDate));
    }
    if (endDate) {
      sales = sales.filter(s => new Date(s.date) <= new Date(endDate));
    }

    const categoryStats = {};
    const categories = this.getProductCategories();

    // Inicializar estatísticas para cada categoria
    categories.forEach(cat => {
      categoryStats[cat.id] = {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        totalSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        itemCount: 0
      };
    });

    // Adicionar categoria "Sem Categoria"
    categoryStats['uncategorized'] = {
      id: 'uncategorized',
      name: 'Sem Categoria',
      icon: '📦',
      color: '#64748B',
      totalSold: 0,
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMargin: 0,
      itemCount: 0
    };

    // Calcular estatísticas
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const categoryId = item.categoryId || 'uncategorized';
        
        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            id: categoryId,
            name: 'Categoria Removida',
            icon: '❓',
            color: '#94A3B8',
            totalSold: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            profitMargin: 0,
            itemCount: 0
          };
        }

        const revenue = item.total;
        const cost = (item.cost || 0) * item.quantity;
        const profit = revenue - cost;

        categoryStats[categoryId].totalSold += item.quantity;
        categoryStats[categoryId].totalRevenue += revenue;
        categoryStats[categoryId].totalCost += cost;
        categoryStats[categoryId].totalProfit += profit;
        categoryStats[categoryId].itemCount++;
      });
    });

    // Calcular margem de lucro
    Object.values(categoryStats).forEach(stat => {
      if (stat.totalRevenue > 0) {
        stat.profitMargin = (stat.totalProfit / stat.totalRevenue) * 100;
      }
    });

    // Converter para array e ordenar por receita
    return Object.values(categoryStats)
      .filter(stat => stat.totalSold > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  getTopSellingCategories(businessId, limit = 5, startDate = null, endDate = null) {
    const stats = this.getCategoryStats(businessId, startDate, endDate);
    return stats.slice(0, limit);
  }

  getMostProfitableCategories(businessId, limit = 5, startDate = null, endDate = null) {
    const stats = this.getCategoryStats(businessId, startDate, endDate);
    return stats.sort((a, b) => b.totalProfit - a.totalProfit).slice(0, limit);
  }

  getCategoryProfitAnalysis(businessId, startDate = null, endDate = null) {
    const stats = this.getCategoryStats(businessId, startDate, endDate);
    
    const totalRevenue = stats.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalCost = stats.reduce((sum, s) => sum + s.totalCost, 0);
    const totalProfit = stats.reduce((sum, s) => sum + s.totalProfit, 0);
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      categories: stats,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        overallMargin,
        categoryCount: stats.length,
        bestCategory: stats[0] || null,
        worstCategory: stats[stats.length - 1] || null
      }
    };
  }

  getMonthlyStats(businessId, months = 6) {
    const stats = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthSales = this.getSalesByBusiness(businessId)
        .filter(s => {
          const saleDate = new Date(s.date);
          return saleDate >= startOfMonth && saleDate <= endOfMonth && s.status !== CONFIG.SALE_STATUS.CANCELLED;
        });

      // Calcular lucro do mês
      let monthProfit = 0;
      monthSales.forEach(sale => {
        sale.items.forEach(item => {
          const revenue = item.total;
          const cost = (item.cost || 0) * item.quantity;
          monthProfit += revenue - cost;
        });
      });

      stats.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        monthName: date.toLocaleDateString(CONFIG.LOCALE, { month: 'short', year: 'numeric' }),
        totalSales: monthSales.length,
        totalRevenue: monthSales.reduce((sum, s) => sum + s.totalAmount, 0),
        totalReceived: monthSales.reduce((sum, s) => sum + s.paidAmount, 0),
        totalProfit: monthProfit
      });
    }

    return stats;
  }

  getTopCustomers(businessId, limit = 5) {
    const customers = this.getCustomersByBusiness(businessId);
    return customers
      .filter(c => c.totalPurchases > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }

  getTopProducts(businessId, limit = 5) {
    const products = this.products.filter(p => p.businessId === businessId);
    return products
      .filter(p => p.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  getPendingSales(businessId) {
    return this.getSalesByBusiness(businessId)
      .filter(s => s.status === CONFIG.SALE_STATUS.PENDING || s.status === CONFIG.SALE_STATUS.PARTIAL)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
  }

  getOverdueSales(businessId) {
    return this.getSalesByBusiness(businessId)
      .filter(s => 
        (s.status === CONFIG.SALE_STATUS.PENDING || s.status === CONFIG.SALE_STATUS.PARTIAL) && 
        s.dueDate && isOverdue(s.dueDate)
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  // ============================================
  // EXPORTAÇÃO DE DADOS
  // ============================================

  exportData() {
    return {
      sales: this.sales,
      customers: this.customers,
      products: this.products,
      productCategories: this.productCategories
    };
  }

  importData(data) {
    if (data.sales) this.sales = data.sales;
    if (data.customers) this.customers = data.customers;
    if (data.products) this.products = data.products;
    if (data.productCategories) this.productCategories = data.productCategories;
    
    this.saveAllData();
  }

  /**
   * Salva todos os dados no localStorage
   */
  saveAllData() {
    this.saveToStorage(CONFIG.STORAGE_KEYS.SALES, this.sales);
    this.saveToStorage(CONFIG.STORAGE_KEYS.CUSTOMERS, this.customers);
    this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCTS, this.products);
    this.saveToStorage(CONFIG.STORAGE_KEYS.PRODUCT_CATEGORIES, this.productCategories);
  }

  // ============================================
  // MÉTODOS GLOBAIS PARA SINCRONIZAÇÃO
  // ============================================

  /**
   * Retorna todas as vendas (para sincronização)
   * @returns {Array} Lista de todas as vendas
   */
  getSales() {
    return [...this.sales];
  }

  /**
   * Retorna todos os clientes (para sincronização)
   * @returns {Array} Lista de todos os clientes
   */
  getClients() {
    return [...this.customers];
  }

  /**
   * Retorna todos os produtos (para sincronização)
   * @returns {Array} Lista de todos os produtos
   */
  getProducts() {
    return [...this.products];
  }

  /**
   * Retorna todas as categorias de produtos (para sincronização)
   * @returns {Array} Lista de todas as categorias de produtos
   */
  getAllProductCategories() {
    return [...this.productCategories];
  }
}

// Instância global
window.salesManager = new SalesManager();
