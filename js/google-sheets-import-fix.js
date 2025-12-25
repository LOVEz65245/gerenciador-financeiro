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
