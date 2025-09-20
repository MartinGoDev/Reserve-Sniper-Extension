# 🎯 Reserve Sniper - Chrome Extension

Una extensión de Chrome que te permite filtrar productos en Wallapop como un francotirador, mostrando solo los productos disponibles, reservados o todos según tu preferencia.

![Reserve Sniper Logo](icons/logo.png)

## ✨ Características

- **🎯 Filtrado Inteligente**: Filtra productos por estado de reserva en tiempo real
- **📱 Interfaz Intuitiva**: Sidebar lateral con controles fáciles de usar
- **🔄 Actualización Automática**: Se adapta automáticamente a nuevos productos cargados
- **⚡ Toggle On/Off**: Activa o desactiva la extensión cuando quieras
- **🎨 Iconos Dinámicos**: Cambian según el filtro activo
- **📊 Estadísticas en Tiempo Real**: Ve cuántos productos están visibles vs ocultos

## 🚀 Instalación

### Desde el código fuente (Desarrolladores)

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/MartinGoDev/Reserve-Sniper-Extension.git
   cd Reserve-Sniper-Extension
   ```

2. **Abre Chrome** y ve a `chrome://extensions/`

3. **Habilita el modo desarrollador** (toggle en la esquina superior derecha)

4. **Haz clic en "Cargar descomprimida"**

5. **Selecciona la carpeta del proyecto**

6. **¡Listo!** La extensión aparecerá en tu barra de herramientas

## 📖 Uso

### Activación
1. Ve a [Wallapop](https://www.wallapop.com) y busca productos
2. Verás un **tab lateral** en el lado derecho de la pantalla
3. Haz clic en el tab para abrir el **panel de control**

### Filtros Disponibles

- **📋 Mostrar Todos**: Muestra todos los productos (sin filtro)
- **✅ Solo Disponibles**: Muestra únicamente productos disponibles para compra
- **🔒 Solo Reservados**: Muestra únicamente productos que están reservados

### Controles

- **Toggle Principal**: Activa/desactiva toda la extensión
- **Botones de Filtro**: Cambia entre los diferentes modos de visualización
- **Estadísticas**: Ve cuántos productos están siendo mostrados

## 🛠️ Tecnologías

- **Manifest V3**: Última versión de extensiones de Chrome
- **JavaScript ES6+**: Código moderno y eficiente
- **CSS3**: Estilos avanzados con gradientes y animaciones
- **Chrome APIs**: Storage, Tabs, Runtime
- **MutationObserver**: Detección automática de cambios en la página

## 📁 Estructura del Proyecto

```
Reserve-Sniper-Extension/
├── manifest.json          # Configuración de la extensión
├── popup.html             # Interfaz del popup
├── popup.js               # Lógica del popup
├── content.js             # Script principal (inyectado en Wallapop)
├── styles.css             # Estilos adicionales
└── icons/                 # Iconos de la extensión
    ├── logo.png           # Logo principal
    ├── mafiaIcon.png      # Icono para modo disponible
    ├── iconHaunt.png      # Icono para modo reservado
    └── [otros iconos...]
```

## 🔧 Funcionalidades Técnicas

### Detección de Productos
- Utiliza selectores específicos de Wallapop: `.item-card_ItemCard--vertical__CNrfk`
- Fallback a selectores genéricos para mayor compatibilidad
- Observer para detectar productos cargados dinámicamente

### Detección de Estado de Reserva
- Busca elementos `wallapop-badge[badge-type="reserved"]`
- Verifica atributos de texto para "Reservado" o "Reserved"
- Sistema robusto que se adapta a cambios en la estructura de Wallapop

### Gestión de Estado
- Almacenamiento local con Chrome Storage API
- Persistencia de preferencias entre sesiones
- Comunicación bidireccional entre popup y content script

## 🎨 Características de UI/UX

### Sidebar Lateral
- Diseño moderno con gradientes
- Animaciones suaves de entrada/salida
- Responsive y optimizado para diferentes resoluciones

### Iconos Dinámicos
- Cambian según el filtro activo:
  - 🎯 Logo normal para "Todos"
  - 👔 Mafia icon para "Disponibles"
  - 👻 Haunt icon para "Reservados"

### Feedback Visual
- Estadísticas en tiempo real
- Notificaciones de estado
- Indicadores de carga

## 🐛 Debugging y Desarrollo

### Logs de Consola
La extensión incluye logging detallado para facilitar el debugging:
```javascript
console.log('🚀 Reserve Sniper iniciado');
console.log('🔍 Encontrados X resultados de búsqueda');
console.log('📊 Filtro aplicado: X visibles, Y ocultos');
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si quieres mejorar la extensión:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Ideas para Contribuir
- Mejoras en la detección de productos
- Nuevos filtros (precio, ubicación, etc.)
- Optimizaciones de rendimiento
- Mejoras en la UI/UX
- Soporte para otros sitios de segunda mano

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## ☕ Apoyo

Si te gusta esta extensión y quieres apoyar el desarrollo:

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-☕-yellow.svg)](https://buymeacoffee.com/martingodeg)

## 🐛 Reportar Bugs

Si encuentras algún bug o tienes sugerencias:

1. Ve a la sección [Issues](https://github.com/MartinGoDev/Reserve-Sniper-Extension/issues)
2. Crea un nuevo issue
3. Describe el problema detalladamente
4. Incluye pasos para reproducir el error

## 📞 Contacto

- **Desarrollador**: MartinGoDev
- **GitHub**: [@MartinGoDev](https://github.com/MartinGoDev)
- **Linkedin**: [Martin Gonzalez](https://www.linkedin.com/in/martin-gonzalez-fernandez-258559142/)
- **Buy Me a Coffee**: [martingodeg](https://buymeacoffee.com/martingodeg)


---

**¡Disfruta cazando las mejores ofertas en Wallapop con Reserve Sniper! 🎯**
