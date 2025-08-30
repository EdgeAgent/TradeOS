// Main application initialization for TRADE OS

class TradeOSApp {
  constructor() {
    this.version = '1.0.0';
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      console.log('Initializing TRADE OS v' + this.version);
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.startup());
      } else {
        await this.startup();
      }

    } catch (error) {
      console.error('Failed to initialize TRADE OS:', error);
      this.showCriticalError(error);
    }
  }

  async startup() {
    try {
      // Show loading indicator
      this.showLoadingScreen();

      // Initialize database connection
      await this.initializeDatabase();

      // Load user preferences
      await this.loadUserPreferences();

      // Initialize all managers
      this.initializeManagers();

      // Setup global event handlers
      this.setupGlobalHandlers();

      // Load initial data
      await this.loadInitialData();

      // Hide loading screen
      this.hideLoadingScreen();

      // Mark as initialized
      this.initialized = true;

      console.log('TRADE OS initialized successfully');

    } catch (error) {
      console.error('Startup error:', error);
      this.showCriticalError(error);
    }
  }

  showLoadingScreen() {
    const loadingHTML = `
      <div id="loading-screen" class="loading-screen">
        <div class="loading-content">
          <div class="logo">
            <i class="fas fa-tools"></i>
            <span>TRADE OS</span>
          </div>
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p>Loading your workspace...</p>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', loadingHTML);
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.remove();
      }, 300);
    }
  }

  async initializeDatabase() {
    // Database is initialized in main.js, just verify connection
    try {
      await window.db.getSetting('company_name');
      console.log('Database connection verified');
    } catch (error) {
      throw new Error('Database connection failed: ' + error.message);
    }
  }

  async loadUserPreferences() {
    try {
      // Load and apply dark mode preference
      const darkMode = await window.db.getSetting('dark_mode') === 'true';
      if (darkMode) {
        document.body.classList.add('dark-mode');
      }

      // Load other preferences
      const autoBackup = await window.db.getSetting('auto_backup') === 'true';
      if (autoBackup) {
        this.scheduleAutoBackup();
      }

    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }

  initializeManagers() {
    // Managers are already initialized in their respective files
    // This is just a verification step
    const requiredManagers = [
      'ui', 'quotesManager', 'jobsManager', 'clientsManager', 
      'scheduleManager', 'invoicesManager', 'settingsManager'
    ];

    for (const manager of requiredManagers) {
      if (!window[manager]) {
        console.warn(`Manager ${manager} not found`);
      }
    }

    console.log('All managers initialized');
  }

  setupGlobalHandlers() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N for new quote
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        window.ui.showQuoteModal();
      }

      // Ctrl/Cmd + J for new job
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        window.ui.showJobModal();
      }

      // Ctrl/Cmd + , for settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        window.ui.switchView('settings');
      }

      // F5 to refresh current view
      if (e.key === 'F5') {
        e.preventDefault();
        this.refreshCurrentView();
      }
    });

    // Global error handler
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      this.handleGlobalError(e.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      this.handleGlobalError(e.reason);
    });

    // Window focus/blur handlers for auto-save
    window.addEventListener('blur', () => {
      this.autoSave();
    });

    // Prevent accidental navigation
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });

    console.log('Global handlers setup complete');
  }

  async loadInitialData() {
    try {
      // Pre-load essential data for better performance
      await Promise.all([
        window.db.getClients(),
        window.db.getDashboardStats()
      ]);

      console.log('Initial data loaded');
    } catch (error) {
      console.warn('Failed to load initial data:', error);
    }
  }

  async refreshCurrentView() {
    if (window.ui && window.ui.currentView) {
      await window.ui.loadViewData(window.ui.currentView);
      window.ui.showNotification('View refreshed', 'info');
    }
  }

  handleGlobalError(error) {
    // Don't show notifications for every error, just log them
    console.error('Application error:', error);
    
    // Only show critical errors to user
    if (error.message && error.message.includes('Database')) {
      window.ui?.showNotification('Database error occurred. Please restart the application.', 'error');
    }
  }

  showCriticalError(error) {
    const errorHTML = `
      <div id="critical-error" class="critical-error">
        <div class="error-content">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2>Critical Error</h2>
          <p>TRADE OS encountered a critical error and cannot continue.</p>
          <div class="error-details">
            <strong>Error:</strong> ${error.message || 'Unknown error'}
          </div>
          <div class="error-actions">
            <button onclick="location.reload()" class="btn btn-primary">
              <i class="fas fa-redo"></i> Restart Application
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.innerHTML = errorHTML;
  }

  // Auto-save functionality
  async autoSave() {
    if (!this.initialized) return;

    try {
      // Auto-save any pending changes
      // This would be implemented based on specific needs
      console.log('Auto-save triggered');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  hasUnsavedChanges() {
    // Check if there are any unsaved changes
    // This would be implemented based on specific needs
    return false;
  }

  // Auto-backup functionality
  scheduleAutoBackup() {
    // Schedule automatic backups
    const backupInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(async () => {
      try {
        await window.settingsManager.exportData();
        console.log('Auto-backup completed');
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, backupInterval);
  }

  // Application lifecycle methods
  async shutdown() {
    try {
      console.log('Shutting down TRADE OS...');
      
      // Save any pending changes
      await this.autoSave();
      
      // Close database connections
      // This would be handled by the main process
      
      console.log('TRADE OS shutdown complete');
    } catch (error) {
      console.error('Shutdown error:', error);
    }
  }

  // Utility methods
  getVersion() {
    return this.version;
  }

  isInitialized() {
    return this.initialized;
  }

  // Development helpers
  enableDebugMode() {
    window.DEBUG = true;
    console.log('Debug mode enabled');
    
    // Add debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.innerHTML = `
      <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; z-index: 10000;">
        <div>TRADE OS v${this.version} - DEBUG MODE</div>
        <div>View: <span id="debug-current-view">${window.ui?.currentView || 'none'}</span></div>
        <div>Memory: <span id="debug-memory">-</span></div>
      </div>
    `;
    document.body.appendChild(debugPanel);

    // Update debug info periodically
    setInterval(() => {
      const currentViewSpan = document.getElementById('debug-current-view');
      const memorySpan = document.getElementById('debug-memory');
      
      if (currentViewSpan) {
        currentViewSpan.textContent = window.ui?.currentView || 'none';
      }
      
      if (memorySpan && window.performance && window.performance.memory) {
        const memory = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
        memorySpan.textContent = `${memory}MB`;
      }
    }, 1000);
  }

  // Performance monitoring
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  async measureAsyncPerformance(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    return result;
  }
}

// Initialize the application
window.tradeOS = new TradeOSApp();

// Add some CSS for loading screen and critical error
const appStyles = `
<style>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  transition: opacity 0.3s ease;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-content .logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
}

.loading-content .logo i {
  font-size: 2.5rem;
  color: var(--accent-orange);
}

.loading-spinner {
  margin: 2rem 0;
}

.loading-spinner .spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.critical-error {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.error-content {
  text-align: center;
  max-width: 500px;
  padding: 2rem;
}

.error-icon {
  font-size: 4rem;
  color: var(--accent-red);
  margin-bottom: 1rem;
}

.error-details {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  text-align: left;
}

.error-actions {
  margin-top: 2rem;
}

/* Dark mode styles */
.dark-mode {
  --gray-50: #1f2937;
  --gray-100: #374151;
  --gray-200: #4b5563;
  --gray-300: #6b7280;
  --gray-400: #9ca3af;
  --gray-500: #d1d5db;
  --gray-600: #e5e7eb;
  --gray-700: #f3f4f6;
  --gray-800: #f9fafb;
  --gray-900: #ffffff;
}

.dark-mode .sidebar {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
}

.dark-mode .main-content {
  background-color: var(--gray-50);
}

.dark-mode .header {
  background-color: var(--gray-100);
  border-bottom-color: var(--gray-200);
}

.dark-mode .card,
.dark-mode .stat-card,
.dark-mode .dashboard-section {
  background-color: var(--gray-100);
  border-color: var(--gray-200);
}

/* Notification styles */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 1rem 1.5rem;
  max-width: 400px;
  z-index: 10000;
  animation: slideInRight 0.3s ease;
}

.notification-info {
  border-left: 4px solid var(--info);
}

.notification-success {
  border-left: 4px solid var(--success);
}

.notification-warning {
  border-left: 4px solid var(--warning);
}

.notification-error {
  border-left: 4px solid var(--error);
}

.notification-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.notification-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--gray-500);
  padding: 0;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', appStyles);

