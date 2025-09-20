// Wallapop Filter Extension - Popup Script
class PopupController {
  constructor() {
    this.currentMode = 'all';
    this.isLoading = false;
    this.init();
  }

  init() {
    console.log('🚀 Popup iniciado');
    
    // Cargar configuración y estado
    this.loadSettings();
    this.loadCurrentStatus();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Actualizar estado cada 3 segundos
    this.setupStatusUpdater();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['filterMode']);
      this.currentMode = result.filterMode || 'all';
      console.log(`📋 Configuración cargada: ${this.currentMode}`);
      this.updateActiveButton();
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    }
  }

  async loadCurrentStatus() {
    try {
      this.setLoading(true);
      
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });
      
      if (!tab) {
        this.showError('No se encontró pestaña activa');
        return;
      }
      
      if (!tab.url.includes('wallapop.com')) {
        this.showError('No estás en Wallapop');
        return;
      }

      console.log(`🔍 Intentando conectar con: ${tab.url}`);

      // Intentar conectar con timeout
      const response = await Promise.race([
        this.sendMessageToContentScript({ action: 'getStatus' }),
        new Promise(resolve => setTimeout(() => resolve(null), 2000))
      ]);

      if (response && response.success) {
        this.updateStatus(response);
        this.currentMode = response.filterMode || 'all';
        this.updateActiveButton();
        this.showSuccess('✅ Conectado');
      } else {
        // Si no puede conectar, mostrar estado por defecto
        this.updateStatus({
          totalResults: '?',
          isInitialized: false,
          filterMode: this.currentMode
        });
        this.showError('⚠️ Recarga la página de Wallapop');
      }
    } catch (error) {
      console.error('❌ Error cargando estado:', error);
      this.showError('Error de conexión');
    } finally {
      this.setLoading(false);
    }
  }

  async sendMessageToContentScript(message) {
    try {
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });
      
      if (!tab) {
        console.error('❌ No se encontró tab activa');
        return null;
      }
      
      console.log(`📤 Enviando mensaje a tab ${tab.id}:`, message);
      
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error enviando mensaje:', chrome.runtime.lastError.message);
            resolve(null);
          } else {
            console.log('📥 Respuesta recibida:', response);
            resolve(response);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      return null;
    }
  }

  setupEventListeners() {
    const buttons = document.querySelectorAll('.filter-option');
    
    buttons.forEach(button => {
      button.addEventListener('click', async () => {
        const mode = button.dataset.mode;
        await this.setFilterMode(mode);
      });
    });

    // Listener para cambios en el almacenamiento
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.filterMode) {
        this.currentMode = changes.filterMode.newValue;
        this.updateActiveButton();
        setTimeout(() => {
          this.loadCurrentStatus();
        }, 100);
      }
    });
  }

  async setFilterMode(mode) {
    if (this.isLoading) return;

    console.log(`🔄 Cambiando filtro a: ${mode}`);
    
    try {
      this.setLoading(true);
      
      const response = await this.sendMessageToContentScript({
        action: 'setFilter',
        mode: mode
      });

      if (response && response.success) {
        this.currentMode = mode;
        this.updateActiveButton();
        this.showSuccess(`Filtro: ${this.getModeText(mode)}`);
        
        setTimeout(() => {
          this.loadCurrentStatus();
        }, 300);
      } else {
        this.showError('No se pudo cambiar el filtro');
      }
    } catch (error) {
      console.error('❌ Error cambiando filtro:', error);
      this.showError('Error al cambiar filtro');
    } finally {
      this.setLoading(false);
    }
  }

  updateActiveButton() {
    const buttons = document.querySelectorAll('.filter-option');
    
    buttons.forEach(button => {
      const isActive = button.dataset.mode === this.currentMode;
      button.classList.toggle('active', isActive);
    });

    const statusElement = document.getElementById('current-status');
    if (statusElement) {
      statusElement.textContent = this.getModeText(this.currentMode);
    }
  }

  getModeText(mode) {
    const modeTexts = {
      'all': 'Todos',
      'available': 'Disponibles',
      'reserved': 'Reservados'
    };
    return modeTexts[mode] || mode;
  }

  updateStatus(statusData) {
    const resultsElement = document.getElementById('results-count');
    if (resultsElement && statusData.totalResults !== undefined) {
      resultsElement.textContent = statusData.totalResults.toString();
    }

    const initElement = document.getElementById('initialization-status');
    if (initElement) {
      initElement.textContent = statusData.isInitialized ? '✅ Sí' : '❌ No';
    }

    const statusElement = document.getElementById('current-status');
    if (statusElement) {
      statusElement.textContent = this.getModeText(statusData.filterMode || 'all');
    }
  }

  setupStatusUpdater() {
    setInterval(() => {
      if (!this.isLoading) {
        this.loadCurrentStatus();
      }
    }, 3000);
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    const buttons = document.querySelectorAll('.filter-option');
    buttons.forEach(button => {
      button.disabled = loading;
    });

    let loadingElement = document.querySelector('.loading');
    if (loading && !loadingElement) {
      loadingElement = document.createElement('div');
      loadingElement.className = 'loading';
      loadingElement.textContent = 'Cargando...';
      document.body.appendChild(loadingElement);
    } else if (!loading && loadingElement) {
      loadingElement.remove();
    }
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

console.log('✅ Popup script cargado');
