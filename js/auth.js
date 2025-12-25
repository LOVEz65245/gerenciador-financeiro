// ============================================
// SISTEMA DE AUTENTICAÇÃO E LOG DE ATIVIDADES
// Gerenciador Financeiro Pro v4.1
// Suporte a Login via Google e Senha
// ============================================

class AuthManager {
  constructor() {
    // ============================================
    // CONFIGURAÇÃO DE USUÁRIOS AUTORIZADOS
    // ============================================
    this.authorizedUsers = {
      'LOVEz': {
        id: 'user_lovez',
        password: 'LVz1928',
        displayName: 'LOVEz',
        avatar: '👤',
        color: '#3B82F6',
        role: 'admin',
        emails: ['lovez65245@gmail.com', 'lovez.drop65245@gmail.com', 'fireconta01@gmail.com', 'carlosff65245@gmail.com']
      },
      'Ghaby': {
        id: 'user_ghaby',
        password: 'Ghaby2024',
        displayName: 'Ghaby',
        avatar: '👩',
        color: '#EC4899',
        role: 'admin',
        emails: ['vitoriaghabriella80@gmail.com']
      }
    };

    // Mapeamento de emails para usuários
    this.authorizedEmails = {};
    for (const [username, user] of Object.entries(this.authorizedUsers)) {
      for (const email of user.emails) {
        this.authorizedEmails[email.toLowerCase()] = { ...user, username };
      }
    }

    this.currentUser = null;
    this.sessionKey = CONFIG.STORAGE_KEYS.SESSION;
    this.logsKey = CONFIG.STORAGE_KEYS.ACTIVITY_LOGS;
    this.activityLogs = [];
    this.sessionCheckInterval = null;

    this.loadSession();
    this.loadLogs();
    this.startSessionMonitor();
  }

  // ============================================
  // FUNÇÕES DE SESSÃO
  // ============================================

  generateSessionToken() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 15);
    const userAgent = navigator.userAgent.length.toString(36);
    return `${timestamp}_${random}_${userAgent}`;
  }

  validateSessionToken(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('_');
    return parts.length >= 3;
  }

  // ============================================
  // AUTENTICAÇÃO VIA SENHA
  // ============================================

  loginWithPassword(username, password) {
    const user = this.authorizedUsers[username];
    
    if (!user) {
      this.logFailedLogin(username);
      return null;
    }

    if (user.password !== password) {
      this.logFailedLogin(username);
      return null;
    }

    return this.createSession(user, username, 'password');
  }

  // ============================================
  // AUTENTICAÇÃO VIA GOOGLE
  // ============================================

  isEmailAuthorized(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase().trim();
    return this.authorizedEmails[normalizedEmail] || null;
  }

  loginWithGoogle(googleUserInfo) {
    if (!googleUserInfo || !googleUserInfo.email) {
      this.logFailedLogin('google_no_email');
      return null;
    }

    const email = googleUserInfo.email.toLowerCase().trim();
    const authorizedUser = this.isEmailAuthorized(email);

    if (!authorizedUser) {
      this.logFailedLogin(email);
      return null;
    }

    return this.createSession(authorizedUser, authorizedUser.username, 'google', {
      email: email,
      googleName: googleUserInfo.name,
      googlePicture: googleUserInfo.picture
    });
  }

  // ============================================
  // CRIAR SESSÃO
  // ============================================

  createSession(user, username, method, extra = {}) {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + CONFIG.LIMITS.SESSION_DURATION).toISOString();

    this.currentUser = {
      id: user.id,
      username: username,
      displayName: user.displayName,
      avatar: user.avatar,
      color: user.color,
      role: user.role,
      email: extra.email || user.emails[0],
      googleName: extra.googleName || user.displayName,
      googlePicture: extra.googlePicture || null,
      sessionToken: sessionToken,
      loginAt: new Date().toISOString(),
      expiresAt: expiresAt,
      lastActivity: new Date().toISOString(),
      loginMethod: method
    };

    this.saveSession();
    this.log('LOGIN', `Login via ${method}: ${username}`);

    return this.currentUser;
  }

  logFailedLogin(identifier) {
    this.log('LOGIN_FAILED', `Tentativa de login falha: ${identifier}`);
  }

  // ============================================
  // GERENCIAMENTO DE SESSÃO
  // ============================================

  saveSession() {
    if (this.currentUser) {
      try {
        localStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));
      } catch (e) {
        console.error('Erro ao salvar sessão:', e);
      }
    }
  }

  loadSession() {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        
        if (session && session.expiresAt) {
          const expiresAt = new Date(session.expiresAt);
          if (expiresAt > new Date()) {
            if (this.validateSessionToken(session.sessionToken)) {
              this.currentUser = session;
              return;
            }
          }
        }
        
        this.clearSession();
      }
    } catch (e) {
      console.error('Erro ao carregar sessão:', e);
      this.clearSession();
    }
  }

  clearSession() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.sessionKey);
    } catch (e) {
      console.error('Erro ao limpar sessão:', e);
    }
  }

  logout() {
    if (this.currentUser) {
      this.log('LOGOUT', 'Usuário fez logout do sistema');
    }
    this.clearSession();
    this.stopSessionMonitor();
    window.location.href = 'login.html';
  }

  isAuthenticated() {
    if (!this.currentUser) return false;
    
    if (this.currentUser.expiresAt) {
      const expiresAt = new Date(this.currentUser.expiresAt);
      if (expiresAt <= new Date()) {
        this.clearSession();
        return false;
      }
    }
    
    return true;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  updateLastActivity() {
    if (this.currentUser) {
      this.currentUser.lastActivity = new Date().toISOString();
      this.saveSession();
    }
  }

  extendSession(hours = 24) {
    if (this.currentUser) {
      this.currentUser.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      this.saveSession();
      this.log('SESSION_EXTENDED', `Sessão estendida por ${hours} horas`);
    }
  }

  // ============================================
  // MONITORAMENTO DE SESSÃO
  // ============================================

  startSessionMonitor() {
    this.stopSessionMonitor();
    
    this.sessionCheckInterval = setInterval(() => {
      if (!this.isAuthenticated()) {
        this.stopSessionMonitor();
        window.location.href = 'login.html';
      }
    }, 60000);

    ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      }, { passive: true, once: false });
    });
  }

  stopSessionMonitor() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // ============================================
  // LOGS DE ATIVIDADE
  // ============================================

  loadLogs() {
    try {
      const logsData = localStorage.getItem(this.logsKey);
      if (logsData) {
        this.activityLogs = JSON.parse(logsData);
      }
    } catch (e) {
      console.error('Erro ao carregar logs:', e);
      this.activityLogs = [];
    }
  }

  saveLogs() {
    try {
      if (this.activityLogs.length > 1000) {
        this.activityLogs = this.activityLogs.slice(0, 1000);
      }
      localStorage.setItem(this.logsKey, JSON.stringify(this.activityLogs));
    } catch (e) {
      console.error('Erro ao salvar logs:', e);
    }
  }

  log(action, description, details = null) {
    const logEntry = {
      id: this.generateSessionToken(),
      userId: this.currentUser?.id || 'anonymous',
      username: this.currentUser?.username || 'Sistema',
      action: action,
      description: description,
      details: details,
      timestamp: new Date().toISOString()
    };

    this.activityLogs.unshift(logEntry);
    this.saveLogs();

    console.log(`[${action}] ${description}`);
  }

  getLogs(options = {}) {
    let logs = [...this.activityLogs];
    
    if (options.userId) {
      logs = logs.filter(l => l.userId === options.userId);
    }
    
    if (options.action) {
      logs = logs.filter(l => l.action === options.action);
    }
    
    if (options.startDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(options.startDate));
    }
    
    if (options.endDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(options.endDate));
    }
    
    if (options.limit) {
      logs = logs.slice(0, options.limit);
    }
    
    return logs;
  }

  clearLogs() {
    this.activityLogs = [];
    this.saveLogs();
    this.log('LOGS_CLEARED', 'Logs de atividade limpos');
  }

  // ============================================
  // FUNÇÕES PARA LOGS VIEW
  // ============================================

  /**
   * Retorna estatísticas dos logs de atividade
   * @returns {Object} Estatísticas dos logs
   */
  getLogStats() {
    const stats = {
      totalLogs: this.activityLogs.length,
      byUser: {},
      byAction: {},
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    this.activityLogs.forEach(log => {
      // Contagem por usuário
      const username = log.username || 'Sistema';
      stats.byUser[username] = (stats.byUser[username] || 0) + 1;

      // Contagem por ação
      const action = log.action || 'UNKNOWN';
      stats.byAction[action] = (stats.byAction[action] || 0) + 1;

      // Contagem por período
      const logDate = new Date(log.timestamp);
      if (logDate >= todayStart) {
        stats.today++;
      }
      if (logDate >= weekStart) {
        stats.thisWeek++;
      }
      if (logDate >= monthStart) {
        stats.thisMonth++;
      }
    });

    return stats;
  }

  /**
   * Retorna a lista de usuários autorizados
   * @returns {Array} Lista de usuários
   */
  getUsersList() {
    return Object.entries(this.authorizedUsers).map(([username, user]) => ({
      id: user.id,
      username: username,
      displayName: user.displayName,
      avatar: user.avatar,
      color: user.color,
      role: user.role
    }));
  }

  /**
   * Retorna todos os logs de atividade
   * @returns {Array} Lista de todos os logs
   */
  getAllLogs() {
    return [...this.activityLogs];
  }

  /**
   * Limpa todos os logs de atividade
   * @returns {boolean} Sucesso da operação
   */
  clearAllLogs() {
    try {
      this.activityLogs = [];
      this.saveLogs();
      this.log('LOGS_CLEARED', 'Todos os logs de atividade foram limpos');
      return true;
    } catch (e) {
      console.error('Erro ao limpar logs:', e);
      return false;
    }
  }
}

// Instância global
const authManager = new AuthManager();
