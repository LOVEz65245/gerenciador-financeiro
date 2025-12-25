// ============================================
// VIEW DE CONFIGURAÇÃO DO GOOGLE SHEETS
// Gerenciador Financeiro Pro v5.0
// Sistema via Web App - Sem necessidade de login
// ============================================

class GoogleSheetsView {
  constructor() {
    this.viewId = 'googleSheetsView';
  }

  /**
   * Renderiza a view de configuração do Google Sheets
   */
  render() {
    const container = document.getElementById(this.viewId);
    if (!container) {
      console.error('Container googleSheetsView não encontrado');
      return;
    }

    try {
      const isConnected = googleSheetsManager.isConnected;
      const lastSync = googleSheetsManager.lastSync;
      const credentials = googleSheetsManager.getCredentials();

      container.innerHTML = `
        <div class="view-header">
          <h2>📊 Integração Google Sheets</h2>
          <p class="view-description">Sincronização automática via Web App (sem necessidade de login no Google)</p>
        </div>

        <div class="google-sheets-content">
          <!-- Status Card -->
          <div class="gs-card gs-status-card ${isConnected ? 'connected' : 'disconnected'}">
            <div class="gs-status-icon">
              ${isConnected ? '✅' : '☁️'}
            </div>
            <div class="gs-status-info">
              <h3>${isConnected ? 'Conectado ao Google Sheets' : 'Não Conectado'}</h3>
              <p>${lastSync ? 'Última sincronização: ' + this.formatDateTime(lastSync) : 'Nenhuma sincronização realizada'}</p>
              ${isConnected ? `
                <p class="gs-status-detail">
                  <span class="gs-badge gs-badge-success">Sincronização Ativa</span>
                  <span class="gs-badge gs-badge-info">Modo Web App</span>
                </p>
              ` : ''}
            </div>
            ${isConnected ? `
              <button class="btn btn-secondary" onclick="googleSheetsView.disconnect()">
                🔌 Desconectar
              </button>
            ` : `
              <button class="btn btn-primary btn-lg" onclick="googleSheetsView.connect()">
                🔗 Conectar
              </button>
            `}
          </div>

          <!-- Credenciais Configuradas -->
          <div class="gs-card">
            <h3>🔑 Configuração do Web App</h3>
            <p class="gs-card-description">
              A sincronização usa um Google Apps Script como backend. <strong>Não é necessário fazer login no Google!</strong>
            </p>
            
            <div class="gs-credentials-display">
              <div class="gs-credential-item">
                <span class="gs-credential-label">Web App URL:</span>
                <span class="gs-credential-value gs-url-value">${credentials.webAppUrl ? credentials.webAppUrl.substring(0, 60) + '...' : 'Não configurado'}</span>
              </div>
            </div>
            
            <div class="gs-info-box gs-info-success">
              <p>✅ <strong>Vantagens do modo Web App:</strong></p>
              <ul>
                <li>Não precisa de login no Google</li>
                <li>Funciona em qualquer domínio</li>
                <li>Sincronização automática em tempo real</li>
                <li>Criação automática de estrutura na planilha</li>
              </ul>
            </div>
          </div>

          <!-- Actions Card -->
          <div class="gs-card">
            <h3>🔄 Ações de Sincronização</h3>
            
            <div class="gs-actions-grid">
              <div class="gs-action-item">
                <div class="gs-action-icon">📤</div>
                <div class="gs-action-info">
                  <h4>Exportar para Google Sheets</h4>
                  <p>Envia todos os dados locais para a planilha</p>
                </div>
                <button class="btn btn-primary" onclick="googleSheetsView.exportToSheets()" ${!isConnected ? 'disabled' : ''}>
                  Exportar
                </button>
              </div>

              <div class="gs-action-item">
                <div class="gs-action-icon">📥</div>
                <div class="gs-action-info">
                  <h4>Importar do Google Sheets</h4>
                  <p>Baixa os dados da planilha para o app</p>
                </div>
                <button class="btn btn-secondary" onclick="googleSheetsView.importFromSheets()" ${!isConnected ? 'disabled' : ''}>
                  Importar
                </button>
              </div>

              <div class="gs-action-item">
                <div class="gs-action-icon">🔄</div>
                <div class="gs-action-info">
                  <h4>Sincronização Completa</h4>
                  <p>Exporta todos os dados para a planilha</p>
                </div>
                <button class="btn btn-success" onclick="googleSheetsView.fullSync()" ${!isConnected ? 'disabled' : ''}>
                  Sincronizar
                </button>
              </div>
            </div>

            ${!isConnected ? `
              <div class="gs-connect-prompt">
                <p>⚠️ Clique em "Conectar" para iniciar a sincronização com o Google Sheets.</p>
                <button class="btn btn-primary btn-lg" onclick="googleSheetsView.connect()">
                  🔗 Conectar
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Configurações -->
          <div class="gs-card">
            <h3>⚡ Configurações de Sincronização</h3>
            <p class="gs-card-description">
              Configure como a sincronização deve funcionar.
            </p>
            
            <div class="form-group">
              <label class="form-switch">
                <input 
                  type="checkbox" 
                  id="gsAutoSync" 
                  ${googleSheetsManager.autoSyncEnabled ? 'checked' : ''}
                  onchange="googleSheetsView.toggleAutoSync(this.checked)"
                >
                <span class="switch-slider"></span>
                <span class="switch-label">Sincronização automática (a cada 60 segundos)</span>
              </label>
            </div>
            
            <div class="gs-realtime-info">
              <p><strong>Como funciona:</strong></p>
              <ul>
                <li>✅ Ao conectar, os dados são carregados automaticamente da planilha</li>
                <li>✅ Sincronização automática a cada 60 segundos (quando ativada)</li>
                <li>✅ Não é necessário fazer login no Google</li>
                <li>✅ Funciona em qualquer domínio ou servidor</li>
              </ul>
            </div>
          </div>

          <!-- Status da Conexão -->
          <div class="gs-card">
            <h3>📋 Status da Conexão</h3>
            <div class="gs-status-details">
              <div class="gs-status-row">
                <span class="gs-status-label">Conectado:</span>
                <span class="gs-status-value ${isConnected ? 'gs-status-ok' : 'gs-status-error'}">
                  ${isConnected ? '✅ Sim' : '❌ Não'}
                </span>
              </div>
              <div class="gs-status-row">
                <span class="gs-status-label">Auto-Sync:</span>
                <span class="gs-status-value ${googleSheetsManager.autoSyncEnabled ? 'gs-status-ok' : 'gs-status-error'}">
                  ${googleSheetsManager.autoSyncEnabled ? '✅ Ativo' : '❌ Desativado'}
                </span>
              </div>
              <div class="gs-status-row">
                <span class="gs-status-label">Última Sincronização:</span>
                <span class="gs-status-value">
                  ${lastSync ? this.formatDateTime(lastSync) : 'Nunca'}
                </span>
              </div>
            </div>
          </div>

          <!-- Abas Sincronizadas -->
          <div class="gs-card">
            <h3>📑 Abas Sincronizadas</h3>
            <p class="gs-card-description">
              As seguintes abas são sincronizadas automaticamente com a planilha:
            </p>
            <div class="gs-sheets-list">
              <span class="gs-sheet-tag">Transações</span>
              <span class="gs-sheet-tag">Contas</span>
              <span class="gs-sheet-tag">Categorias</span>
              <span class="gs-sheet-tag">Vendas</span>
              <span class="gs-sheet-tag">Clientes</span>
              <span class="gs-sheet-tag">Produtos</span>
              <span class="gs-sheet-tag">Devedores</span>
              <span class="gs-sheet-tag">Dívidas</span>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Erro ao renderizar GoogleSheetsView:', error);
      container.innerHTML = `
        <div class="view-header">
          <h2>📊 Integração Google Sheets</h2>
        </div>
        <div class="gs-card">
          <h3>❌ Erro ao carregar</h3>
          <p>Ocorreu um erro ao carregar a view do Google Sheets: ${error.message}</p>
          <button class="btn btn-primary" onclick="googleSheetsView.render()">
            🔄 Tentar novamente
          </button>
        </div>
      `;
    }
  }

  formatDateTime(date) {
    if (!date) return 'Nunca';
    try {
      const d = new Date(date);
      return d.toLocaleString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }

  async connect() {
    try {
      if (typeof Toast !== 'undefined') {
        Toast.show('Conectando ao Google Sheets...', 'info');
      }
      
      const connected = await googleSheetsManager.connect();
      
      if (connected) {
        // Importar dados
        await googleSheetsManager.importAllData();
        
        // Iniciar auto-sync
        googleSheetsManager.startAutoSync();
        
        // Atualizar interface
        googleSheetsManager.updateUI();
        
        if (typeof Toast !== 'undefined') {
          Toast.show('Conectado ao Google Sheets!', 'success');
        }
      } else {
        if (typeof Toast !== 'undefined') {
          Toast.show('Erro ao conectar ao Google Sheets', 'error');
        }
      }
      
      this.render();
    } catch (error) {
      console.error('Erro ao conectar:', error);
      if (typeof Toast !== 'undefined') {
        Toast.show('Erro ao conectar: ' + error.message, 'error');
      }
    }
  }

  disconnect() {
    googleSheetsManager.disconnect();
    if (typeof Toast !== 'undefined') {
      Toast.show('Desconectado do Google Sheets', 'info');
    }
    this.render();
  }

  async exportToSheets() {
    try {
      if (typeof Toast !== 'undefined') {
        Toast.show('Exportando dados...', 'info');
      }
      
      await googleSheetsManager.exportAllData();
      
      if (typeof Toast !== 'undefined') {
        Toast.show('Dados exportados com sucesso!', 'success');
      }
      
      this.render();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      if (typeof Toast !== 'undefined') {
        Toast.show('Erro ao exportar: ' + error.message, 'error');
      }
    }
  }

  async importFromSheets() {
    try {
      if (typeof Toast !== 'undefined') {
        Toast.show('Importando dados...', 'info');
      }
      
      await googleSheetsManager.importAllData();
      
      // Atualizar interface
      if (typeof uiManager !== 'undefined' && uiManager.refreshCurrentView) {
        uiManager.refreshCurrentView();
      }
      
      if (typeof Toast !== 'undefined') {
        Toast.show('Dados importados com sucesso!', 'success');
      }
      
      this.render();
    } catch (error) {
      console.error('Erro ao importar:', error);
      if (typeof Toast !== 'undefined') {
        Toast.show('Erro ao importar: ' + error.message, 'error');
      }
    }
  }

  async fullSync() {
    try {
      if (typeof Toast !== 'undefined') {
        Toast.show('Sincronizando...', 'info');
      }
      
      await googleSheetsManager.syncAll();
      
      if (typeof Toast !== 'undefined') {
        Toast.show('Sincronização completa!', 'success');
      }
      
      this.render();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      if (typeof Toast !== 'undefined') {
        Toast.show('Erro na sincronização: ' + error.message, 'error');
      }
    }
  }

  toggleAutoSync(enabled) {
    googleSheetsManager.autoSyncEnabled = enabled;
    
    if (enabled && googleSheetsManager.isConnected) {
      googleSheetsManager.startAutoSync();
      if (typeof Toast !== 'undefined') {
        Toast.show('Auto-sync ativado', 'success');
      }
    } else {
      googleSheetsManager.stopAutoSync();
      if (typeof Toast !== 'undefined') {
        Toast.show('Auto-sync desativado', 'info');
      }
    }
  }
}

// Instância global
const googleSheetsView = new GoogleSheetsView();
