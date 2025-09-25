// Reserve Sniper - Popup Simplificado
class SimplePopup {
  constructor() {
    this.init();
  }

  init() {
    console.log('🚀 Popup simplificado iniciado');
    this.loadCurrentStatus();
    this.setupStatusUpdater();
  }

  async loadCurrentStatus() {
    try {
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

      console.log(`🔍 Conectando con: ${tab.url}`);

      // Intentar obtener estado del content script
      const response = await this.sendMessageToContentScript({ action: 'getStatus' });

      if (response && response.success) {
        this.updateStatus(response);
        this.showSuccess('✅ Conectado');
      } else {
        this.updateStatus({
          totalResults: '?',
          isInitialized: false,
          filterMode: 'all'
        });
        this.showError('⚠️ Recarga la página');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      this.showError('Error de conexión');
    }
  }

  async sendMessageToContentScript(message) {
    try {
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });
      
      if (!tab) return null;
      
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error:', chrome.runtime.lastError.message);
            resolve(null);
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error:', error);
      return null;
    }
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
      const modeTexts = {
        'all': 'Todos',
        'available': 'Disponibles',
        'reserved': 'Reservados'
      };
      statusElement.textContent = modeTexts[statusData.filterMode] || 'Todos';
    }
  }

  setupStatusUpdater() {
    setInterval(() => {
      this.loadCurrentStatus();
    }, 5000);
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
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      background: ${type === 'error' ? '#dc3545' : '#28a745'};
      color: white;
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 2000);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new SimplePopup();
});

console.log('✅ Popup simplificado cargado');