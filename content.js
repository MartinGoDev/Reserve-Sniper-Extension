// Wallapop Filter Extension - Content Script FINAL
// Versión que usa el método correcto para ocultar/mostrar productos
class WallapopFilter {
  constructor() {
    this.filterMode = 'all'; // 'all', 'reserved', 'available'
    this.isInitialized = false;
    this.observer = null;
    this.filterIndicator = null;
    this.init();
  }

  init() {
    console.log('🚀 Reserve Sniper iniciado');
    
    // Cargar configuración guardada
    this.loadSettings();
    
    // Esperar a que la página cargue completamente
    this.waitForResults();
    
    // Escuchar mensajes del popup
    this.setupMessageListener();
    
    // Agregar indicador visual
    this.addFilterIndicator();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['filterMode', 'extensionEnabled']);
      this.filterMode = result.filterMode || 'all';
      this.extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
      console.log(`📋 Configuración cargada - Filtro: ${this.filterMode}, Activa: ${this.extensionEnabled}`);
      
      // Actualizar toggle en el sidebar si existe
      setTimeout(() => {
        const toggle = document.querySelector('#extension-toggle');
        if (toggle) {
          toggle.checked = this.extensionEnabled;
          const slider = document.querySelector('#toggle-slider');
          const knob = document.querySelector('#toggle-knob');
          if (slider && knob) {
            if (this.extensionEnabled) {
              slider.style.background = '#4CAF50';
              knob.style.left = '33px';
            } else {
              slider.style.background = '#ccc';
              knob.style.left = '3px';
            }
          }
        }
      }, 100);
    } catch (error) {
      console.log('⚠️ No se pudo cargar configuración, usando valores por defecto');
      this.extensionEnabled = true;
    }
  }

  waitForResults() {
    const checkResults = () => {
      const results = this.getSearchResults();
      
      if (results.length > 0) {
        console.log(`🔍 Encontrados ${results.length} resultados de búsqueda`);
        this.applyFilter();
        this.setupObserver();
        this.isInitialized = true;
      } else {
        // Reintentar cada 500ms
        setTimeout(checkResults, 500);
      }
    };
    
    // Esperar un poco antes de empezar a buscar
    setTimeout(checkResults, 1000);
  }

  getSearchResults() {
    // ✅ Usar el selector específico de Wallapop
    const specificSelector = '.item-card_ItemCard--vertical__CNrfk';
    let results = document.querySelectorAll(specificSelector);
    
    if (results.length > 0) {
      console.log(`✅ Usando selector específico: ${specificSelector} (${results.length} elementos)`);
      return results;
    }
    
    // Fallback
    const fallbackSelector = 'a[href*="/item/"]';
    results = document.querySelectorAll(fallbackSelector);
    
    if (results.length > 0) {
      console.log(`✅ Usando selector fallback: ${fallbackSelector} (${results.length} elementos)`);
    } else {
      console.log('❌ No se encontraron productos');
    }
    
    return results;
  }

  setupObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const newProducts = node.matches && node.matches('.item-card_ItemCard--vertical__CNrfk') ? [node] : 
                                 node.querySelectorAll ? node.querySelectorAll('.item-card_ItemCard--vertical__CNrfk') : [];
              
              if (newProducts.length > 0) {
                console.log(`🔄 Detectados ${newProducts.length} nuevos productos`);
                shouldUpdate = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldUpdate) {
        console.log('🔄 Aplicando filtro a nuevos productos...');
        setTimeout(() => this.applyFilter(), 100);
      }
    });

    const targetContainer = document.querySelector('main') || document.body;
    
    if (targetContainer) {
      console.log(`👁️ Observando cambios en:`, targetContainer.tagName, targetContainer.className);
      this.observer.observe(targetContainer, {
        childList: true,
        subtree: true
      });
    }
  }

  applyFilter() {
    const results = this.getSearchResults();
    if (results.length === 0) return;

    // Verificar si la extensión está activa
    if (!this.extensionEnabled) {
      // Si está desactivada, mostrar todos los productos
      results.forEach(productLink => {
        const card = productLink.closest('article, li, [data-testid="item-card"], .ItemCard, .item-card, [class*="ItemCard"], [class*="Card"]') || productLink;
        card.style.setProperty("display", "block", "important");
      });
      this.updateFilterIndicator(results.length, results.length);
      return;
    }

    let visibleCount = 0;
    let hiddenCount = 0;

    results.forEach((productLink, index) => {
      const isReserved = this.isItemReserved(productLink);
      let shouldShow = true;
      
      switch (this.filterMode) {
        case 'reserved':
          shouldShow = isReserved;
          break;
          
        case 'available':
          shouldShow = !isReserved;
          break;
          
        default: // 'all'
          shouldShow = true;
      }
      
      // ✅ USAR TU MÉTODO QUE FUNCIONA
      const card = productLink.closest('article, li, [data-testid="item-card"], .ItemCard, .item-card, [class*="ItemCard"], [class*="Card"]') || productLink;
      
      if (shouldShow) {
        card.style.setProperty("display", "block", "important");
        visibleCount++;
      } else {
        card.style.setProperty("display", "none", "important");
        hiddenCount++;
      }
    });

    console.log(`📊 Filtro aplicado (${this.filterMode}): ${visibleCount} visibles, ${hiddenCount} ocultos`);
    this.updateFilterIndicator(visibleCount, results.length);
  }

  isItemReserved(productLink) {
    // ✅ DETECCIÓN ESPECÍFICA para wallapop-badge
    const reservedBadges = productLink.querySelectorAll('wallapop-badge[badge-type="reserved"]');
    if (reservedBadges.length > 0) {
        return true;
    }

    // Fallback: buscar por atributo text
    const allBadges = productLink.querySelectorAll('wallapop-badge');
    for (const badge of allBadges) {
      const textAttr = badge.getAttribute('text') || '';
      if (textAttr === 'Reservado' || textAttr === 'Reserved') {
        return true;
      }
    }

    return false;
  }

  setFilterMode(mode) {
    console.log(`🔄 Cambiando filtro de '${this.filterMode}' a '${mode}'`);
    this.filterMode = mode;
    this.applyFilter();
    
    // Guardar preferencia
    chrome.storage.local.set({ filterMode: mode });
    
    // Actualizar indicador
    this.updateFilterIndicator();
  }

  addFilterIndicator() {
    // Remover indicador existente si existe
    if (this.filterIndicator) {
      this.filterIndicator.remove();
    }

    this.filterIndicator = document.createElement('div');
    this.filterIndicator.id = 'wallapop-filter-sidebar';
    this.filterIndicator.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      right: -280px !important;
      width: 280px !important;
      height: 100vh !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      box-shadow: -4px 0 20px rgba(0,0,0,0.3) !important;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    `;
    
    this.filterIndicator.innerHTML = `
      <div style="padding: 24px; height: 100%; display: flex; flex-direction: column;">
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img id="sidebar-logo" src="${chrome.runtime.getURL('icons/logo.png')}" style="
              width: 56px;
              height: 56px;
              transition: all 0.3s ease;
              filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
            " alt="Reserve Sniper Logo">
            <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Reserve Sniper</h2>
          </div>
          <button id="toggle-sidebar" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">◀</button>
        </div>
        
        <!-- Toggle Principal -->
        <div style="background: rgba(255,255,255,0.15); border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.2);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 600; font-size: 16px;">Extensión Activa</span>
            <label style="position: relative; display: inline-block; width: 60px; height: 30px;">
              <input type="checkbox" id="extension-toggle" checked style="opacity: 0; width: 0; height: 0;">
              <span id="toggle-slider" style="
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #4CAF50;
                transition: .3s;
                border-radius: 30px;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
              "></span>
              <span id="toggle-knob" style="
                position: absolute;
                content: '';
                height: 24px;
                width: 24px;
                left: 33px;
                bottom: 3px;
                background-color: white;
                transition: .3s;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></span>
            </label>
          </div>
          <div style="font-size: 13px; opacity: 0.9; line-height: 1.4;">
            Activa o desactiva el filtrado automático de productos
          </div>
        </div>
        
        <!-- Estado -->
        <div style="background: rgba(255,255,255,0.15); border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.2);">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📊 Estado</h3>
          <div style="font-size: 14px; line-height: 1.6;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <span style="opacity: 0.9;">Productos encontrados:</span>
              <span id="sidebar-results-count" style="font-weight: 600;">-</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <span style="opacity: 0.9;">Filtro actual:</span>
              <span id="sidebar-current-mode" style="font-weight: 600;">Todos</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="opacity: 0.9;">Estado:</span>
              <span id="sidebar-status" style="font-weight: 600;">Cargando...</span>
            </div>
          </div>
        </div>
        
        <!-- Filtros -->
        <div style="background: rgba(255,255,255,0.15); border-radius: 16px; padding: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.2);">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">🎯 Filtrar</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="sidebar-filter-btn" data-mode="all" style="
              background: rgba(255,255,255,0.2);
              border: 2px solid rgba(255,255,255,0.3);
              color: white;
              padding: 14px 16px;
              border-radius: 12px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s ease;
              text-align: left;
              display: flex;
              align-items: center;
              gap: 8px;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='translateX(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateX(0)'">
              <span>📋</span>
              <span>Mostrar Todos</span>
            </button>
            
            <button class="sidebar-filter-btn" data-mode="available" style="
              background: rgba(255,255,255,0.2);
              border: 2px solid rgba(255,255,255,0.3);
              color: white;
              padding: 14px 16px;
              border-radius: 12px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s ease;
              text-align: left;
              display: flex;
              align-items: center;
              gap: 8px;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='translateX(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateX(0)'">
              <span>✅</span>
              <span>Solo Disponibles</span>
            </button>
            
            <button class="sidebar-filter-btn" data-mode="reserved" style="
              background: rgba(255,255,255,0.2);
              border: 2px solid rgba(255,255,255,0.3);
              color: white;
              padding: 14px 16px;
              border-radius: 12px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s ease;
              text-align: left;
              display: flex;
              align-items: center;
              gap: 8px;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='translateX(-2px)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateX(0)'">
              <span>🔒</span>
              <span>Solo Reservados</span>
            </button>
          </div>
        </div>
        
         <!-- Guía de uso -->
         <div style="background: rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.15);">
           <div style="text-align: center;">
             <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">📖 ¿Necesitas ayuda?</div>
             <a href="#" id="github-guide-link" style="
               display: inline-flex;
               align-items: center;
               gap: 10px;
               background: rgba(255,255,255,0.2);
               color: white;
               padding: 12px 18px;
               border-radius: 25px;
               text-decoration: none;
               font-size: 13px;
               font-weight: 600;
               transition: all 0.2s ease;
               border: 1px solid rgba(255,255,255,0.3);
             " onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">
               <svg width="20" height="20" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
                 <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor"/>
               </svg>
               <span>Guía de Uso</span>
             </a>
             <div style="font-size: 11px; opacity: 0.8; margin-top: 6px;">Instrucciones completas en GitHub</div>
           </div>
         </div>
        
        <!-- Buy me a coffee -->
        <div style="background: rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; border: 1px solid rgba(255,255,255,0.15);">
          <div style="text-align: center;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">☕ ¿Te gusta Reserve Sniper?</div>
            <a href="https://buymeacoffee.com/martingodeg" target="_blank" style="
              display: inline-flex;
              align-items: center;
              gap: 10px;
              background: #FFDD00;
              color: #0D0C22;
              padding: 12px 18px;
              border-radius: 25px;
              text-decoration: none;
              font-size: 13px;
              font-weight: 600;
              transition: all 0.2s ease;
              box-shadow: 0 3px 10px rgba(255,221,0,0.3);
            " onmouseover="this.style.background='#FFE55C'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 5px 15px rgba(255,221,0,0.4)'" onmouseout="this.style.background='#FFDD00'; this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(255,221,0,0.3)'">
              <svg width="20" height="28" viewBox="0 0 27 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.3206 17.9122C12.9282 18.5083 11.3481 19.1842 9.30013 19.1842C8.44341 19.1824 7.59085 19.0649 6.76562 18.8347L8.18203 33.3768C8.23216 33.9847 8.50906 34.5514 8.95772 34.9645C9.40638 35.3776 9.994 35.6069 10.6039 35.6068C10.6039 35.6068 12.6122 35.7111 13.2823 35.7111C14.0036 35.7111 16.1662 35.6068 16.1662 35.6068C16.776 35.6068 17.3635 35.3774 17.8121 34.9643C18.2606 34.5512 18.5374 33.9846 18.5876 33.3768L20.1046 17.3073C19.4267 17.0757 18.7425 16.9219 17.9712 16.9219C16.6372 16.9214 15.5623 17.3808 14.3206 17.9122Z" fill="#FFDD00"/>
                <path d="M26.6584 10.3609L26.4451 9.28509C26.2537 8.31979 25.8193 7.40768 24.8285 7.05879C24.5109 6.94719 24.1505 6.89922 23.907 6.66819C23.6634 6.43716 23.5915 6.07837 23.5351 5.74565C23.4308 5.13497 23.3328 4.52377 23.2259 3.91413C23.1336 3.39002 23.0606 2.80125 22.8202 2.32042C22.5073 1.6748 21.858 1.29723 21.2124 1.04743C20.8815 0.923938 20.5439 0.819467 20.2012 0.734533C18.5882 0.308987 16.8922 0.152536 15.2328 0.0633591C13.241 -0.046547 11.244 -0.0134338 9.25692 0.162444C7.77794 0.296992 6.22021 0.459701 4.81476 0.971295C4.30108 1.15851 3.77175 1.38328 3.38115 1.78015C2.90189 2.26775 2.74544 3.02184 3.09537 3.62991C3.34412 4.06172 3.7655 4.3668 4.21242 4.56862C4.79457 4.82867 5.40253 5.02654 6.02621 5.15896C7.76282 5.54279 9.56148 5.6935 11.3356 5.75765C13.302 5.83701 15.2716 5.77269 17.2286 5.56521C17.7126 5.51202 18.1956 5.44822 18.6779 5.37382C19.2458 5.28673 19.6103 4.54411 19.4429 4.02678C19.2427 3.40828 18.7045 3.16839 18.0959 3.26173C18.0062 3.27581 17.917 3.28885 17.8273 3.30189L17.7626 3.31128C17.5565 3.33735 17.3503 3.36169 17.1441 3.38429C16.7182 3.43018 16.2913 3.46773 15.8633 3.49693C14.9048 3.56368 13.9437 3.59445 12.9831 3.59602C12.0391 3.59602 11.0947 3.56942 10.1529 3.50736C9.72314 3.4792 9.29447 3.44339 8.86684 3.39993C8.67232 3.37959 8.47832 3.35821 8.28432 3.33422L8.0997 3.31076L8.05955 3.30502L7.86816 3.27738C7.47703 3.21845 7.0859 3.15066 6.69895 3.06878C6.6599 3.06012 6.62498 3.03839 6.59994 3.0072C6.57491 2.976 6.56127 2.9372 6.56127 2.8972C6.56127 2.85721 6.57491 2.81841 6.59994 2.78721C6.62498 2.75602 6.6599 2.73429 6.69895 2.72563H6.70625C7.04158 2.65418 7.37951 2.59317 7.71849 2.53997C7.83148 2.52224 7.94482 2.50486 8.05851 2.48782H8.06164C8.27389 2.47374 8.48718 2.43567 8.69839 2.41064C10.536 2.2195 12.3845 2.15434 14.231 2.2156C15.1275 2.24168 16.0234 2.29435 16.9157 2.38509C17.1076 2.40491 17.2985 2.42577 17.4894 2.44923C17.5624 2.4581 17.6359 2.46853 17.7094 2.47739L17.8575 2.49878C18.2893 2.56309 18.7189 2.64115 19.1462 2.73293C19.7793 2.87061 20.5923 2.91546 20.8739 3.60906C20.9636 3.82913 21.0043 4.07371 21.0538 4.30474L21.1169 4.59939C21.1186 4.60467 21.1198 4.61008 21.1206 4.61555C21.2697 5.31089 21.4191 6.00623 21.5686 6.70157C21.5795 6.75293 21.5798 6.80601 21.5693 6.85748C21.5589 6.90895 21.5379 6.95771 21.5078 7.00072C21.4776 7.04373 21.4389 7.08007 21.3941 7.10747C21.3493 7.13487 21.2993 7.15274 21.2473 7.15997H21.2431L21.1519 7.17248L21.0617 7.18448C20.7759 7.22168 20.4897 7.25644 20.2033 7.28878C19.639 7.3531 19.0739 7.40872 18.5079 7.45566C17.3831 7.54918 16.2562 7.61055 15.127 7.63975C14.5516 7.65505 13.9763 7.66217 13.4013 7.66113C11.1124 7.65933 8.82553 7.5263 6.55188 7.2627C6.30574 7.2335 6.05959 7.20221 5.81344 7.1704C6.00431 7.19491 5.67472 7.15162 5.60797 7.14224C5.45152 7.12033 5.29506 7.09756 5.13861 7.07392C4.61346 6.99517 4.09144 6.89817 3.56733 6.81317C2.9337 6.70887 2.32771 6.76102 1.75458 7.07392C1.28413 7.33136 0.903361 7.72614 0.663078 8.20558C0.415886 8.71665 0.342354 9.2731 0.231796 9.82224C0.121237 10.3714 -0.0508594 10.9622 0.0143284 11.526C0.154613 12.7427 1.00518 13.7314 2.22863 13.9525C3.37959 14.1611 4.5368 14.3301 5.69714 14.474C10.2552 15.0323 14.8601 15.0991 19.4325 14.6733C19.8048 14.6385 20.1767 14.6006 20.548 14.5596C20.6639 14.5468 20.7813 14.5602 20.8914 14.5987C21.0016 14.6372 21.1017 14.6998 21.1845 14.782C21.2673 14.8642 21.3307 14.9639 21.37 15.0737C21.4093 15.1836 21.4235 15.3009 21.4116 15.4169L21.2958 16.5423C21.0625 18.8164 20.8292 21.0903 20.596 23.3641C20.3526 25.7519 20.1077 28.1395 19.8612 30.5269C19.7916 31.1993 19.7221 31.8715 19.6526 32.5436C19.5858 33.2054 19.5764 33.888 19.4507 34.542C19.2526 35.5704 18.5564 36.2019 17.5405 36.433C16.6098 36.6448 15.659 36.756 14.7045 36.7646C13.6464 36.7704 12.5888 36.7234 11.5307 36.7292C10.4011 36.7354 9.01755 36.6311 8.1456 35.7905C7.37951 35.052 7.27365 33.8958 7.16935 32.8961C7.03028 31.5725 6.89243 30.2491 6.75579 28.9259L5.98918 21.568L5.49324 16.8072C5.48489 16.7285 5.47655 16.6508 5.46873 16.5715C5.40927 16.0036 5.0072 15.4477 4.37357 15.4764C3.83121 15.5004 3.21479 15.9614 3.27841 16.5715L3.64607 20.1011L4.40642 27.4021C4.62302 29.4759 4.8391 31.5501 5.05465 33.6247C5.09637 34.022 5.13548 34.4205 5.17929 34.8179C5.41762 36.9894 7.07599 38.1596 9.12967 38.4892C10.3291 38.6822 11.5578 38.7218 12.775 38.7416C14.3353 38.7667 15.9113 38.8267 17.4461 38.544C19.7203 38.1268 21.4267 36.6082 21.6702 34.2526C21.7398 33.5725 21.8093 32.8923 21.8788 32.2119C22.11 29.9618 22.3409 27.7115 22.5714 25.4611L23.3255 18.1079L23.6713 14.7379C23.6885 14.5708 23.759 14.4137 23.8725 14.2898C23.986 14.1659 24.1363 14.0819 24.3012 14.0501C24.9515 13.9233 25.5732 13.7069 26.0357 13.212C26.7721 12.424 26.9187 11.3967 26.6584 10.3609ZM2.19525 11.0879C2.20516 11.0832 2.18691 11.1682 2.17909 11.2079C2.17752 11.1479 2.18065 11.0947 2.19525 11.0879ZM2.25836 11.5761C2.26357 11.5724 2.27921 11.5933 2.29538 11.6183C2.27087 11.5953 2.25523 11.5781 2.25783 11.5761H2.25836ZM2.32041 11.6579C2.34284 11.696 2.35483 11.72 2.32041 11.6579V11.6579ZM2.44505 11.7591H2.44818C2.44818 11.7627 2.45392 11.7664 2.456 11.7701C2.45255 11.766 2.4487 11.7624 2.44453 11.7591H2.44505ZM24.271 11.6079C24.0373 11.83 23.6853 11.9333 23.3375 11.9849C19.4366 12.5638 15.479 12.8569 11.5354 12.7275C8.71299 12.6311 5.92035 12.3176 3.12613 11.9229C2.85234 11.8843 2.55561 11.8342 2.36735 11.6324C2.01273 11.2517 2.18691 10.4851 2.27921 10.0251C2.3637 9.60373 2.52536 9.04207 3.02653 8.9821C3.80878 8.89031 4.71724 9.22042 5.49115 9.33776C6.4229 9.47996 7.35813 9.59382 8.29683 9.67935C12.303 10.0444 16.3765 9.98755 20.3649 9.45354C21.0919 9.35584 21.8163 9.24233 22.538 9.11299C23.181 8.99774 23.8939 8.78132 24.2825 9.44728C24.5489 9.90098 24.5844 10.508 24.5432 11.0207C24.5305 11.244 24.4329 11.4541 24.2705 11.6079H24.271Z" fill="#0D0C22"/>
              </svg>
              <span>Invítame a un café</span>
            </a>
            <div style="font-size: 11px; opacity: 0.8; margin-top: 6px;">¡Ayuda a mantener la extensión!</div>
          </div>
        </div>
        
        
        
      </div>
      
      </div>
    `;
    
    document.body.appendChild(this.filterIndicator);
    
    // Crear tab separado para abrir el sidebar
    this.sidebarTab = document.createElement('div');
    this.sidebarTab.id = 'wallapop-filter-tab';
    this.sidebarTab.style.cssText = `
      position: fixed !important;
      right: 0px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 16px 10px !important;
      border-radius: 16px 0 0 16px !important;
      cursor: pointer !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      box-shadow: -4px 0 15px rgba(0,0,0,0.3) !important;
      transition: all 0.3s ease !important;
      z-index: 999998 !important;
      min-width: 60px !important;
      width: 60px !important;
      text-align: center !important;
      line-height: 1.3 !important;
      user-select: none !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
    `;
    
    this.sidebarTab.innerHTML = `
      <img src="${chrome.runtime.getURL('icons/logo.png')}" style="
        width: 42px;
        height: 42px;
        margin-bottom: 6px;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));
        transition: all 0.3s ease;
      " alt="Reserve Sniper">
      <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.3px; line-height: 1.1; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
        RESERVE<br>SNIPER
      </div>
    `;
    
    // Efectos hover para el tab con cambio de icono
    this.sidebarTab.addEventListener('mouseenter', () => {
      this.sidebarTab.style.right = '5px';
      this.sidebarTab.style.boxShadow = '-6px 0 20px rgba(0,0,0,0.4)';
      this.sidebarTab.style.transform = 'translateY(-50%) scale(1.05)';
      
      // Cambiar a mafiaIcon en hover
      const tabImg = this.sidebarTab.querySelector('img');
      if (tabImg) {
        tabImg.src = chrome.runtime.getURL('icons/mafiaIcon.png');
      }
    });
    
    this.sidebarTab.addEventListener('mouseleave', () => {
      this.sidebarTab.style.right = '0px';
      this.sidebarTab.style.boxShadow = '-4px 0 15px rgba(0,0,0,0.3)';
      this.sidebarTab.style.transform = 'translateY(-50%) scale(1)';
      
      // Volver al icono según el filtro actual
      this.updateTabIcon();
    });
    
    document.body.appendChild(this.sidebarTab);
    this.setupSidebarEvents();
    
    // Actualizar estado cada 2 segundos
    setInterval(() => {
      if (this.isInitialized) {
        this.updateFilterIndicator();
      }
    }, 2000);
  }

  getModeText(mode) {
    const modeTexts = {
      'all': 'Todos',
      'available': 'Disponibles',
      'reserved': 'Reservados'
    };
    return modeTexts[mode] || mode;
  }

  updateFilterIndicator(visibleCount = null, totalCount = null) {
    if (!this.filterIndicator) return;

    // Actualizar estado en el sidebar
    const resultsElement = this.filterIndicator.querySelector('#sidebar-results-count');
    const modeElement = this.filterIndicator.querySelector('#sidebar-current-mode');
    const statusElement = this.filterIndicator.querySelector('#sidebar-status');

    // Calcular valores actuales si no se proporcionan
    if (visibleCount === null || totalCount === null) {
      const currentResults = this.getSearchResults();
      totalCount = currentResults.length;
      visibleCount = 0;
      
      currentResults.forEach(product => {
        const card = product.closest('article, li, [data-testid="item-card"], .ItemCard, .item-card, [class*="ItemCard"], [class*="Card"]') || product;
        if (card.style.display !== 'none') {
          visibleCount++;
        }
      });
    }

    if (resultsElement) {
      resultsElement.textContent = `${totalCount}`;
    }

    if (modeElement) {
      modeElement.textContent = this.getModeText(this.filterMode);
    }

    if (statusElement) {
      if (!this.extensionEnabled) {
        statusElement.textContent = '❌ Desconectado';
      } else if (this.isInitialized) {
        statusElement.textContent = `${visibleCount}/${totalCount} visibles`;
      } else {
        statusElement.textContent = '⏳ Cargando...';
      }
    }

    // Actualizar botones activos
    const buttons = this.filterIndicator.querySelectorAll('.sidebar-filter-btn');
    buttons.forEach(button => {
      const isActive = button.dataset.mode === this.filterMode;
      if (isActive) {
        button.style.background = 'rgba(255,255,255,0.4)';
        button.style.borderColor = 'rgba(255,255,255,0.6)';
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      } else {
        button.style.background = 'rgba(255,255,255,0.2)';
        button.style.borderColor = 'rgba(255,255,255,0.3)';
        button.style.boxShadow = 'none';
      }
    });

    // Actualizar iconos según el filtro
    this.updateTabIcon();
    this.updateSidebarIcon();
  }

  updateTabIcon() {
    if (!this.sidebarTab) return;
    
    const tabImg = this.sidebarTab.querySelector('img');
    if (!tabImg) return;

    let iconSrc = 'icons/logo.png'; // Por defecto

    if (!this.extensionEnabled) {
      iconSrc = 'icons/logo.png';
    } else {
      switch (this.filterMode) {
        case 'reserved':
          iconSrc = 'icons/iconHaunt.png';
          break;
        case 'available':
          iconSrc = 'icons/mafiaIcon.png';
          break;
        default:
          iconSrc = 'icons/logo.png';
      }
    }

    // Efecto de cambio de icono con animación en el tab
    tabImg.style.transform = 'scale(0.7)';
    tabImg.style.opacity = '0.6';
    
    setTimeout(() => {
      tabImg.src = chrome.runtime.getURL(iconSrc);
      tabImg.style.transform = 'scale(1)';
      tabImg.style.opacity = '1';
    }, 150);
  }

  updateSidebarIcon() {
    if (!this.filterIndicator) return;
    
    const sidebarImg = this.filterIndicator.querySelector('#sidebar-logo');
    if (!sidebarImg) return;

    let iconSrc = 'icons/logo.png'; // Por defecto

    if (!this.extensionEnabled) {
      iconSrc = 'icons/logo.png';
    } else {
      switch (this.filterMode) {
        case 'reserved':
          iconSrc = 'icons/iconHaunt.png';
          break;
        case 'available':
          iconSrc = 'icons/mafiaIcon.png';
          break;
        default:
          iconSrc = 'icons/logo.png';
      }
    }

    // Efecto de cambio de icono con animación
    sidebarImg.style.transform = 'scale(0.8)';
    sidebarImg.style.opacity = '0.7';
    
    setTimeout(() => {
      sidebarImg.src = chrome.runtime.getURL(iconSrc);
      sidebarImg.style.transform = 'scale(1)';
      sidebarImg.style.opacity = '1';
    }, 150);
  }

  setupSidebarEvents() {
    if (!this.filterIndicator) return;

    // Toggle sidebar
    const toggleBtn = this.filterIndicator.querySelector('#toggle-sidebar');
    let isOpen = false;

    const toggleSidebar = () => {
      isOpen = !isOpen;
      if (isOpen) {
        // Abrir sidebar
        this.filterIndicator.style.right = '0px';
        if (toggleBtn) toggleBtn.textContent = '▶';
        if (this.sidebarTab) this.sidebarTab.style.display = 'none';
        console.log('📂 Sidebar abierto');
      } else {
        // Cerrar sidebar
        this.filterIndicator.style.right = '-280px';
        if (toggleBtn) toggleBtn.textContent = '◀';
        if (this.sidebarTab) this.sidebarTab.style.display = 'block';
        console.log('📁 Sidebar cerrado');
      }
    };

    // Eventos para abrir/cerrar
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleSidebar);
    }

    if (this.sidebarTab) {
      this.sidebarTab.addEventListener('click', toggleSidebar);
    }

    // Toggle de extensión
    const extensionToggle = this.filterIndicator.querySelector('#extension-toggle');
    const toggleSlider = this.filterIndicator.querySelector('#toggle-slider');
    const toggleKnob = this.filterIndicator.querySelector('#toggle-knob');

    if (extensionToggle) {
      extensionToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        
        this.extensionEnabled = isEnabled;
        
        if (isEnabled) {
          // Activar extensión
          this.applyFilter();
          toggleSlider.style.background = '#4CAF50';
          toggleKnob.style.left = '33px';
          console.log('✅ Extensión activada');
        } else {
          // Desactivar extensión - mostrar todos los productos
          const products = this.getSearchResults();
          products.forEach(product => {
            const card = product.closest('article, li, [data-testid="item-card"], .ItemCard, .item-card, [class*="ItemCard"], [class*="Card"]') || product;
            card.style.setProperty("display", "block", "important");
          });
          toggleSlider.style.background = '#ccc';
          toggleKnob.style.left = '3px';
          
          console.log('❌ Extensión desactivada - mostrando todos los productos');
        }
        
        // Guardar estado
        chrome.storage.local.set({ extensionEnabled: isEnabled });
        
        // Actualizar indicador después del cambio
        setTimeout(() => {
          this.updateFilterIndicator();
        }, 100);
      });
    }

    // Botones de filtro
    const filterButtons = this.filterIndicator.querySelectorAll('.sidebar-filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode;
        
        // Verificar si la extensión está activa
        const isEnabled = extensionToggle ? extensionToggle.checked : true;
        if (!isEnabled) {
          console.log('⚠️ Extensión desactivada, activando automáticamente...');
          if (extensionToggle) {
            extensionToggle.checked = true;
            extensionToggle.dispatchEvent(new Event('change'));
          }
        }
        
        this.setFilterMode(mode);
        console.log(`🎯 Filtro cambiado a: ${mode}`);
      });
    });

    // Enlace de GitHub
    const githubLink = this.filterIndicator.querySelector('#github-guide-link');
    if (githubLink) {
      githubLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Aquí puedes poner tu URL de GitHub cuando la tengas
        console.log('📚 Redirigiendo a GitHub para guía de uso...');
        window.open('https://github.com/MartinGoDev/Reserve-Sniper-Extension?tab=readme-ov-file', '_blank');
      });
    }

    console.log('🎛️ Eventos del sidebar configurados');
  }

  setupMessageListener() {
    // Escuchar mensajes del popup y responder siempre
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📨 Mensaje recibido en content script:', request);
      
      try {
      if (request.action === 'setFilter') {
          console.log(`🔄 Aplicando filtro: ${request.mode}`);
        this.setFilterMode(request.mode);
        sendResponse({ success: true, mode: this.filterMode });
      } else if (request.action === 'getStatus') {
        const results = this.getSearchResults();
          const status = { 
          success: true, 
          filterMode: this.filterMode,
          totalResults: results.length,
          isInitialized: this.isInitialized
          };
          console.log('📤 Enviando estado:', status);
          sendResponse(status);
        } else {
          console.log('⚠️ Acción no reconocida:', request.action);
          sendResponse({ success: false, error: 'Acción no reconocida' });
        }
      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        sendResponse({ success: false, error: error.message });
      }
      
      // IMPORTANTE: Siempre devolver true para mantener el canal abierto
      return true;
    });
    
    console.log('📡 Message listener configurado');
  }

  debugResults() {
    console.log('🔍 ===== DEBUG WALLAPOP FILTER =====');
    
    const results = this.getSearchResults();
    console.log(`📊 Total de resultados encontrados: ${results.length}`);
    
    if (results.length === 0) {
      console.log('❌ No se encontraron resultados');
      return;
    }
    
    let reservedCount = 0;
    let availableCount = 0;
    
    results.forEach((item, index) => {
      const isReserved = this.isItemReserved(item);
      if (isReserved) reservedCount++;
      else availableCount++;
      
      if (index < 5) {
        console.log(`📦 Producto ${index + 1}:`, {
          reserved: isReserved,
          url: item.href,
          title: item.querySelector('h3')?.textContent || 'Sin título'
        });
      }
    });
    
    console.log(`📊 Resumen:`);
    console.log(`  - Disponibles: ${availableCount}`);
    console.log(`  - Reservados: ${reservedCount}`);
    console.log(`  - Filtro actual: ${this.filterMode}`);
    
    return {
      total: results.length,
      reserved: reservedCount,
      available: availableCount,
      filterMode: this.filterMode
    };
  }
}

// Inicializar la extensión
let wallapopFilter;

function initializeFilter() {
  if (wallapopFilter) {
    console.log('🔄 Reinicializando filtro...');
  }
  
  wallapopFilter = new WallapopFilter();
  
  // Exponer para debugging
  window.wallapopFilter = wallapopFilter;
}

// Inicializar según el estado del documento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFilter);
} else {
  initializeFilter();
}

// Reinicializar en navegación SPA
window.addEventListener('popstate', () => {
  setTimeout(initializeFilter, 500);
});

// Funcionalidad de debug (solo para desarrollo)
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.shiftKey && e.key === 'D' && wallapopFilter) {
    e.preventDefault();
    wallapopFilter.debugResults();
    console.log('🔍 Debug activado');
  }
});

// Funciones de debug globales
setTimeout(() => {
  window.testReservedFilter = function() {
    console.log('🧪 TEST MANUAL DE FILTRO RESERVADOS:');
    const products = document.querySelectorAll('.item-card_ItemCard--vertical__CNrfk');
    const reserved = document.querySelectorAll('wallapop-badge[badge-type="reserved"]');
    console.log(`📦 Productos: ${products.length}`);
    console.log(`🔒 Reservados: ${reserved.length}`);
    
    let visibleCount = 0;
    products.forEach(product => {
      const isReserved = product.querySelector('wallapop-badge[badge-type="reserved"]');
      const card = product.closest('article, li, [data-testid="item-card"], .ItemCard, .item-card, [class*="ItemCard"], [class*="Card"]') || product;
      
      if (isReserved) {
        card.style.setProperty("display", "block", "important");
        visibleCount++;
        console.log(`✅ Mostrando reservado: ${product.href}`);
      } else {
        card.style.setProperty("display", "none", "important");
      }
    });
    
    console.log(`🎯 Filtro aplicado: ${visibleCount} productos visibles`);
    return { total: products.length, reserved: reserved.length, visible: visibleCount };
  };

  window.showAllProducts = function() {
    const products = document.querySelectorAll('.item-card_ItemCard--vertical__CNrfk');
    products.forEach(product => {
      const card = product.closest('article, li, [data-testid="item-card"], .ItemCard, .item-card, [class*="ItemCard"], [class*="Card"]') || product;
      card.style.setProperty("display", "block", "important");
    });
    console.log(`🎯 Mostrando todos los ${products.length} productos`);
  };
}, 1000);

console.log('✅ Reserve Sniper Extension cargado');
console.log('🎯 Usa el menú lateral para filtrar productos');
console.log('🧪 Test manual: testReservedFilter()');
console.log('🧪 Mostrar todos: showAllProducts()');
console.log('🔍 Debug: Alt+Shift+D');
