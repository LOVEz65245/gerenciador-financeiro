// ============================================
// MODAL - GERENCIADOR FINANCEIRO PRO v4.0
// Sistema de modais para confirmações e alertas
// ============================================

class Modal {
  static container = null;
  static _resolve = null;
  static escHandler = null;

  /**
   * Inicializa o container de modais
   */
  static init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'modal-container';
      this.container.className = 'modal-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Fecha o modal atual
   */
  static close() {
    if (this.container) {
      this.container.classList.remove('active');
      this.container.innerHTML = '';
    }
    // Remover handler de ESC
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
    // Resolver promise pendente com false
    if (this._resolve) {
      this._resolve(false);
      this._resolve = null;
    }
  }

  /**
   * Mostra um modal genérico
   * @param {string} title - Título do modal
   * @param {string} content - Conteúdo HTML do modal
   * @param {Array} buttons - Array de botões [{text, class, onclick}]
   */
  static show(title, content, buttons = []) {
    this.init();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${sanitizeString(title)}</h3>
          <button class="modal-close" onclick="Modal.close()">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          ${buttons.map(btn => `
            <button class="btn ${btn.class || 'btn-secondary'}" onclick="${btn.onclick}">${btn.text}</button>
          `).join('')}
        </div>
      </div>
    `;
    
    this.container.innerHTML = '';
    this.container.appendChild(modal);
    this.container.classList.add('active');
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });

    // Fechar com ESC
    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  /**
   * Mostra um modal de confirmação
   * @param {string} title - Título do modal
   * @param {string} message - Mensagem do modal
   * @param {object} options - Opções adicionais
   * @returns {Promise<boolean>} - Retorna true se confirmado, false se cancelado
   */
  static confirmAction(title, message, options = {}) {
    return new Promise((resolve) => {
      const {
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        confirmClass = 'btn-primary',
        dangerous = false
      } = options;

      this.init();
      this._resolve = resolve;

      // Criar overlay
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3>${dangerous ? '⚠️ ' : ''}${sanitizeString(title)}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>${sanitizeString(message)}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-cancel">${cancelText}</button>
            <button class="btn ${dangerous ? 'btn-danger' : confirmClass} modal-confirm">${confirmText}</button>
          </div>
        </div>
      `;

      this.container.innerHTML = '';
      this.container.appendChild(overlay);
      this.container.classList.add('active');

      // Handlers
      const confirmBtn = overlay.querySelector('.modal-confirm');
      const cancelBtn = overlay.querySelector('.modal-cancel');
      const closeBtn = overlay.querySelector('.modal-close');

      const cleanup = (result) => {
        this._resolve = null;
        this.container.classList.remove('active');
        this.container.innerHTML = '';
        if (this.escHandler) {
          document.removeEventListener('keydown', this.escHandler);
          this.escHandler = null;
        }
        resolve(result);
      };

      confirmBtn.addEventListener('click', () => cleanup(true));
      cancelBtn.addEventListener('click', () => cleanup(false));
      closeBtn.addEventListener('click', () => cleanup(false));

      // Fechar ao clicar fora
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup(false);
        }
      });

      // Fechar com ESC
      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          cleanup(false);
        }
      };
      document.addEventListener('keydown', this.escHandler);
    });
  }

  /**
   * Mostra um modal de alerta
   * @param {string} title - Título do modal
   * @param {string} message - Mensagem do modal
   * @param {string} type - Tipo do alerta (info, success, warning, error)
   * @returns {Promise<void>}
   */
  static alert(title, message, type = 'info') {
    return new Promise((resolve) => {
      const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      };

      this.init();

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3>${icons[type] || ''} ${sanitizeString(title)}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>${sanitizeString(message)}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary modal-ok">OK</button>
          </div>
        </div>
      `;

      this.container.innerHTML = '';
      this.container.appendChild(overlay);
      this.container.classList.add('active');

      const okBtn = overlay.querySelector('.modal-ok');
      const closeBtn = overlay.querySelector('.modal-close');

      const cleanup = () => {
        this.container.classList.remove('active');
        this.container.innerHTML = '';
        if (this.escHandler) {
          document.removeEventListener('keydown', this.escHandler);
          this.escHandler = null;
        }
        resolve();
      };

      okBtn.addEventListener('click', cleanup);
      closeBtn.addEventListener('click', cleanup);

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
        }
      });

      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          cleanup();
        }
      };
      document.addEventListener('keydown', this.escHandler);
    });
  }

  /**
   * Mostra um modal de prompt
   * @param {string} title - Título do modal
   * @param {string} message - Mensagem do modal
   * @param {string} defaultValue - Valor padrão
   * @param {object} options - Opções adicionais
   * @returns {Promise<string|null>} - Retorna o valor digitado ou null se cancelado
   */
  static prompt(title, message, defaultValue = '', options = {}) {
    return new Promise((resolve) => {
      const {
        placeholder = '',
        inputType = 'text',
        confirmText = 'OK',
        cancelText = 'Cancelar',
        required = false
      } = options;

      this.init();

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3>${sanitizeString(title)}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>${sanitizeString(message)}</p>
            <div class="form-group" style="margin-top: 16px;">
              <input 
                type="${inputType}" 
                class="form-input modal-input" 
                value="${sanitizeString(defaultValue)}"
                placeholder="${sanitizeString(placeholder)}"
                ${required ? 'required' : ''}
              >
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-cancel">${cancelText}</button>
            <button class="btn btn-primary modal-confirm">${confirmText}</button>
          </div>
        </div>
      `;

      this.container.innerHTML = '';
      this.container.appendChild(overlay);
      this.container.classList.add('active');

      const input = overlay.querySelector('.modal-input');
      const confirmBtn = overlay.querySelector('.modal-confirm');
      const cancelBtn = overlay.querySelector('.modal-cancel');
      const closeBtn = overlay.querySelector('.modal-close');

      // Focar no input
      setTimeout(() => input.focus(), 100);

      const cleanup = () => {
        this.container.classList.remove('active');
        this.container.innerHTML = '';
        if (this.escHandler) {
          document.removeEventListener('keydown', this.escHandler);
          this.escHandler = null;
        }
      };

      const confirm = () => {
        const value = input.value;
        if (required && !value.trim()) {
          input.classList.add('error');
          input.focus();
          return;
        }
        cleanup();
        resolve(value);
      };

      const cancel = () => {
        cleanup();
        resolve(null);
      };

      confirmBtn.addEventListener('click', confirm);
      cancelBtn.addEventListener('click', cancel);
      closeBtn.addEventListener('click', cancel);

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          confirm();
        }
      });

      input.addEventListener('input', () => {
        input.classList.remove('error');
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cancel();
        }
      });

      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          cancel();
        }
      };
      document.addEventListener('keydown', this.escHandler);
    });
  }

  /**
   * Mostra um modal de seleção
   * @param {string} title - Título do modal
   * @param {string} message - Mensagem do modal
   * @param {Array} selectOptions - Array de opções [{value, label}]
   * @returns {Promise<string|null>} - Retorna o valor selecionado ou null se cancelado
   */
  static select(title, message, selectOptions = []) {
    return new Promise((resolve) => {
      const optionsHtml = selectOptions.map(opt => 
        `<option value="${sanitizeString(opt.value)}">${sanitizeString(opt.label)}</option>`
      ).join('');

      this.init();

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3>${sanitizeString(title)}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>${sanitizeString(message)}</p>
            <div class="form-group" style="margin-top: 16px;">
              <select class="form-select modal-select">
                ${optionsHtml}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-cancel">Cancelar</button>
            <button class="btn btn-primary modal-confirm">Selecionar</button>
          </div>
        </div>
      `;

      this.container.innerHTML = '';
      this.container.appendChild(overlay);
      this.container.classList.add('active');

      const select = overlay.querySelector('.modal-select');
      const confirmBtn = overlay.querySelector('.modal-confirm');
      const cancelBtn = overlay.querySelector('.modal-cancel');
      const closeBtn = overlay.querySelector('.modal-close');

      const cleanup = () => {
        this.container.classList.remove('active');
        this.container.innerHTML = '';
        if (this.escHandler) {
          document.removeEventListener('keydown', this.escHandler);
          this.escHandler = null;
        }
      };

      confirmBtn.addEventListener('click', () => {
        const value = select.value;
        cleanup();
        resolve(value);
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      closeBtn.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(null);
        }
      });

      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(null);
        }
      };
      document.addEventListener('keydown', this.escHandler);
    });
  }

  /**
   * Mostra um modal de loading
   * @param {string} message - Mensagem de loading
   * @returns {object} - Objeto com método close() para fechar o modal
   */
  static loading(message = 'Carregando...') {
    this.init();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay modal-loading';
    overlay.innerHTML = `
      <div class="modal modal-loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-message">${sanitizeString(message)}</p>
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(overlay);
    this.container.classList.add('active');

    return {
      close: () => {
        this.container.classList.remove('active');
        this.container.innerHTML = '';
      },
      updateMessage: (newMessage) => {
        const msgEl = overlay.querySelector('.loading-message');
        if (msgEl) msgEl.textContent = newMessage;
      }
    };
  }

  /**
   * Mostra um modal de formulário customizado
   * @param {string} title - Título do modal
   * @param {string} formHtml - HTML do formulário
   * @param {Function} onSubmit - Callback ao submeter
   * @returns {object} - Objeto com método close()
   */
  static form(title, formHtml, onSubmit) {
    this.init();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal-form">
        <div class="modal-header">
          <h3>${sanitizeString(title)}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="modalForm">
            ${formHtml}
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancelar</button>
          <button class="btn btn-primary modal-submit" type="submit" form="modalForm">Salvar</button>
        </div>
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(overlay);
    this.container.classList.add('active');

    const form = overlay.querySelector('#modalForm');
    const cancelBtn = overlay.querySelector('.modal-cancel');
    const closeBtn = overlay.querySelector('.modal-close');
    const submitBtn = overlay.querySelector('.modal-submit');

    const cleanup = () => {
      this.container.classList.remove('active');
      this.container.innerHTML = '';
      if (this.escHandler) {
        document.removeEventListener('keydown', this.escHandler);
        this.escHandler = null;
      }
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      if (onSubmit(data) !== false) {
        cleanup();
      }
    });

    submitBtn.addEventListener('click', () => {
      form.dispatchEvent(new Event('submit'));
    });

    cancelBtn.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
      }
    });

    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
      }
    };
    document.addEventListener('keydown', this.escHandler);

    return { close: cleanup };
  }
}

// Exportar globalmente
window.Modal = Modal;
