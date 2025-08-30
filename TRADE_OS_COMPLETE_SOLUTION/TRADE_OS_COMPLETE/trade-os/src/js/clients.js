// Clients management module for TRADE OS

class ClientsManager {
  constructor() {
    this.currentClient = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Quick action buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="new-client"]')) {
        this.showClientModal();
      }
    });

    // New client button
    const newClientBtn = document.getElementById('new-client-btn');
    if (newClientBtn) {
      newClientBtn.addEventListener('click', () => this.showClientModal());
    }
  }

  async showClientModal(clientId = null) {
    this.currentClient = null;

    if (clientId) {
      this.currentClient = await window.db.getClient(clientId);
    }

    const modalContent = this.generateClientModalContent();
    
    window.ui.showModal('quote-modal', modalContent);
    this.setupClientFormHandlers();
    
    if (this.currentClient) {
      this.populateClientForm();
    }
  }

  generateClientModalContent() {
    const isEdit = !!this.currentClient;
    const title = isEdit ? 'Edit Client' : 'Add New Client';

    return `
      <form id="client-form" class="client-form">
        <div class="form-row">
          <div class="form-group">
            <label for="client-name">Client Name *</label>
            <input type="text" id="client-name" name="name" required 
                   value="${this.currentClient?.name || ''}" 
                   placeholder="John Smith or Smith Construction">
          </div>
          <div class="form-group">
            <label for="client-email">Email</label>
            <input type="email" id="client-email" name="email" 
                   value="${this.currentClient?.email || ''}" 
                   placeholder="john@example.com">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="client-phone">Phone</label>
            <input type="tel" id="client-phone" name="phone" 
                   value="${this.currentClient?.phone || ''}" 
                   placeholder="(555) 123-4567">
          </div>
          <div class="form-group">
            <!-- Spacer for layout -->
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="client-address">Street Address</label>
            <input type="text" id="client-address" name="address" 
                   value="${this.currentClient?.address || ''}" 
                   placeholder="123 Main Street">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="client-city">City</label>
            <input type="text" id="client-city" name="city" 
                   value="${this.currentClient?.city || ''}" 
                   placeholder="Anytown">
          </div>
          <div class="form-group">
            <label for="client-state">State</label>
            <input type="text" id="client-state" name="state" 
                   value="${this.currentClient?.state || ''}" 
                   placeholder="CA" maxlength="2">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="client-zip">ZIP Code</label>
            <input type="text" id="client-zip" name="zip" 
                   value="${this.currentClient?.zip || ''}" 
                   placeholder="12345" maxlength="10">
          </div>
          <div class="form-group">
            <!-- Spacer for layout -->
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="client-notes">Notes</label>
            <textarea id="client-notes" name="notes" rows="4" 
                      placeholder="Special requirements, preferences, contact notes, etc...">${this.currentClient?.notes || ''}</textarea>
          </div>
        </div>

        ${isEdit ? this.generateClientStatsSection() : ''}

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Update Client' : 'Add Client'}
          </button>
          ${isEdit ? `
            <button type="button" class="btn btn-success" onclick="window.ui.newQuoteForClient(${this.currentClient.id})">
              <i class="fas fa-file-invoice-dollar"></i> New Quote
            </button>
          ` : ''}
        </div>
      </form>
    `;
  }

  generateClientStatsSection() {
    return `
      <div class="client-stats-section">
        <h4>Client History</h4>
        <div class="client-stats-grid">
          <div class="stat-item">
            <span class="stat-label">Total Jobs:</span>
            <span class="stat-value" id="client-total-jobs">Loading...</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Active Jobs:</span>
            <span class="stat-value" id="client-active-jobs">Loading...</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Revenue:</span>
            <span class="stat-value" id="client-total-revenue">Loading...</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last Job:</span>
            <span class="stat-value" id="client-last-job">Loading...</span>
          </div>
        </div>
        
        <div class="client-recent-activity">
          <h5>Recent Activity</h5>
          <div id="client-recent-jobs">Loading...</div>
        </div>
      </div>
    `;
  }

  setupClientFormHandlers() {
    const form = document.getElementById('client-form');
    
    // Form submission
    form.addEventListener('submit', (e) => this.handleClientSubmit(e));

    // Auto-format phone number
    const phoneInput = document.getElementById('client-phone');
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      } else if (value.length >= 3) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      }
      e.target.value = value;
    });

    // Auto-uppercase state
    const stateInput = document.getElementById('client-state');
    stateInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    // Load client stats if editing
    if (this.currentClient) {
      this.loadClientStats();
    }
  }

  async loadClientStats() {
    try {
      // Get client jobs
      const jobs = await window.db.query(
        'SELECT * FROM jobs WHERE client_id = ? ORDER BY created_at DESC',
        [this.currentClient.id]
      );

      // Get client invoices for revenue calculation
      const invoices = await window.db.query(
        'SELECT * FROM invoices WHERE client_id = ? AND status = "paid"',
        [this.currentClient.id]
      );

      // Calculate stats
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => ['quoted', 'approved', 'in-progress'].includes(job.status)).length;
      const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0);
      const lastJob = jobs[0];

      // Update display
      document.getElementById('client-total-jobs').textContent = totalJobs;
      document.getElementById('client-active-jobs').textContent = activeJobs;
      document.getElementById('client-total-revenue').textContent = window.ui.formatCurrency(totalRevenue);
      document.getElementById('client-last-job').textContent = lastJob ? 
        window.ui.formatDate(lastJob.created_at) : 'None';

      // Show recent jobs
      const recentJobsContainer = document.getElementById('client-recent-jobs');
      if (jobs.length > 0) {
        const recentJobs = jobs.slice(0, 5);
        recentJobsContainer.innerHTML = recentJobs.map(job => `
          <div class="recent-job-item">
            <div class="job-title">${job.title}</div>
            <div class="job-meta">
              <span class="status-badge status-${job.status}">${job.status}</span>
              <span class="job-date">${window.ui.formatDate(job.created_at)}</span>
              <span class="job-amount">${window.ui.formatCurrency(job.estimated_cost)}</span>
            </div>
          </div>
        `).join('');
      } else {
        recentJobsContainer.innerHTML = '<p class="no-data">No jobs found for this client</p>';
      }

    } catch (error) {
      console.error('Error loading client stats:', error);
      document.getElementById('client-total-jobs').textContent = 'Error';
      document.getElementById('client-active-jobs').textContent = 'Error';
      document.getElementById('client-total-revenue').textContent = 'Error';
      document.getElementById('client-last-job').textContent = 'Error';
    }
  }

  populateClientForm() {
    if (!this.currentClient) return;

    const form = document.getElementById('client-form');
    Object.keys(this.currentClient).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = this.currentClient[key] || '';
      }
    });
  }

  async handleClientSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      // Prepare client data
      const clientData = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        address: formData.get('address').trim(),
        city: formData.get('city').trim(),
        state: formData.get('state').trim(),
        zip: formData.get('zip').trim(),
        notes: formData.get('notes').trim()
      };

      // Validate required fields
      if (!clientData.name) {
        throw new Error('Client name is required');
      }

      if (this.currentClient) {
        // Update existing client
        await window.db.updateClient(this.currentClient.id, clientData);
        window.ui.showNotification('Client updated successfully', 'success');
      } else {
        // Create new client
        await window.db.createClient(clientData);
        window.ui.showNotification('Client added successfully', 'success');
      }
      
      window.ui.closeModal();
      
      // Refresh clients view if currently active
      if (window.ui.currentView === 'clients') {
        await window.ui.loadClientsData();
      }

    } catch (error) {
      console.error('Error saving client:', error);
      window.ui.showNotification(error.message || 'Failed to save client', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.currentClient ? 'Update Client' : 'Add Client';
    }
  }

  // Client search and filtering
  setupClientSearch() {
    const searchInput = document.getElementById('client-search');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filterClients(e.target.value);
      }, 300);
    });
  }

  async filterClients(searchTerm) {
    try {
      let clients;
      if (searchTerm.trim()) {
        clients = await window.db.query(
          `SELECT * FROM clients 
           WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? 
           ORDER BY name ASC`,
          [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );
      } else {
        clients = await window.db.getClients();
      }
      
      window.ui.renderClientsList(clients);
    } catch (error) {
      console.error('Error filtering clients:', error);
    }
  }

  // Client import/export functionality
  async exportClients() {
    try {
      const clients = await window.db.getClients();
      
      // Convert to CSV
      const headers = ['Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...clients.map(client => [
          this.escapeCsvField(client.name),
          this.escapeCsvField(client.email),
          this.escapeCsvField(client.phone),
          this.escapeCsvField(client.address),
          this.escapeCsvField(client.city),
          this.escapeCsvField(client.state),
          this.escapeCsvField(client.zip),
          this.escapeCsvField(client.notes)
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.ui.showNotification('Clients exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting clients:', error);
      window.ui.showNotification('Failed to export clients', 'error');
    }
  }

  escapeCsvField(field) {
    if (!field) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  }

  // Client deletion with confirmation
  async deleteClient(clientId) {
    try {
      const client = await window.db.getClient(clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Check for associated jobs
      const jobs = await window.db.query(
        'SELECT COUNT(*) as count FROM jobs WHERE client_id = ?',
        [clientId]
      );

      const jobCount = jobs[0]?.count || 0;
      
      let confirmMessage = `Are you sure you want to delete "${client.name}"?`;
      if (jobCount > 0) {
        confirmMessage += `\n\nThis client has ${jobCount} associated job(s). Deleting the client will not delete the jobs, but they will lose their client association.`;
      }

      if (confirm(confirmMessage)) {
        await window.db.deleteClient(clientId);
        window.ui.showNotification('Client deleted successfully', 'success');
        
        // Refresh clients view
        if (window.ui.currentView === 'clients') {
          await window.ui.loadClientsData();
        }
      }

    } catch (error) {
      console.error('Error deleting client:', error);
      window.ui.showNotification('Failed to delete client', 'error');
    }
  }

  // Quick client creation from other modules
  async quickCreateClient(name, email = '', phone = '') {
    try {
      const clientData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: '',
        city: '',
        state: '',
        zip: '',
        notes: 'Created via quick add'
      };

      const clientId = await window.db.createClient(clientData);
      return clientId;
    } catch (error) {
      console.error('Error creating quick client:', error);
      throw error;
    }
  }
}

// Initialize clients manager
window.clientsManager = new ClientsManager();

