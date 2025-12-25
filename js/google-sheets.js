// ============================================
// GOOGLE SHEETS MANAGER - VIA WEB APP
// Usa Google Apps Script Web App como backend
// Não requer autenticação OAuth
// ============================================

class GoogleSheetsManager {
    constructor() {
        // ============================================
        // CONFIGURAÇÕES DO WEB APP
        // ============================================
        this.WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxSyzxXJjdIsMdTnhElvrKEx6EEU795Z5EJlXeYq5uXvQhVwLN0__rQT7p6fad9ryVBQA/exec';
        
        // Estado
        this.isConnected = false;
        this.isInitialized = false;
        this.lastSync = null;
        this.syncInterval = null;
        this.autoSyncEnabled = true;
        this.syncStatus = 'disconnected';
        this.useJsonp = false; // Usar JSONP para evitar CORS se necessário
        
        // Nomes das abas (devem corresponder ao Apps Script)
        this.SHEETS = {
            TRANSACTIONS: 'Transações',
            ACCOUNTS: 'Contas',
            CATEGORIES: 'Categorias',
            SALES: 'Vendas',
            CLIENTS: 'Clientes',
            PRODUCTS: 'Produtos',
            DEBTORS: 'Devedores',
            DEBTS: 'Dívidas',
            BUDGETS: 'Orçamentos',
            GOALS: 'Metas',
            INVESTMENTS: 'Investimentos',
            BUSINESSES: 'Perfis'
        };

        console.log('📊 GoogleSheetsManager inicializado (modo Web App)');
    }

    // ============================================
    // CREDENCIAIS
    // ============================================

    getCredentials() {
        return {
            webAppUrl: this.WEB_APP_URL,
            spreadsheetId: 'Via Web App'
        };
    }

    // ============================================
    // CONEXÃO
    // ============================================

    async connect() {
        try {
            console.log('🔄 Conectando ao Google Sheets via Web App...');
            
            // Primeiro tentar com fetch normal
            try {
                const response = await fetch(`${this.WEB_APP_URL}?action=getStructure`);
                
                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.success) {
                        console.log('✅ Conectado ao Web App! Abas disponíveis:', result.data);
                        
                        this.isConnected = true;
                        this.isInitialized = true;
                        this.lastSync = new Date();
                        this.syncStatus = 'connected';
                        this.useJsonp = false;
                        
                        this.updateUI();
                        return true;
                    }
                }
            } catch (fetchError) {
                console.log('⚠️ Fetch falhou, tentando JSONP...', fetchError.message);
            }
            
            // Fallback para JSONP se fetch falhar (CORS)
            const result = await this.jsonpRequest(`${this.WEB_APP_URL}?action=getStructure`);
            
            if (result.success) {
                console.log('✅ Conectado via JSONP! Abas disponíveis:', result.data);
                
                this.isConnected = true;
                this.isInitialized = true;
                this.lastSync = new Date();
                this.syncStatus = 'connected';
                this.useJsonp = true;
                
                this.updateUI();
                return true;
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('❌ Erro ao conectar:', error);
            this.isConnected = false;
            this.syncStatus = 'error';
            return false;
        }
    }
    
    // Função para fazer requisições JSONP (evita CORS)
    jsonpRequest(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const script = document.createElement('script');
            
            // Timeout de 30 segundos
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP timeout'));
            }, 30000);
            
            const cleanup = () => {
                clearTimeout(timeout);
                delete window[callbackName];
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            };
            
            window[callbackName] = (data) => {
                cleanup();
                resolve(data);
            };
            
            script.onerror = () => {
                cleanup();
                reject(new Error('JSONP script error'));
            };
            
            const separator = url.includes('?') ? '&' : '?';
            script.src = url + separator + 'callback=' + callbackName;
            document.head.appendChild(script);
        });
    }

    disconnect() {
        this.isConnected = false;
        this.syncStatus = 'disconnected';
        this.stopAutoSync();
        this.updateUI();
        console.log('🔌 Desconectado do Web App');
    }

    // ============================================
    // LEITURA DE DADOS
    // ============================================

    async getData(sheetName) {
        try {
            console.log(`📥 Lendo dados da aba: ${sheetName}`);
            
            const url = `${this.WEB_APP_URL}?action=getData&sheet=${encodeURIComponent(sheetName)}`;
            let result;
            
            // Usar JSONP se necessário (definido durante connect)
            if (this.useJsonp) {
                result = await this.jsonpRequest(url);
            } else {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Erro na requisição');
                    }
                    result = await response.json();
                } catch (fetchError) {
                    // Fallback para JSONP
                    console.log('⚠️ Fetch falhou, usando JSONP...');
                    result = await this.jsonpRequest(url);
                    this.useJsonp = true;
                }
            }
            
            if (result.success) {
                console.log(`✅ Dados lidos de ${sheetName}:`, result.data?.length || 0, 'linhas');
                return result.data;
            } else {
                console.error(`❌ Erro ao ler ${sheetName}:`, result.error);
                return null;
            }
        } catch (error) {
            console.error(`❌ Erro ao ler ${sheetName}:`, error);
            return null;
        }
    }

    // ============================================
    // ESCRITA DE DADOS
    // ============================================

    async appendData(sheetName, row) {
        try {
            console.log(`📤 Adicionando linha em: ${sheetName}`);
            
            const response = await fetch(this.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    action: 'appendData',
                    sheet: sheetName,
                    row: row
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Linha adicionada em ${sheetName}`);
                this.lastSync = new Date();
                return true;
            } else {
                console.error(`❌ Erro ao adicionar em ${sheetName}:`, result.error);
                return false;
            }
        } catch (error) {
            console.error(`❌ Erro ao adicionar em ${sheetName}:`, error);
            return false;
        }
    }

    async updateData(sheetName, range, values) {
        try {
            console.log(`📤 Atualizando dados em: ${sheetName}`);
            
            const response = await fetch(this.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    action: 'updateData',
                    sheet: sheetName,
                    range: range,
                    values: values
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Dados atualizados em ${sheetName}`);
                this.lastSync = new Date();
                return true;
            } else {
                console.error(`❌ Erro ao atualizar ${sheetName}:`, result.error);
                return false;
            }
        } catch (error) {
            console.error(`❌ Erro ao atualizar ${sheetName}:`, error);
            return false;
        }
    }

    async clearData(sheetName) {
        try {
            console.log(`🗑️ Limpando dados de: ${sheetName}`);
            
            const response = await fetch(this.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    action: 'clearData',
                    sheet: sheetName
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Dados limpos de ${sheetName}`);
                return true;
            } else {
                console.error(`❌ Erro ao limpar ${sheetName}:`, result.error);
                return false;
            }
        } catch (error) {
            console.error(`❌ Erro ao limpar ${sheetName}:`, error);
            return false;
        }
    }

    // ============================================
    // SINCRONIZAÇÃO COMPLETA
    // ============================================

    async syncAll() {
        try {
            console.log('🔄 Iniciando sincronização completa...');
            
            if (!this.isConnected) {
                await this.connect();
            }

            // Preparar dados para sincronização
            const dataToSync = {};
            
            // Transações
            const transactions = financeManager.getTransactions();
            if (transactions.length > 0) {
                dataToSync[this.SHEETS.TRANSACTIONS] = transactions.map(t => this.transactionToRow(t));
            }
            
            // Contas
            const accounts = financeManager.getAccounts();
            if (accounts.length > 0) {
                dataToSync[this.SHEETS.ACCOUNTS] = accounts.map(a => this.accountToRow(a));
            }
            
            // Categorias
            const categories = financeManager.getCategories();
            if (categories.length > 0) {
                dataToSync[this.SHEETS.CATEGORIES] = categories.map(c => this.categoryToRow(c));
            }
            
            // Vendas
            if (typeof salesManager !== 'undefined') {
                const sales = salesManager.getSales();
                if (sales.length > 0) {
                    dataToSync[this.SHEETS.SALES] = sales.map(s => this.saleToRow(s));
                }
                
                // Clientes
                const clients = salesManager.getClients();
                if (clients.length > 0) {
                    dataToSync[this.SHEETS.CLIENTS] = clients.map(c => this.clientToRow(c));
                }
                
                // Produtos
                const products = salesManager.getProducts();
                if (products.length > 0) {
                    dataToSync[this.SHEETS.PRODUCTS] = products.map(p => this.productToRow(p));
                }
            }
            
            // Devedores
            if (typeof debtorsManager !== 'undefined') {
                const debtors = debtorsManager.getDebtors();
                if (debtors.length > 0) {
                    dataToSync[this.SHEETS.DEBTORS] = debtors.map(d => this.debtorToRow(d));
                }
            }
            
            // Dívidas
            const debts = financeManager.getDebts ? financeManager.getDebts() : [];
            if (debts.length > 0) {
                dataToSync[this.SHEETS.DEBTS] = debts.map(d => this.debtToRow(d));
            }

            // Enviar dados para o Web App
            const response = await fetch(this.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    action: 'syncAll',
                    data: dataToSync
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Sincronização completa realizada!');
                this.lastSync = new Date();
                this.updateUI();
                
                if (typeof Toast !== 'undefined') {
                    Toast.show('Sincronização completa!', 'success');
                }
                
                return true;
            } else {
                throw new Error(result.error || 'Erro na sincronização');
            }
        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            
            if (typeof Toast !== 'undefined') {
                Toast.show('Erro na sincronização: ' + error.message, 'error');
            }
            
            return false;
        }
    }

    // ============================================
    // IMPORTAÇÃO DE DADOS
    // ============================================

// Função importAllData corrigida - substituir no google-sheets.js

    async importAllData() {
        try {
            console.log('📥 Importando todos os dados da planilha...');
            
            if (!this.isConnected) {
                await this.connect();
            }

            // Flag para evitar sincronização durante importação (evita loop)
            this._isImporting = true;
            
            // LIMPAR COMPLETAMENTE O LOCALSTORAGE ANTES DE IMPORTAR
            console.log('🗑️ Limpando localStorage completamente antes da importação...');
            
            // Limpar todas as chaves de dados do localStorage
            const keysToRemove = [
                CONFIG.STORAGE_KEYS.BUSINESSES,
                CONFIG.STORAGE_KEYS.TRANSACTIONS,
                CONFIG.STORAGE_KEYS.ACCOUNTS,
                CONFIG.STORAGE_KEYS.CATEGORIES,
                CONFIG.STORAGE_KEYS.BUDGETS,
                CONFIG.STORAGE_KEYS.INVESTMENTS,
                CONFIG.STORAGE_KEYS.DEBTS,
                CONFIG.STORAGE_KEYS.GOALS,
                CONFIG.STORAGE_KEYS.SALES,
                CONFIG.STORAGE_KEYS.CUSTOMERS,
                CONFIG.STORAGE_KEYS.PRODUCTS,
                CONFIG.STORAGE_KEYS.PRODUCT_CATEGORIES,
                CONFIG.STORAGE_KEYS.DEBTORS,
                CONFIG.STORAGE_KEYS.CURRENT_BUSINESS
            ];
            
            keysToRemove.forEach(key => {
                if (key) {
                    localStorage.removeItem(key);
                    console.log('  - Removido: ' + key);
                }
            });
            
            // Limpar arrays nos managers
            if (typeof financeManager !== 'undefined') {
                financeManager.businesses = [];
                financeManager.transactions = [];
                financeManager.accounts = [];
                financeManager.categories = [];
                financeManager.budgets = [];
                financeManager.investments = [];
                financeManager.debts = [];
                financeManager.goals = [];
                financeManager.currentBusinessId = null;
            }
            if (typeof salesManager !== 'undefined') {
                salesManager.sales = [];
                salesManager.customers = [];
                salesManager.products = [];
            }
            if (typeof debtorsManager !== 'undefined') {
                debtorsManager.debtors = [];
            }
            
            let imported = 0;
            let importedBusinessId = null;

            // Primeiro, coletar todos os dados para descobrir os businessIds
            console.log('📊 Coletando dados de todas as abas...');
            
            const allData = {};
            
            // Coletar dados de todas as abas
            allData.businesses = await this.getData(this.SHEETS.BUSINESSES);
            allData.transactions = await this.getData(this.SHEETS.TRANSACTIONS);
            allData.accounts = await this.getData(this.SHEETS.ACCOUNTS);
            allData.categories = await this.getData(this.SHEETS.CATEGORIES);
            allData.sales = await this.getData(this.SHEETS.SALES);
            allData.clients = await this.getData(this.SHEETS.CLIENTS);
            allData.products = await this.getData(this.SHEETS.PRODUCTS);
            allData.debtors = await this.getData(this.SHEETS.DEBTORS);
            allData.debts = await this.getData(this.SHEETS.DEBTS);
            allData.investments = await this.getData(this.SHEETS.INVESTMENTS);
            allData.goals = await this.getData(this.SHEETS.GOALS);
            allData.budgets = await this.getData(this.SHEETS.BUDGETS);

            console.log('📊 Dados coletados:', {
                businesses: allData.businesses ? allData.businesses.length : 0,
                transactions: allData.transactions ? allData.transactions.length : 0,
                accounts: allData.accounts ? allData.accounts.length : 0,
                categories: allData.categories ? allData.categories.length : 0,
                debtors: allData.debtors ? allData.debtors.length : 0
            });

            // IMPORTANTE: Importar Perfis/Businesses PRIMEIRO
            // Se a aba Perfis estiver vazia, criar perfis baseados nos businessIds encontrados
            if (allData.businesses && allData.businesses.length > 1) {
                importedBusinessId = this.importBusinesses(allData.businesses);
                imported++;
            } else {
                // Criar perfis automaticamente baseados nos businessIds encontrados nos dados
                console.log('⚠️ Aba Perfis vazia - criando perfis automaticamente...');
                importedBusinessId = this.createBusinessesFromData(allData);
                if (importedBusinessId) imported++;
            }

            // Importar Transações
            if (allData.transactions && allData.transactions.length > 1) {
                this.importTransactions(allData.transactions, importedBusinessId);
                imported++;
            }

            // Importar Contas
            if (allData.accounts && allData.accounts.length > 1) {
                this.importAccounts(allData.accounts, importedBusinessId);
                imported++;
            }

            // Importar Categorias
            if (allData.categories && allData.categories.length > 1) {
                this.importCategories(allData.categories, importedBusinessId);
                imported++;
            }

            // Importar Vendas
            if (allData.sales && allData.sales.length > 1 && typeof salesManager !== 'undefined') {
                this.importSales(allData.sales, importedBusinessId);
                imported++;
            }

            // Importar Clientes
            if (allData.clients && allData.clients.length > 1 && typeof salesManager !== 'undefined') {
                this.importClients(allData.clients, importedBusinessId);
                imported++;
            }

            // Importar Produtos
            if (allData.products && allData.products.length > 1 && typeof salesManager !== 'undefined') {
                this.importProducts(allData.products, importedBusinessId);
                imported++;
            }

            // Importar Devedores
            if (allData.debtors && allData.debtors.length > 1 && typeof debtorsManager !== 'undefined') {
                this.importDebtors(allData.debtors, importedBusinessId);
                imported++;
            }

            // Importar Dívidas
            if (allData.debts && allData.debts.length > 1) {
                this.importDebts(allData.debts, importedBusinessId);
                imported++;
            }
            
            // Importar Investimentos
            if (allData.investments && allData.investments.length > 1) {
                this.importInvestments(allData.investments, importedBusinessId);
                imported++;
            }
            
            // Importar Metas
            if (allData.goals && allData.goals.length > 1) {
                this.importGoals(allData.goals, importedBusinessId);
                imported++;
            }
            
            // Importar Orçamentos
            if (allData.budgets && allData.budgets.length > 1) {
                this.importBudgets(allData.budgets, importedBusinessId);
                imported++;
            }

            console.log('✅ Importação concluída! ' + imported + ' tipos de dados importados.');
            this.lastSync = new Date();
            
            // Desabilitar flag de importação ANTES de recarregar dados
            this._isImporting = false;
            
            // DEBUG: Verificar o que foi salvo no localStorage
            console.log('📊 DEBUG - Verificando localStorage após importação:');
            console.log('  - BUSINESSES:', localStorage.getItem(CONFIG.STORAGE_KEYS.BUSINESSES) ? 'OK' : 'VAZIO');
            console.log('  - TRANSACTIONS:', localStorage.getItem(CONFIG.STORAGE_KEYS.TRANSACTIONS) ? 'OK' : 'VAZIO');
            console.log('  - ACCOUNTS:', localStorage.getItem(CONFIG.STORAGE_KEYS.ACCOUNTS) ? 'OK' : 'VAZIO');
            console.log('  - CATEGORIES:', localStorage.getItem(CONFIG.STORAGE_KEYS.CATEGORIES) ? 'OK' : 'VAZIO');
            console.log('  - DEBTORS:', localStorage.getItem(CONFIG.STORAGE_KEYS.DEBTORS) ? 'OK' : 'VAZIO');
            
            // Recarregar dados dos managers para garantir consistência
            console.log('🔄 Recarregando dados nos managers...');
            
            if (typeof financeManager !== 'undefined') {
                financeManager.loadAllData();
                
                // DEBUG: Logar estado após carregamento
                console.log('📊 DEBUG - Estado do financeManager após loadAllData:');
                console.log('  - businesses:', financeManager.businesses.length);
                console.log('  - transactions:', financeManager.transactions.length);
                console.log('  - accounts:', financeManager.accounts.length);
                console.log('  - categories:', financeManager.categories.length);
                console.log('  - currentBusinessId:', financeManager.currentBusinessId);
                
                // Garantir que o currentBusinessId esteja correto
                if (importedBusinessId && financeManager.businesses.some(b => b.id === importedBusinessId)) {
                    financeManager.currentBusinessId = importedBusinessId;
                    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS, JSON.stringify(importedBusinessId));
                    console.log('  - currentBusinessId atualizado para:', importedBusinessId);
                } else if (financeManager.businesses.length > 0 && !financeManager.currentBusinessId) {
                    // Se não tiver currentBusinessId, usar o primeiro business
                    financeManager.currentBusinessId = financeManager.businesses[0].id;
                    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS, JSON.stringify(financeManager.currentBusinessId));
                    console.log('  - currentBusinessId definido para primeiro business:', financeManager.currentBusinessId);
                }
            }
            
            if (typeof salesManager !== 'undefined') {
                salesManager.loadAllData();
                console.log('📊 DEBUG - salesManager após loadAllData:');
                console.log('  - sales:', salesManager.sales ? salesManager.sales.length : 0);
                console.log('  - customers:', salesManager.customers ? salesManager.customers.length : 0);
                console.log('  - products:', salesManager.products ? salesManager.products.length : 0);
            }
            
            if (typeof debtorsManager !== 'undefined') {
                debtorsManager.loadAllData();
                console.log('📊 DEBUG - debtorsManager após loadAllData:');
                console.log('  - debtors:', debtorsManager.debtors ? debtorsManager.debtors.length : 0);
            }
            
            // Disparar evento de dados importados para atualizar UI
            window.dispatchEvent(new CustomEvent('dataImported'));
            
            // Atualizar interface com pequeno delay para garantir que dados foram carregados
            await new Promise(resolve => setTimeout(resolve, 200));
            
            if (typeof uiManager !== 'undefined') {
                console.log('🔄 Atualizando interface...');
                
                // Atualizar seletor de perfil
                if (typeof updateProfileSelector === 'function') {
                    updateProfileSelector();
                }
                
                // Forçar atualização completa da view atual
                if (uiManager.switchView) {
                    uiManager.switchView(uiManager.currentView);
                } else if (uiManager.refreshCurrentView) {
                    uiManager.refreshCurrentView();
                }
            }
            
            if (typeof Toast !== 'undefined') {
                Toast.show('Dados importados com sucesso! (' + imported + ' tipos)', 'success');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erro na importação:', error);
            
            // Garantir que flag seja desabilitada mesmo em caso de erro
            this._isImporting = false;
            
            if (typeof Toast !== 'undefined') {
                Toast.show('Erro na importação: ' + error.message, 'error');
            }
            
            return false;
        }
    }

    // ============================================
    // FUNÇÕES DE IMPORTAÇÃO ESPECÍFICAS
    // ============================================

    /**
     * Importa perfis/businesses da planilha
     * Retorna o ID do primeiro business importado para usar como referência
     */
    importBusinesses(data) {
        if (!data || data.length <= 1) {
            console.log('⚠️ Aba Perfis vazia ou apenas com cabeçalhos');
            return null;
        }
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} perfis...`);
        
        const importedBusinesses = [];
        let firstBusinessId = null;
        
        rows.forEach(row => {
            try {
                const business = this.rowToBusiness(headers, row);
                if (business && business.id) {
                    importedBusinesses.push(business);
                    if (!firstBusinessId) {
                        firstBusinessId = business.id;
                    }
                }
            } catch (e) {
                console.warn('Erro ao importar perfil:', e);
            }
        });
        
        if (importedBusinesses.length > 0) {
            financeManager.businesses = importedBusinesses;
            localStorage.setItem(CONFIG.STORAGE_KEYS.BUSINESSES, JSON.stringify(importedBusinesses));
            
            // Atualizar currentBusinessId para o primeiro business importado
            financeManager.currentBusinessId = firstBusinessId;
            localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS, JSON.stringify(firstBusinessId));
            
            console.log(`✅ ${importedBusinesses.length} perfis importados. Business ID atual: ${firstBusinessId}`);
        }
        
        return firstBusinessId;
    }

    // Função para criar perfis baseados nos businessIds encontrados nos dados
    createBusinessesFromData(allData) {
        const businessIds = new Set();
        
        // Coletar todos os businessIds únicos dos dados
        Object.values(allData).forEach(dataArray => {
            if (Array.isArray(dataArray) && dataArray.length > 1) {
                const headers = dataArray[0];
                const businessIdIdx = headers.indexOf('BusinessID');
                if (businessIdIdx !== -1) {
                    dataArray.slice(1).forEach(row => {
                        if (row[businessIdIdx]) {
                            businessIds.add(row[businessIdIdx]);
                        }
                    });
                }
            }
        });
        
        if (businessIds.size === 0) {
            console.log('⚠️ Nenhum businessId encontrado nos dados');
            return null;
        }
        
        console.log(`📊 Encontrados ${businessIds.size} businessIds únicos:`, Array.from(businessIds));
        
        // Criar perfis para cada businessId encontrado
        const importedBusinesses = [];
        let index = 1;
        
        businessIds.forEach(businessId => {
            const business = {
                id: businessId,
                name: `Perfil ${index}`,
                description: `Perfil importado automaticamente`,
                type: 'personal',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            importedBusinesses.push(business);
            index++;
        });
        
        financeManager.businesses = importedBusinesses;
        localStorage.setItem(CONFIG.STORAGE_KEYS.BUSINESSES, JSON.stringify(importedBusinesses));
        
        const firstBusinessId = importedBusinesses[0].id;
        financeManager.currentBusinessId = firstBusinessId;
        localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_BUSINESS, JSON.stringify(firstBusinessId));
        
        console.log(`✅ ${importedBusinesses.length} perfis criados automaticamente. Business ID atual: ${firstBusinessId}`);
        
        return firstBusinessId;
    }

    importTransactions(data, targetBusinessId = null) {
        if (!data || data.length <= 1) return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} transações...`);
        
        // Substituir dados existentes pelos da planilha
        const importedTransactions = [];
        
        // Usar o businessId alvo ou o atual do financeManager
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const transaction = this.rowToTransaction(headers, row);
                if (transaction && transaction.id) {
                    // Se não tiver businessId ou for diferente, usar o businessId atual
                    if (!transaction.businessId || transaction.businessId === '') {
                        transaction.businessId = businessIdToUse;
                    }
                    importedTransactions.push(transaction);
                }
            } catch (e) {
                console.warn('Erro ao importar transação:', e);
            }
        });
        
        // Substituir array de transações e salvar diretamente no localStorage
        if (importedTransactions.length > 0) {
            financeManager.transactions = importedTransactions;
            // Salvar diretamente no localStorage para evitar trigger de sync
            localStorage.setItem(CONFIG.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(importedTransactions));
            console.log(`✅ ${importedTransactions.length} transações importadas`);
        }
    }

    importAccounts(data, targetBusinessId = null) {
        if (!data || data.length <= 1) return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} contas...`);
        
        const importedAccounts = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const account = this.rowToAccount(headers, row);
                if (account && account.id) {
                    if (!account.businessId || account.businessId === '') {
                        account.businessId = businessIdToUse;
                    }
                    importedAccounts.push(account);
                }
            } catch (e) {
                console.warn('Erro ao importar conta:', e);
            }
        });
        
        if (importedAccounts.length > 0) {
            financeManager.accounts = importedAccounts;
            // Salvar diretamente no localStorage para evitar trigger de sync
            localStorage.setItem(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(importedAccounts));
            console.log(`✅ ${importedAccounts.length} contas importadas`);
        }
    }

    importCategories(data, targetBusinessId = null) {
        if (!data || data.length <= 1) return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} categorias...`);
        
        const importedCategories = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const category = this.rowToCategory(headers, row);
                if (category && category.id) {
                    if (!category.businessId || category.businessId === '') {
                        category.businessId = businessIdToUse;
                    }
                    importedCategories.push(category);
                }
            } catch (e) {
                console.warn('Erro ao importar categoria:', e);
            }
        });
        
        if (importedCategories.length > 0) {
            financeManager.categories = importedCategories;
            // Salvar diretamente no localStorage para evitar trigger de sync
            localStorage.setItem(CONFIG.STORAGE_KEYS.CATEGORIES, JSON.stringify(importedCategories));
            console.log(`✅ ${importedCategories.length} categorias importadas`);
        }
    }

    importSales(data, targetBusinessId = null) {
        if (!data || data.length <= 1 || typeof salesManager === 'undefined') return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} vendas...`);
        
        const importedSales = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const sale = this.rowToSale(headers, row);
                if (sale && sale.id) {
                    if (!sale.businessId || sale.businessId === '') {
                        sale.businessId = businessIdToUse;
                    }
                    importedSales.push(sale);
                }
            } catch (e) {
                console.warn('Erro ao importar venda:', e);
            }
        });
        
        if (importedSales.length > 0) {
            salesManager.sales = importedSales;
            // Salvar diretamente no localStorage para evitar trigger de sync
            localStorage.setItem(CONFIG.STORAGE_KEYS.SALES, JSON.stringify(importedSales));
            console.log(`✅ ${importedSales.length} vendas importadas`);
        }
    }

    importClients(data, targetBusinessId = null) {
        if (!data || data.length <= 1 || typeof salesManager === 'undefined') return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} clientes...`);
        
        const importedClients = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const client = this.rowToClient(headers, row);
                if (client && client.id) {
                    if (!client.businessId || client.businessId === '') {
                        client.businessId = businessIdToUse;
                    }
                    importedClients.push(client);
                }
            } catch (e) {
                console.warn('Erro ao importar cliente:', e);
            }
        });
        
        if (importedClients.length > 0) {
            salesManager.customers = importedClients;
            // Salvar diretamente no localStorage para evitar trigger de sync
            localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOMERS, JSON.stringify(importedClients));
            console.log(`✅ ${importedClients.length} clientes importados`);
        }
    }

    importProducts(data, targetBusinessId = null) {
        if (!data || data.length <= 1 || typeof salesManager === 'undefined') return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} produtos...`);
        
        const importedProducts = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const product = this.rowToProduct(headers, row);
                if (product && product.id) {
                    if (!product.businessId || product.businessId === '') {
                        product.businessId = businessIdToUse;
                    }
                    importedProducts.push(product);
                }
            } catch (e) {
                console.warn('Erro ao importar produto:', e);
            }
        });
        
        if (importedProducts.length > 0) {
            salesManager.products = importedProducts;
            // Salvar diretamente no localStorage para evitar trigger de sync
            localStorage.setItem(CONFIG.STORAGE_KEYS.PRODUCTS, JSON.stringify(importedProducts));
            console.log(`✅ ${importedProducts.length} produtos importados`);
        }
    }

    importDebtors(data, targetBusinessId = null) {
        if (!data || data.length <= 1 || typeof debtorsManager === 'undefined') return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} devedores...`);
        
        const importedDebtors = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const debtor = this.rowToDebtor(headers, row);
                if (debtor && debtor.id) {
                    if (!debtor.businessId || debtor.businessId === '') {
                        debtor.businessId = businessIdToUse;
                    }
                    importedDebtors.push(debtor);
                }
            } catch (e) {
                console.warn('Erro ao importar devedor:', e);
            }
        });
        
        if (importedDebtors.length > 0) {
            debtorsManager.debtors = importedDebtors;
            // Salvar diretamente no localStorage para evitar trigger de sync
            localStorage.setItem(CONFIG.STORAGE_KEYS.DEBTORS, JSON.stringify(importedDebtors));
            console.log(`✅ ${importedDebtors.length} devedores importados`);
        }
    }

    importDebts(data, targetBusinessId = null) {
        if (!data || data.length <= 1) return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]); // Filtrar linhas vazias
        
        console.log(`📥 Importando ${rows.length} dívidas...`);
        
        const importedDebts = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const debt = this.rowToDebt(headers, row);
                if (debt && debt.id) {
                    if (!debt.businessId || debt.businessId === '') {
                        debt.businessId = businessIdToUse;
                    }
                    importedDebts.push(debt);
                }
            } catch (e) {
                console.warn('Erro ao importar dívida:', e);
            }
        });
        
        if (importedDebts.length > 0) {
            financeManager.debts = importedDebts;
            // Salvar diretamente no localStorage para evitar trigger de sync
            localStorage.setItem(CONFIG.STORAGE_KEYS.DEBTS, JSON.stringify(importedDebts));
            console.log(`✅ ${importedDebts.length} dívidas importadas`);
        }
    }

    importInvestments(data, targetBusinessId = null) {
        if (!data || data.length <= 1) return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]);
        
        console.log(`📥 Importando ${rows.length} investimentos...`);
        
        const importedInvestments = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const investment = this.rowToInvestment(headers, row);
                if (investment && investment.id) {
                    if (!investment.businessId || investment.businessId === '') {
                        investment.businessId = businessIdToUse;
                    }
                    importedInvestments.push(investment);
                }
            } catch (e) {
                console.warn('Erro ao importar investimento:', e);
            }
        });
        
        if (importedInvestments.length > 0) {
            financeManager.investments = importedInvestments;
            localStorage.setItem(CONFIG.STORAGE_KEYS.INVESTMENTS, JSON.stringify(importedInvestments));
            console.log(`✅ ${importedInvestments.length} investimentos importados`);
        }
    }

    importGoals(data, targetBusinessId = null) {
        if (!data || data.length <= 1) return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]);
        
        console.log(`📥 Importando ${rows.length} metas...`);
        
        const importedGoals = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const goal = this.rowToGoal(headers, row);
                if (goal && goal.id) {
                    if (!goal.businessId || goal.businessId === '') {
                        goal.businessId = businessIdToUse;
                    }
                    importedGoals.push(goal);
                }
            } catch (e) {
                console.warn('Erro ao importar meta:', e);
            }
        });
        
        if (importedGoals.length > 0) {
            financeManager.goals = importedGoals;
            localStorage.setItem(CONFIG.STORAGE_KEYS.GOALS, JSON.stringify(importedGoals));
            console.log(`✅ ${importedGoals.length} metas importadas`);
        }
    }

    importBudgets(data, targetBusinessId = null) {
        if (!data || data.length <= 1) return;
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row[0]);
        
        console.log(`📥 Importando ${rows.length} orçamentos...`);
        
        const importedBudgets = [];
        const businessIdToUse = targetBusinessId || financeManager.currentBusinessId;
        
        rows.forEach(row => {
            try {
                const budget = this.rowToBudget(headers, row);
                if (budget && budget.id) {
                    if (!budget.businessId || budget.businessId === '') {
                        budget.businessId = businessIdToUse;
                    }
                    importedBudgets.push(budget);
                }
            } catch (e) {
                console.warn('Erro ao importar orçamento:', e);
            }
        });
        
        if (importedBudgets.length > 0) {
            financeManager.budgets = importedBudgets;
            localStorage.setItem(CONFIG.STORAGE_KEYS.BUDGETS, JSON.stringify(importedBudgets));
            console.log(`✅ ${importedBudgets.length} orçamentos importados`);
        }
    }

    // ============================================
    // CONVERSÕES: OBJETO -> LINHA
    // ============================================

    transactionToRow(t) {
        return [
            t.id,
            t.businessId || financeManager.currentBusinessId,
            t.type,
            t.amount / 100, // Converter centavos para reais
            t.description,
            t.date,
            t.categoryId,
            t.accountId,
            t.status || 'pago',
            t.recurring || false,
            t.tags?.join(',') || '',
            t.createdAt,
            t.updatedAt
        ];
    }

    accountToRow(a) {
        return [
            a.id,
            a.businessId || financeManager.currentBusinessId,
            a.name,
            a.type,
            a.color,
            a.icon,
            a.balance / 100,
            a.initialBalance / 100,
            a.active !== false,
            a.createdAt,
            a.updatedAt
        ];
    }

    categoryToRow(c) {
        return [
            c.id,
            c.businessId || financeManager.currentBusinessId,
            c.name,
            c.icon,
            c.color,
            c.type,
            c.createdAt,
            c.updatedAt
        ];
    }

    saleToRow(s) {
        return [
            s.id,
            s.businessId || financeManager.currentBusinessId,
            s.clientId,
            JSON.stringify(s.items || []),
            s.total / 100,
            s.paid / 100,
            s.status,
            s.date,
            s.dueDate,
            JSON.stringify(s.payments || []),
            s.notes,
            s.createdAt,
            s.updatedAt
        ];
    }

    clientToRow(c) {
        return [
            c.id,
            c.businessId || financeManager.currentBusinessId,
            c.name,
            c.email,
            c.phone,
            c.address,
            c.totalPurchases || 0,
            (c.totalSpent || 0) / 100,
            c.createdAt,
            c.updatedAt
        ];
    }

    productToRow(p) {
        return [
            p.id,
            p.businessId || financeManager.currentBusinessId,
            p.name,
            p.description,
            p.price / 100,
            (p.cost || 0) / 100,
            p.stock || 0,
            p.category,
            p.active !== false,
            p.createdAt,
            p.updatedAt
        ];
    }

    debtorToRow(d) {
        // Usar totalAmount/paidAmount (estrutura do DebtorsManager) ou totalValue/paidValue (estrutura antiga)
        const totalAmount = d.totalAmount !== undefined ? d.totalAmount : (d.totalValue || 0);
        const paidAmount = d.paidAmount !== undefined ? d.paidAmount : (d.paidValue || 0);
        const remainingAmount = d.remainingAmount !== undefined ? d.remainingAmount : (d.remainingValue || (totalAmount - paidAmount));
        const dueDate = d.originalDueDate || d.dueDate || '';
        
        return [
            d.id,
            d.businessId || financeManager.currentBusinessId,
            d.name,
            d.phone || '',
            d.email || '',
            totalAmount / 100,
            paidAmount / 100,
            remainingAmount / 100,
            d.status || CONFIG.DEBTOR_STATUS.ACTIVE,
            dueDate,
            d.installmentsCount || (d.installments ? d.installments.length : 1),
            JSON.stringify(d.payments || []),
            d.notes || '',
            d.createdAt || new Date().toISOString(),
            d.updatedAt || new Date().toISOString()
        ];
    }

    debtToRow(d) {
        return [
            d.id,
            d.businessId || financeManager.currentBusinessId,
            d.name,
            d.type,
            d.totalValue / 100,
            d.paidValue / 100,
            d.interestRate || 0,
            d.installments || 1,
            d.paidInstallments || 0,
            d.startDate,
            d.createdAt,
            d.updatedAt
        ];
    }

    // ============================================
    // CONVERSÕES: LINHA -> OBJETO
    // ============================================

    getColumnIndex(headers, name) {
        const variations = {
            'ID': ['ID', 'Id', 'id'],
            'BusinessID': ['BusinessID', 'businessId', 'Businessid'],
            'Tipo': ['Tipo', 'tipo', 'Type'],
            'Valor': ['Valor', 'valor', 'Value', 'Amount'],
            'Descrição': ['Descrição', 'Descricao', 'descricao', 'Description'],
            'Data': ['Data', 'data', 'Date'],
            'CategoriaID': ['CategoriaID', 'categoriaId', 'Categoria'],
            'ContaID': ['ContaID', 'contaId', 'Conta'],
            'Status': ['Status', 'status'],
            'Nome': ['Nome', 'nome', 'Name'],
            'Email': ['Email', 'email'],
            'Telefone': ['Telefone', 'telefone', 'Phone'],
            'Total': ['Total', 'total'],
            'Pago': ['Pago', 'pago', 'Paid'],
            'Vencimento': ['Vencimento', 'vencimento', 'DueDate'],
            'Notas': ['Notas', 'notas', 'Notes'],
            'CriadoEm': ['CriadoEm', 'criadoEm', 'CreatedAt'],
            'AtualizadoEm': ['AtualizadoEm', 'atualizadoEm', 'UpdatedAt'],
            'Ativo': ['Ativo', 'ativo', 'Active', 'isActive']
        };
        
        const possibleNames = variations[name] || [name];
        for (const n of possibleNames) {
            const idx = headers.indexOf(n);
            if (idx !== -1) return idx;
        }
        return -1;
    }

    getValue(headers, row, name, defaultValue = '') {
        const idx = this.getColumnIndex(headers, name);
        return idx !== -1 && row[idx] !== undefined ? row[idx] : defaultValue;
    }

    rowToBusiness(headers, row) {
        const isActive = this.getValue(headers, row, 'Ativo', 'TRUE');
        return {
            id: this.getValue(headers, row, 'ID'),
            name: this.getValue(headers, row, 'Nome'),
            description: this.getValue(headers, row, 'Descrição'),
            type: this.getValue(headers, row, 'Tipo', 'personal'),
            isActive: isActive === true || isActive === 'TRUE' || isActive === 'true',
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToTransaction(headers, row) {
        const amount = parseFloat(this.getValue(headers, row, 'Valor', 0));
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            type: this.getValue(headers, row, 'Tipo'),
            amount: Math.round(amount * 100),
            description: this.getValue(headers, row, 'Descrição'),
            date: this.getValue(headers, row, 'Data'),
            categoryId: this.getValue(headers, row, 'CategoriaID'),
            accountId: this.getValue(headers, row, 'ContaID'),
            status: this.getValue(headers, row, 'Status', 'pago'),
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToAccount(headers, row) {
        const balance = parseFloat(this.getValue(headers, row, 'Saldo', 0));
        const initialBalance = parseFloat(this.getValue(headers, row, 'SaldoInicial', 0));
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            name: this.getValue(headers, row, 'Nome'),
            type: this.getValue(headers, row, 'Tipo'),
            color: this.getValue(headers, row, 'Cor'),
            icon: this.getValue(headers, row, 'Ícone'),
            balance: Math.round(balance * 100),
            initialBalance: Math.round(initialBalance * 100),
            active: this.getValue(headers, row, 'Ativo') !== 'FALSE',
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToCategory(headers, row) {
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            name: this.getValue(headers, row, 'Nome'),
            icon: this.getValue(headers, row, 'Ícone'),
            color: this.getValue(headers, row, 'Cor'),
            type: this.getValue(headers, row, 'Tipo'),
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToSale(headers, row) {
        const total = parseFloat(this.getValue(headers, row, 'Total', 0));
        const paid = parseFloat(this.getValue(headers, row, 'Pago', 0));
        let items = [];
        let payments = [];
        
        try {
            const itemsStr = this.getValue(headers, row, 'Produtos', '[]');
            items = typeof itemsStr === 'string' ? JSON.parse(itemsStr) : itemsStr;
        } catch (e) {}
        
        try {
            const paymentsStr = this.getValue(headers, row, 'Pagamentos', '[]');
            payments = typeof paymentsStr === 'string' ? JSON.parse(paymentsStr) : paymentsStr;
        } catch (e) {}
        
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            clientId: this.getValue(headers, row, 'ClienteID'),
            items: items,
            total: Math.round(total * 100),
            paid: Math.round(paid * 100),
            status: this.getValue(headers, row, 'Status'),
            date: this.getValue(headers, row, 'Data'),
            dueDate: this.getValue(headers, row, 'Vencimento'),
            payments: payments,
            notes: this.getValue(headers, row, 'Notas'),
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToClient(headers, row) {
        const totalSpent = parseFloat(this.getValue(headers, row, 'TotalGasto', 0));
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            name: this.getValue(headers, row, 'Nome'),
            email: this.getValue(headers, row, 'Email'),
            phone: this.getValue(headers, row, 'Telefone'),
            address: this.getValue(headers, row, 'Endereço'),
            totalPurchases: parseInt(this.getValue(headers, row, 'TotalCompras', 0)),
            totalSpent: Math.round(totalSpent * 100),
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToProduct(headers, row) {
        const price = parseFloat(this.getValue(headers, row, 'Preço', 0));
        const cost = parseFloat(this.getValue(headers, row, 'Custo', 0));
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            name: this.getValue(headers, row, 'Nome'),
            description: this.getValue(headers, row, 'Descrição'),
            price: Math.round(price * 100),
            cost: Math.round(cost * 100),
            stock: parseInt(this.getValue(headers, row, 'Estoque', 0)),
            category: this.getValue(headers, row, 'Categoria'),
            active: this.getValue(headers, row, 'Ativo') !== 'FALSE',
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

// Função rowToDebtor corrigida
rowToDebtor(headers, row) {
    // Função auxiliar para parsear datas de forma segura
    const safeParseDate = (dateStr) => {
        if (!dateStr || dateStr === '' || dateStr === 'undefined' || dateStr === 'null') {
            return new Date().toISOString();
        }
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return new Date().toISOString();
            }
            return date.toISOString();
        } catch (e) {
            return new Date().toISOString();
        }
    };
    
    const total = parseFloat(this.getValue(headers, row, 'Total', 0)) || 0;
    const paid = parseFloat(this.getValue(headers, row, 'Pago', 0)) || 0;
    const totalCents = Math.round(total * 100);
    const paidCents = Math.round(paid * 100);
    let payments = [];
    let installments = [];
    
    try {
        const paymentsStr = this.getValue(headers, row, 'Pagamentos', '[]');
        if (paymentsStr && typeof paymentsStr === 'string' && paymentsStr.startsWith('[')) {
            payments = JSON.parse(paymentsStr);
        } else if (Array.isArray(paymentsStr)) {
            payments = paymentsStr;
        }
        if (!Array.isArray(payments)) payments = [];
    } catch (e) {
        payments = [];
    }
    
    // Tentar parsear parcelas se existirem
    try {
        const installmentsStr = this.getValue(headers, row, 'Parcelas', '[]');
        if (installmentsStr && installmentsStr !== '') {
            // Se for um número, criar parcelas baseadas nele
            const numInstallments = parseInt(installmentsStr);
            if (!isNaN(numInstallments) && numInstallments > 0) {
                const dueDate = this.getValue(headers, row, 'Vencimento');
                const installmentValue = Math.ceil(totalCents / numInstallments);
                const startDate = safeParseDate(dueDate);
                const startDateObj = new Date(startDate);
                
                for (let i = 0; i < numInstallments; i++) {
                    const installmentDate = new Date(startDateObj);
                    installmentDate.setMonth(installmentDate.getMonth() + i);
                    
                    // Calcular quanto foi pago nesta parcela
                    let installmentPaid = 0;
                    if (paidCents > 0) {
                        const paidSoFar = i * installmentValue;
                        if (paidCents >= paidSoFar + installmentValue) {
                            installmentPaid = installmentValue;
                        } else if (paidCents > paidSoFar) {
                            installmentPaid = paidCents - paidSoFar;
                        }
                    }
                    
                    installments.push({
                        id: `inst_${Date.now()}_${i}`,
                        number: i + 1,
                        amount: installmentValue,
                        dueDate: installmentDate.toISOString(),
                        paidAmount: installmentPaid,
                        paidDate: installmentPaid >= installmentValue ? new Date().toISOString() : null,
                        status: installmentPaid >= installmentValue ? 'pago' : (installmentPaid > 0 ? 'parcial' : 'pendente')
                    });
                }
                
                // Ajustar última parcela para valor exato
                if (installments.length > 0) {
                    const totalInstallments = installments.reduce((sum, inst) => sum + inst.amount, 0);
                    const diff = totalCents - totalInstallments;
                    installments[installments.length - 1].amount += diff;
                }
            } else if (typeof installmentsStr === 'string' && installmentsStr.startsWith('[')) {
                // Tentar parsear como JSON
                const parsed = JSON.parse(installmentsStr);
                if (Array.isArray(parsed)) {
                    installments = parsed;
                }
            }
        }
    } catch (e) {
        // Se falhar, criar uma única parcela
        console.warn('Erro ao parsear parcelas:', e);
    }
    
    // Se não tiver parcelas, criar uma única parcela com o valor total
    if (installments.length === 0) {
        const dueDate = this.getValue(headers, row, 'Vencimento');
        const safeDueDate = safeParseDate(dueDate);
        installments = [{
            id: `inst_${Date.now()}_0`,
            number: 1,
            amount: totalCents,
            dueDate: safeDueDate,
            paidAmount: paidCents,
            paidDate: paidCents >= totalCents ? new Date().toISOString() : null,
            status: paidCents >= totalCents ? 'pago' : (paidCents > 0 ? 'parcial' : 'pendente')
        }];
    }
    
    const dueDate = this.getValue(headers, row, 'Vencimento');
    const statusValue = this.getValue(headers, row, 'Status');
    // Verificar se o status é válido, senão usar 'ativo'
    const validStatuses = ['ativo', 'pago', 'atrasado', 'negociando', 'cancelado'];
    const status = validStatuses.includes(statusValue) ? statusValue : CONFIG.DEBTOR_STATUS.ACTIVE;
    
    const createdAt = this.getValue(headers, row, 'CriadoEm');
    const updatedAt = this.getValue(headers, row, 'AtualizadoEm');
    
    return {
        id: this.getValue(headers, row, 'ID'),
        businessId: this.getValue(headers, row, 'BusinessID'),
        name: this.getValue(headers, row, 'Nome'),
        phone: this.getValue(headers, row, 'Telefone'),
        email: this.getValue(headers, row, 'Email'),
        document: '',
        address: '',
        totalAmount: totalCents,
        paidAmount: paidCents,
        remainingAmount: Math.max(0, totalCents - paidCents),
        interestRate: 0,
        originalDueDate: safeParseDate(dueDate),
        installments: installments,
        installmentsCount: installments.length,
        installmentsPaid: installments.filter(i => i.status === 'pago').length,
        description: '',
        notes: this.getValue(headers, row, 'Notas') || '',
        status: status,
        payments: payments,
        createdAt: safeParseDate(createdAt),
        updatedAt: safeParseDate(updatedAt)
    };
}


    rowToDebt(headers, row) {
        const totalValue = parseFloat(this.getValue(headers, row, 'ValorTotal', 0));
        const paidValue = parseFloat(this.getValue(headers, row, 'ValorPago', 0));
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            name: this.getValue(headers, row, 'Nome'),
            type: this.getValue(headers, row, 'Tipo'),
            totalValue: Math.round(totalValue * 100),
            paidValue: Math.round(paidValue * 100),
            remainingValue: Math.round((totalValue - paidValue) * 100),
            interestRate: parseFloat(this.getValue(headers, row, 'Juros', 0)),
            installments: parseInt(this.getValue(headers, row, 'Parcelas', 1)),
            paidInstallments: parseInt(this.getValue(headers, row, 'ParcelasPagas', 0)),
            startDate: this.getValue(headers, row, 'DataInicio'),
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToInvestment(headers, row) {
        const valorInicial = parseFloat(this.getValue(headers, row, 'ValorInicial', 0));
        const valorAtual = parseFloat(this.getValue(headers, row, 'ValorAtual', 0));
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            name: this.getValue(headers, row, 'Nome'),
            type: this.getValue(headers, row, 'Tipo'),
            initialValue: Math.round(valorInicial * 100),
            currentValue: Math.round(valorAtual * 100),
            startDate: this.getValue(headers, row, 'DataInicio'),
            accountId: this.getValue(headers, row, 'ContaID'),
            notes: this.getValue(headers, row, 'Notas'),
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToGoal(headers, row) {
        const valorMeta = parseFloat(this.getValue(headers, row, 'ValorMeta', 0));
        const valorAtual = parseFloat(this.getValue(headers, row, 'ValorAtual', 0));
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            name: this.getValue(headers, row, 'Nome'),
            targetValue: Math.round(valorMeta * 100),
            currentValue: Math.round(valorAtual * 100),
            deadline: this.getValue(headers, row, 'Prazo'),
            category: this.getValue(headers, row, 'Categoria'),
            notes: this.getValue(headers, row, 'Notas'),
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    rowToBudget(headers, row) {
        const valor = parseFloat(this.getValue(headers, row, 'Valor', 0));
        return {
            id: this.getValue(headers, row, 'ID'),
            businessId: this.getValue(headers, row, 'BusinessID'),
            categoryId: this.getValue(headers, row, 'CategoriaID'),
            amount: Math.round(valor * 100),
            month: this.getValue(headers, row, 'Mes'),
            year: this.getValue(headers, row, 'Ano'),
            createdAt: this.getValue(headers, row, 'CriadoEm'),
            updatedAt: this.getValue(headers, row, 'AtualizadoEm')
        };
    }

    // ============================================
    // AUTO-SYNC
    // ============================================

    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        if (this.autoSyncEnabled && this.isConnected) {
            console.log('⏰ Auto-sync iniciado (60 segundos)');
            this.syncInterval = setInterval(() => {
                this.syncAll();
            }, 60000); // 60 segundos
        }
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏰ Auto-sync parado');
        }
    }

    // ============================================
    // EXPORTAÇÃO
    // ============================================

    async exportAllData() {
        return this.syncAll();
    }

    // ============================================
    // UI
    // ============================================

    updateUI() {
        // Atualizar indicador de sync no header
        const syncIcon = document.getElementById('syncIcon');
        const syncText = document.getElementById('syncText');
        const syncIndicator = document.getElementById('syncIndicator');
        
        if (syncIcon) {
            syncIcon.textContent = this.isConnected ? '✅' : '☁️';
        }
        
        if (syncText) {
            syncText.textContent = this.isConnected ? 'Conectado' : 'Offline';
        }
        
        if (syncIndicator) {
            syncIndicator.className = 'sync-indicator ' + (this.isConnected ? 'connected' : 'disconnected');
        }
        
        // Atualizar view do Google Sheets se estiver visível
        if (typeof googleSheetsView !== 'undefined' && document.getElementById('googleSheetsView')?.classList.contains('active')) {
            googleSheetsView.render();
        }
    }

    getSyncStatus() {
        return {
            isConnected: this.isConnected,
            lastSync: this.lastSync,
            autoSyncEnabled: this.autoSyncEnabled
        };
    }

    checkAuth() {
        return this.isConnected;
    }
}

// Instância global
const googleSheetsManager = new GoogleSheetsManager();

// Inicialização automática ao carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que outros managers foram carregados
    setTimeout(async () => {
        console.log('🚀 Iniciando conexão automática com Google Sheets...');
        
        try {
            const connected = await googleSheetsManager.connect();
            
            if (connected) {
                // Importar dados automaticamente
                const imported = await googleSheetsManager.importAllData();
                
                if (imported) {
                    // Forçar atualização da interface após importação bem-sucedida
                    console.log('🔄 Forçando atualização da interface...');
                    
                    // Aguardar um pouco para garantir que os dados foram carregados
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Atualizar interface
                    if (typeof uiManager !== 'undefined' && uiManager.refreshCurrentView) {
                        uiManager.refreshCurrentView();
                    }
                }
                
                // Iniciar auto-sync
                googleSheetsManager.startAutoSync();
            }
        } catch (error) {
            console.error('Erro na inicialização automática:', error);
        }
    }, 2000);
});
