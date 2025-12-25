// ============================================
// VISUALIZAÇÃO DE LOGS DE ATIVIDADES
// ============================================

class LogsView {
  constructor() {
    this.filters = {
      user: 'all',
      action: 'all',
      dateStart: null,
      dateEnd: null,
      search: ''
    };
    this.currentPage = 1;
    this.itemsPerPage = 20;
  }

  /**
   * Renderiza a view de logs
   */
  render() {
    const stats = authManager.getLogStats();
    const users = authManager.getUsersList();
    
    const html = `
      <div class="logs-container">
        <div class="logs-header">
          <div class="logs-title">
            <h2>📋 Registro de Atividades</h2>
            <p>Acompanhe todas as ações realizadas no sistema</p>
          </div>
          <div class="logs-actions">
            <button class="btn btn-secondary" onclick="logsView.exportLogs()">
              📥 Exportar Logs
            </button>
            <button class="btn btn-danger" onclick="logsView.clearLogs()">
              🗑️ Limpar Logs
            </button>
          </div>
        </div>

        <div class="logs-stats">
          <div class="stat-card mini">
            <span class="stat-value">${stats.totalLogs}</span>
            <span class="stat-label">Total de Registros</span>
          </div>
          ${users.map(user => `
            <div class="stat-card mini" style="border-left: 4px solid ${user.color}">
              <span class="stat-value">${stats.byUser[user.username] || 0}</span>
              <span class="stat-label">${user.avatar} ${user.displayName}</span>
            </div>
          `).join('')}
        </div>

        <div class="logs-filters">
          <div class="filter-group">
            <label>Usuário</label>
            <select id="logUserFilter" onchange="logsView.applyFilters()">
              <option value="all">Todos os usuários</option>
              ${users.map(user => `
                <option value="${user.id}">${user.avatar} ${user.displayName}</option>
              `).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label>Tipo de Ação</label>
            <select id="logActionFilter" onchange="logsView.applyFilters()">
              <option value="all">Todas as ações</option>
              <optgroup label="Autenticação">
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </optgroup>
              <optgroup label="Transações">
                <option value="CREATE_TRANSACTION">Criar Transação</option>
                <option value="UPDATE_TRANSACTION">Editar Transação</option>
                <option value="DELETE_TRANSACTION">Excluir Transação</option>
              </optgroup>
              <optgroup label="Contas">
                <option value="CREATE_ACCOUNT">Criar Conta</option>
                <option value="UPDATE_ACCOUNT">Editar Conta</option>
                <option value="DELETE_ACCOUNT">Excluir Conta</option>
              </optgroup>
              <optgroup label="Vendas">
                <option value="CREATE_SALE">Criar Venda</option>
                <option value="UPDATE_SALE">Editar Venda</option>
                <option value="DELETE_SALE">Excluir Venda</option>
              </optgroup>
              <optgroup label="Devedores">
                <option value="CREATE_DEBTOR">Criar Devedor</option>
                <option value="UPDATE_DEBTOR">Editar Devedor</option>
                <option value="DELETE_DEBTOR">Excluir Devedor</option>
                <option value="RECEIVE_DEBTOR_PAYMENT">Receber Pagamento</option>
              </optgroup>
              <optgroup label="Sistema">
                <option value="EXPORT_DATA">Exportar Dados</option>
                <option value="IMPORT_DATA">Importar Dados</option>
                <option value="CHANGE_SETTINGS">Alterar Configurações</option>
              </optgroup>
            </select>
          </div>

          <div class="filter-group">
            <label>Data Inicial</label>
            <input type="date" id="logDateStart" onchange="logsView.applyFilters()">
          </div>

          <div class="filter-group">
            <label>Data Final</label>
            <input type="date" id="logDateEnd" onchange="logsView.applyFilters()">
          </div>

          <div class="filter-group search-group">
            <label>Buscar</label>
            <input type="text" id="logSearch" placeholder="Buscar nos logs..." oninput="logsView.applyFilters()">
          </div>

          <button class="btn btn-secondary" onclick="logsView.clearFilters()">
            🔄 Limpar Filtros
          </button>
        </div>

        <div class="logs-table-container" id="logsTableContainer">
          ${this.renderLogsTable()}
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Renderiza a tabela de logs
   */
  renderLogsTable() {
    let logs = this.getFilteredLogs();
    const totalLogs = logs.length;
    const totalPages = Math.ceil(totalLogs / this.itemsPerPage);
    
    // Paginação
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    logs = logs.slice(startIndex, endIndex);

    if (logs.length === 0) {
      return `
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <h3>Nenhum registro encontrado</h3>
          <p>Não há logs que correspondam aos filtros selecionados</p>
        </div>
      `;
    }

    return `
      <table class="logs-table">
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Usuário</th>
            <th>Ação</th>
            <th>Descrição</th>
            <th>Detalhes</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => this.renderLogRow(log)).join('')}
        </tbody>
      </table>

      <div class="pagination">
        <div class="pagination-info">
          Mostrando ${startIndex + 1}-${Math.min(endIndex, totalLogs)} de ${totalLogs} registros
        </div>
        <div class="pagination-controls">
          <button class="btn-page" onclick="logsView.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>
            ⏮️
          </button>
          <button class="btn-page" onclick="logsView.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
            ◀️
          </button>
          <span class="page-indicator">Página ${this.currentPage} de ${totalPages || 1}</span>
          <button class="btn-page" onclick="logsView.goToPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>
            ▶️
          </button>
          <button class="btn-page" onclick="logsView.goToPage(${totalPages})" ${this.currentPage >= totalPages ? 'disabled' : ''}>
            ⏭️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza uma linha da tabela de logs
   */
  renderLogRow(log) {
    const user = authManager.getUsersList().find(u => u.id === log.userId);
    const actionInfo = this.getActionInfo(log.action);
    const timestamp = new Date(log.timestamp);
    
    return `
      <tr class="log-row ${actionInfo.type}">
        <td class="log-timestamp">
          <div class="timestamp-date">${timestamp.toLocaleDateString('pt-BR')}</div>
          <div class="timestamp-time">${timestamp.toLocaleTimeString('pt-BR')}</div>
        </td>
        <td class="log-user">
          <span class="user-badge" style="background: ${user?.color || '#64748B'}20; color: ${user?.color || '#64748B'}">
            ${user?.avatar || '👤'} ${log.displayName || log.username}
          </span>
        </td>
        <td class="log-action">
          <span class="action-badge ${actionInfo.type}">
            ${actionInfo.icon} ${actionInfo.label}
          </span>
        </td>
        <td class="log-description">${sanitizeString(log.description)}</td>
        <td class="log-details">
          ${log.details ? `
            <button class="btn-details" onclick="logsView.showDetails('${log.id}')">
              🔍 Ver
            </button>
          ` : '-'}
        </td>
      </tr>
    `;
  }

  /**
   * Retorna informações sobre o tipo de ação
   */
  getActionInfo(action) {
    const actions = {
      // Autenticação
      'LOGIN': { icon: '🔓', label: 'Login', type: 'success' },
      'LOGOUT': { icon: '🔒', label: 'Logout', type: 'info' },
      
      // Transações
      'CREATE_TRANSACTION': { icon: '➕', label: 'Nova Transação', type: 'success' },
      'UPDATE_TRANSACTION': { icon: '✏️', label: 'Editar Transação', type: 'warning' },
      'DELETE_TRANSACTION': { icon: '🗑️', label: 'Excluir Transação', type: 'danger' },
      
      // Contas
      'CREATE_ACCOUNT': { icon: '🏦', label: 'Nova Conta', type: 'success' },
      'UPDATE_ACCOUNT': { icon: '✏️', label: 'Editar Conta', type: 'warning' },
      'DELETE_ACCOUNT': { icon: '🗑️', label: 'Excluir Conta', type: 'danger' },
      
      // Categorias
      'CREATE_CATEGORY': { icon: '🏷️', label: 'Nova Categoria', type: 'success' },
      'UPDATE_CATEGORY': { icon: '✏️', label: 'Editar Categoria', type: 'warning' },
      'DELETE_CATEGORY': { icon: '🗑️', label: 'Excluir Categoria', type: 'danger' },
      
      // Vendas
      'CREATE_SALE': { icon: '🛒', label: 'Nova Venda', type: 'success' },
      'UPDATE_SALE': { icon: '✏️', label: 'Editar Venda', type: 'warning' },
      'DELETE_SALE': { icon: '🗑️', label: 'Excluir Venda', type: 'danger' },
      'RECEIVE_SALE_PAYMENT': { icon: '💵', label: 'Receber Venda', type: 'success' },
      
      // Clientes
      'CREATE_CUSTOMER': { icon: '👥', label: 'Novo Cliente', type: 'success' },
      'UPDATE_CUSTOMER': { icon: '✏️', label: 'Editar Cliente', type: 'warning' },
      'DELETE_CUSTOMER': { icon: '🗑️', label: 'Excluir Cliente', type: 'danger' },
      
      // Produtos
      'CREATE_PRODUCT': { icon: '📦', label: 'Novo Produto', type: 'success' },
      'UPDATE_PRODUCT': { icon: '✏️', label: 'Editar Produto', type: 'warning' },
      'DELETE_PRODUCT': { icon: '🗑️', label: 'Excluir Produto', type: 'danger' },
      
      // Devedores
      'CREATE_DEBTOR': { icon: '👤', label: 'Novo Devedor', type: 'success' },
      'UPDATE_DEBTOR': { icon: '✏️', label: 'Editar Devedor', type: 'warning' },
      'DELETE_DEBTOR': { icon: '🗑️', label: 'Excluir Devedor', type: 'danger' },
      'RECEIVE_DEBTOR_PAYMENT': { icon: '💵', label: 'Receber Pagamento', type: 'success' },
      
      // Orçamentos
      'CREATE_BUDGET': { icon: '📋', label: 'Novo Orçamento', type: 'success' },
      'UPDATE_BUDGET': { icon: '✏️', label: 'Editar Orçamento', type: 'warning' },
      'DELETE_BUDGET': { icon: '🗑️', label: 'Excluir Orçamento', type: 'danger' },
      
      // Investimentos
      'CREATE_INVESTMENT': { icon: '📈', label: 'Novo Investimento', type: 'success' },
      'UPDATE_INVESTMENT': { icon: '✏️', label: 'Editar Investimento', type: 'warning' },
      'DELETE_INVESTMENT': { icon: '🗑️', label: 'Excluir Investimento', type: 'danger' },
      
      // Dívidas
      'CREATE_DEBT': { icon: '💳', label: 'Nova Dívida', type: 'success' },
      'UPDATE_DEBT': { icon: '✏️', label: 'Editar Dívida', type: 'warning' },
      'DELETE_DEBT': { icon: '🗑️', label: 'Excluir Dívida', type: 'danger' },
      'PAY_DEBT': { icon: '💵', label: 'Pagar Dívida', type: 'success' },
      
      // Metas
      'CREATE_GOAL': { icon: '🎯', label: 'Nova Meta', type: 'success' },
      'UPDATE_GOAL': { icon: '✏️', label: 'Editar Meta', type: 'warning' },
      'DELETE_GOAL': { icon: '🗑️', label: 'Excluir Meta', type: 'danger' },
      'CONTRIBUTE_GOAL': { icon: '💵', label: 'Contribuir Meta', type: 'success' },
      
      // Perfis
      'CREATE_BUSINESS': { icon: '🏢', label: 'Novo Perfil', type: 'success' },
      'UPDATE_BUSINESS': { icon: '✏️', label: 'Editar Perfil', type: 'warning' },
      'DELETE_BUSINESS': { icon: '🗑️', label: 'Excluir Perfil', type: 'danger' },
      'SWITCH_BUSINESS': { icon: '🔄', label: 'Trocar Perfil', type: 'info' },
      
      // Sistema
      'EXPORT_DATA': { icon: '📤', label: 'Exportar Dados', type: 'info' },
      'IMPORT_DATA': { icon: '📥', label: 'Importar Dados', type: 'warning' },
      'CLEAR_DATA': { icon: '🗑️', label: 'Limpar Dados', type: 'danger' },
      'CHANGE_SETTINGS': { icon: '⚙️', label: 'Configurações', type: 'info' },
      'CLEAR_LOGS': { icon: '🗑️', label: 'Limpar Logs', type: 'danger' },
      'VIEW_LOGS': { icon: '📋', label: 'Ver Logs', type: 'info' }
    };

    return actions[action] || { icon: '📌', label: action, type: 'info' };
  }

  /**
   * Aplica os filtros
   */
  applyFilters() {
    this.filters.user = document.getElementById('logUserFilter')?.value || 'all';
    this.filters.action = document.getElementById('logActionFilter')?.value || 'all';
    this.filters.dateStart = document.getElementById('logDateStart')?.value || null;
    this.filters.dateEnd = document.getElementById('logDateEnd')?.value || null;
    this.filters.search = document.getElementById('logSearch')?.value || '';
    
    this.currentPage = 1;
    this.updateTable();
  }

  /**
   * Limpa os filtros
   */
  clearFilters() {
    this.filters = {
      user: 'all',
      action: 'all',
      dateStart: null,
      dateEnd: null,
      search: ''
    };

    document.getElementById('logUserFilter').value = 'all';
    document.getElementById('logActionFilter').value = 'all';
    document.getElementById('logDateStart').value = '';
    document.getElementById('logDateEnd').value = '';
    document.getElementById('logSearch').value = '';

    this.currentPage = 1;
    this.updateTable();
  }

  /**
   * Retorna logs filtrados
   */
  getFilteredLogs() {
    let logs = authManager.getAllLogs();

    // Filtrar por usuário
    if (this.filters.user !== 'all') {
      logs = logs.filter(log => log.userId === this.filters.user);
    }

    // Filtrar por ação
    if (this.filters.action !== 'all') {
      logs = logs.filter(log => log.action === this.filters.action);
    }

    // Filtrar por data
    if (this.filters.dateStart) {
      const startDate = new Date(this.filters.dateStart);
      startDate.setHours(0, 0, 0, 0);
      logs = logs.filter(log => new Date(log.timestamp) >= startDate);
    }

    if (this.filters.dateEnd) {
      const endDate = new Date(this.filters.dateEnd);
      endDate.setHours(23, 59, 59, 999);
      logs = logs.filter(log => new Date(log.timestamp) <= endDate);
    }

    // Filtrar por busca
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      logs = logs.filter(log => 
        log.description.toLowerCase().includes(search) ||
        log.username.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search)
      );
    }

    return logs;
  }

  /**
   * Atualiza a tabela
   */
  updateTable() {
    const container = document.getElementById('logsTableContainer');
    if (container) {
      container.innerHTML = this.renderLogsTable();
    }
  }

  /**
   * Navega para uma página específica
   */
  goToPage(page) {
    const totalLogs = this.getFilteredLogs().length;
    const totalPages = Math.ceil(totalLogs / this.itemsPerPage);
    
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.updateTable();
    }
  }

  /**
   * Mostra detalhes de um log
   */
  showDetails(logId) {
    const log = authManager.getAllLogs().find(l => l.id === logId);
    if (!log || !log.details) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>📋 Detalhes do Registro</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <strong>ID:</strong> ${log.id}
          </div>
          <div class="detail-item">
            <strong>Usuário:</strong> ${log.displayName} (${log.username})
          </div>
          <div class="detail-item">
            <strong>Ação:</strong> ${log.action}
          </div>
          <div class="detail-item">
            <strong>Data/Hora:</strong> ${new Date(log.timestamp).toLocaleString('pt-BR')}
          </div>
          <div class="detail-item">
            <strong>Descrição:</strong> ${log.description}
          </div>
          <div class="detail-item">
            <strong>Detalhes:</strong>
            <pre class="details-json">${JSON.stringify(log.details, null, 2)}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Exporta os logs em formato TXT
   */
  exportLogs() {
    authManager.log(LOG_ACTIONS.EXPORT_DATA, 'Exportou logs de atividades');
    
    const logs = authManager.getAllLogs();
    const txtContent = this.formatLogsToTxt(logs);
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_atividades_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Toast.show('Logs exportados com sucesso!', 'success');
  }

  /**
   * Formata os logs para formato TXT legível
   */
  formatLogsToTxt(logs) {
    const header = `================================================================================
                    GERENCIADOR FINANCEIRO PRO - LOGS DE ATIVIDADES
================================================================================
Data de Exportação: ${new Date().toLocaleString('pt-BR')}
Total de Registros: ${logs.length}
================================================================================\n\n`;

    const logsText = logs.map(log => {
      const timestamp = new Date(log.timestamp);
      const actionInfo = this.getActionInfo(log.action);
      
      let entry = `[${timestamp.toLocaleDateString('pt-BR')} ${timestamp.toLocaleTimeString('pt-BR')}]\n`;
      entry += `Usuário: ${log.displayName || log.username}\n`;
      entry += `Ação: ${actionInfo.label}\n`;
      entry += `Descrição: ${log.description}\n`;
      
      if (log.details) {
        entry += `Detalhes: ${JSON.stringify(log.details, null, 2)}\n`;
      }
      
      entry += `--------------------------------------------------------------------------------\n`;
      return entry;
    }).join('\n');

    return header + logsText;
  }

  /**
   * Limpa os logs
   */
  clearLogs() {
    if (authManager.clearAllLogs()) {
      this.updateTable();
      Toast.show('Logs limpos com sucesso!', 'success');
    }
  }
}

// Instância global
window.logsView = new LogsView();
