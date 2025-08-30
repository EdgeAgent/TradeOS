// Settings management module for TRADE OS

class SettingsManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.matches('.tab-btn')) {
        this.switchTab(e.target.dataset.tab);
      }
    });

    // AI provider selection
    document.addEventListener('change', (e) => {
      if (e.target.id === 'ai-provider') {
        this.toggleAIProviderConfig(e.target.value);
      }
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  toggleAIProviderConfig(provider) {
    const openaiConfig = document.getElementById('openai-config');
    const groqConfig = document.getElementById('groq-config');

    if (provider === 'openai') {
      openaiConfig.style.display = 'block';
      groqConfig.style.display = 'none';
    } else if (provider === 'groq') {
      openaiConfig.style.display = 'none';
      groqConfig.style.display = 'block';
    }
  }

  async loadSettings() {
    try {
      // Load company settings
      await this.loadCompanySettings();
      
      // Load AI settings
      await this.loadAISettings();
      
      // Load preferences
      await this.loadPreferences();
      
      // Setup form handlers
      this.setupFormHandlers();

    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadCompanySettings() {
    const companyForm = document.getElementById('company-form');
    if (!companyForm) return;

    const settings = [
      'company_name', 'company_email', 'company_phone', 
      'company_address', 'tax_rate', 'default_profit_margin'
    ];

    for (const setting of settings) {
      const value = await window.db.getSetting(setting);
      const input = companyForm.querySelector(`[name="${setting}"]`);
      if (input && value) {
        input.value = value;
      }
    }
  }

  async loadAISettings() {
    const aiForm = document.getElementById('ai-form');
    if (!aiForm) return;

    // Load AI provider
    const aiProvider = await window.db.getSetting('ai_provider') || 'openai';
    document.getElementById('ai-provider').value = aiProvider;
    this.toggleAIProviderConfig(aiProvider);

    // Load API keys
    const openaiKey = await window.db.getSetting('openai_api_key');
    const groqKey = await window.db.getSetting('groq_api_key');

    if (openaiKey) {
      document.getElementById('openai-api-key').value = openaiKey;
    }
    if (groqKey) {
      document.getElementById('groq-api-key').value = groqKey;
    }
  }

  async loadPreferences() {
    const preferencesForm = document.getElementById('preferences-form');
    if (!preferencesForm) return;

    // Load preferences (these would be stored in settings table)
    const darkMode = await window.db.getSetting('dark_mode') === 'true';
    const autoBackup = await window.db.getSetting('auto_backup') === 'true';
    const backupFrequency = await window.db.getSetting('backup_frequency') || 'weekly';

    document.getElementById('dark-mode').checked = darkMode;
    document.getElementById('auto-backup').checked = autoBackup;
    document.getElementById('backup-frequency').value = backupFrequency;
  }

  setupFormHandlers() {
    // Company form
    const companyForm = document.getElementById('company-form');
    if (companyForm) {
      companyForm.addEventListener('submit', (e) => this.handleCompanySubmit(e));
    }

    // AI form
    const aiForm = document.getElementById('ai-form');
    if (aiForm) {
      aiForm.addEventListener('submit', (e) => this.handleAISubmit(e));
    }

    // AI test button
    const testAIBtn = document.getElementById('test-ai-btn');
    if (testAIBtn) {
      testAIBtn.addEventListener('click', () => this.testAIConnection());
    }

    // Preferences form
    const preferencesForm = document.getElementById('preferences-form');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (e) => this.handlePreferencesSubmit(e));
    }
  }

  async handleCompanySubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      // Save each setting
      const settings = [
        'company_name', 'company_email', 'company_phone', 
        'company_address', 'tax_rate', 'default_profit_margin'
      ];

      for (const setting of settings) {
        const value = formData.get(setting);
        if (value !== null) {
          await window.db.setSetting(setting, value);
        }
      }

      window.ui.showNotification('Company settings saved successfully', 'success');

    } catch (error) {
      console.error('Error saving company settings:', error);
      window.ui.showNotification('Failed to save company settings', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Company Settings';
    }
  }

  async handleAISubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      // Save AI provider
      const aiProvider = formData.get('ai_provider');
      await window.db.setSetting('ai_provider', aiProvider);

      // Save API keys
      const openaiKey = formData.get('openai_api_key');
      const groqKey = formData.get('groq_api_key');

      if (openaiKey) {
        await window.db.setSetting('openai_api_key', openaiKey);
      }
      if (groqKey) {
        await window.db.setSetting('groq_api_key', groqKey);
      }

      window.ui.showNotification('AI settings saved successfully', 'success');

    } catch (error) {
      console.error('Error saving AI settings:', error);
      window.ui.showNotification('Failed to save AI settings', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save AI Settings';
    }
  }

  async testAIConnection() {
    const testBtn = document.getElementById('test-ai-btn');
    const resultDiv = document.getElementById('ai-test-result');

    try {
      testBtn.disabled = true;
      testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
      
      resultDiv.textContent = 'Testing AI connection...';
      resultDiv.className = 'test-result';

      // Test with a simple prompt
      const testPrompt = 'Generate a simple quote for painting a 10x12 room.';
      const result = await window.db.generateQuote(testPrompt);

      if (result && result.items && result.items.length > 0) {
        resultDiv.textContent = `✓ AI connection successful! Generated ${result.items.length} quote items.`;
        resultDiv.className = 'test-result success';
      } else {
        throw new Error('AI returned empty or invalid response');
      }

    } catch (error) {
      console.error('AI test error:', error);
      resultDiv.textContent = `✗ AI connection failed: ${error.message}`;
      resultDiv.className = 'test-result error';
    } finally {
      testBtn.disabled = false;
      testBtn.innerHTML = '<i class="fas fa-flask"></i> Test AI Connection';
    }
  }

  async handlePreferencesSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      // Save preferences
      const darkMode = formData.has('dark_mode');
      const autoBackup = formData.has('auto_backup');
      const backupFrequency = formData.get('backup_frequency');

      await window.db.setSetting('dark_mode', darkMode.toString());
      await window.db.setSetting('auto_backup', autoBackup.toString());
      await window.db.setSetting('backup_frequency', backupFrequency);

      // Apply dark mode immediately
      this.applyDarkMode(darkMode);

      window.ui.showNotification('Preferences saved successfully', 'success');

    } catch (error) {
      console.error('Error saving preferences:', error);
      window.ui.showNotification('Failed to save preferences', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Preferences';
    }
  }

  applyDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  // Data management functions
  async exportData() {
    try {
      const data = {
        clients: await window.db.getClients(),
        jobs: await window.db.getJobs(),
        quotes: await window.db.getQuotes(),
        invoices: await window.db.getInvoices(),
        expenses: await window.db.getExpenses(),
        schedule: await window.db.getScheduleEvents('2020-01-01', '2030-12-31'),
        exported_at: new Date().toISOString()
      };

      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `trade-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.ui.showNotification('Data exported successfully', 'success');

    } catch (error) {
      console.error('Error exporting data:', error);
      window.ui.showNotification('Failed to export data', 'error');
    }
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data.clients || !data.jobs || !data.quotes) {
        throw new Error('Invalid backup file format');
      }

      // Confirm import
      const confirmed = confirm(
        `This will import ${data.clients.length} clients, ${data.jobs.length} jobs, ` +
        `${data.quotes.length} quotes, and other data. This action cannot be undone. Continue?`
      );

      if (!confirmed) return;

      // Import data (this would need more sophisticated handling in production)
      window.ui.showNotification('Data import feature coming soon', 'info');

    } catch (error) {
      console.error('Error importing data:', error);
      window.ui.showNotification('Failed to import data: ' + error.message, 'error');
    }
  }

  // Database maintenance
  async optimizeDatabase() {
    try {
      // Run VACUUM to optimize SQLite database
      await window.db.query('VACUUM');
      window.ui.showNotification('Database optimized successfully', 'success');
    } catch (error) {
      console.error('Error optimizing database:', error);
      window.ui.showNotification('Failed to optimize database', 'error');
    }
  }

  async clearOldData() {
    const confirmed = confirm(
      'This will delete completed jobs and paid invoices older than 2 years. ' +
      'This action cannot be undone. Continue?'
    );

    if (!confirmed) return;

    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const cutoffDate = twoYearsAgo.toISOString().split('T')[0];

      // Delete old completed jobs
      const jobsDeleted = await window.db.query(
        'DELETE FROM jobs WHERE status = "completed" AND created_at < ?',
        [cutoffDate]
      );

      // Delete old paid invoices
      const invoicesDeleted = await window.db.query(
        'DELETE FROM invoices WHERE status = "paid" AND created_at < ?',
        [cutoffDate]
      );

      window.ui.showNotification(
        `Cleaned up ${jobsDeleted.changes} old jobs and ${invoicesDeleted.changes} old invoices`,
        'success'
      );

    } catch (error) {
      console.error('Error clearing old data:', error);
      window.ui.showNotification('Failed to clear old data', 'error');
    }
  }

  // Application info
  showAbout() {
    const aboutContent = `
      <div class="about-content">
        <h3>TRADE OS v1.0.0</h3>
        <p>The essential operating system for specialty trade contractors.</p>
        
        <h4>Features:</h4>
        <ul>
          <li>AI-Powered Quote Generation</li>
          <li>Job & Project Management</li>
          <li>Client Relationship Management</li>
          <li>Scheduling & Calendar</li>
          <li>Invoice & Payment Tracking</li>
          <li>Expense Management</li>
          <li>Business Reports</li>
        </ul>
        
        <h4>System Information:</h4>
        <p><strong>Database:</strong> SQLite (Local)</p>
        <p><strong>Platform:</strong> Electron</p>
        <p><strong>Data Location:</strong> Local (Offline-First)</p>
        
        <p class="copyright">© 2025 TRADE OS. All rights reserved.</p>
      </div>
    `;

    window.ui.showModal('quote-modal', aboutContent);
  }
}

// Initialize settings manager
window.settingsManager = new SettingsManager();

