// UI management module for TRADE OS

class UIManager {
  constructor() {
    this.currentView = 'dashboard';
    this.modals = new Map();
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupModals();
    this.setupMenuHandlers();
    this.loadInitialView();
  }

  setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const view = item.dataset.view;
        if (view) {
          this.switchView(view);
        }
      });
    });
  }

  setupModals() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloses = document.querySelectorAll('.modal-close');
    
    // Close modal when clicking overlay
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.closeModal();
      }
    });

    // Close modal when clicking close button
    modalCloses.forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModal();
      });
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  setupMenuHandlers() {
    const { ipcRenderer } = require('electron');
    
    // Listen for menu actions from main process
    ipcRenderer.on('menu-action', (event, action) => {
      this.handleMenuAction(action);
    });
  }

  handleMenuAction(action) {
    switch (action) {
      case 'new-quote':
        this.showQuoteModal();
        break;
      case 'new-job':
        this.showJobModal();
        break;
      case 'dashboard':
        this.switchView('dashboard');
        break;
      case 'quotes':
        this.switchView('quotes');
        break;
      case 'jobs':
        this.switchView('jobs');
        break;
      case 'schedule':
        this.switchView('schedule');
        break;
      case 'clients':
        this.switchView('clients');
        break;
      case 'invoices':
        this.switchView('invoices');
        break;
      case 'settings':
        this.switchView('settings');
        break;
    }
  }

  switchView(viewName) {
    // Update navigation
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`)?.classList.add('active');

    // Update page title
    const pageTitle = document.getElementById('page-title');
    const titles = {
      dashboard: 'Dashboard',
      quotes: 'Quotes',
      jobs: 'Jobs',
      schedule: 'Schedule',
      clients: 'Clients',
      invoices: 'Invoices',
      expenses: 'Expenses',
      reports: 'Reports',
      settings: 'Settings'
    };
    pageTitle.textContent = titles[viewName] || 'TRADE OS';

    // Update quick action button
    const quickActionBtn = document.getElementById('quick-action-btn');
    const actionConfigs = {
      dashboard: { text: 'New Quote', icon: 'fas fa-plus', action: 'new-quote' },
      quotes: { text: 'New Quote', icon: 'fas fa-plus', action: 'new-quote' },
      jobs: { text: 'New Job', icon: 'fas fa-plus', action: 'new-job' },
      clients: { text: 'New Client', icon: 'fas fa-plus', action: 'new-client' },
      invoices: { text: 'New Invoice', icon: 'fas fa-plus', action: 'new-invoice' },
      schedule: { text: 'New Appointment', icon: 'fas fa-plus', action: 'new-appointment' }
    };
    
    const config = actionConfigs[viewName];
    if (config) {
      quickActionBtn.innerHTML = `<i class="${config.icon}"></i> ${config.text}`;
      quickActionBtn.onclick = () => this.handleQuickAction(config.action);
      quickActionBtn.style.display = 'flex';
    } else {
      quickActionBtn.style.display = 'none';
    }

    this.currentView = viewName;
    this.loadViewData(viewName);
  }

  handleQuickAction(action) {
    switch (action) {
      case 'new-quote':
        this.showQuoteModal();
        break;
      case 'new-job':
        this.showJobModal();
        break;
      case 'new-client':
        this.showClientModal();
        break;
      case 'new-invoice':
        this.showInvoiceModal();
        break;
      case 'new-appointment':
        this.showAppointmentModal();
        break;
    }
  }

  async loadViewData(viewName) {
    try {
      switch (viewName) {
        case 'dashboard':
          await this.loadDashboardData();
          break;
        case 'quotes':
          await this.loadQuotesData();
          break;
        case 'jobs':
          await this.loadJobsData();
          break;
        case 'clients':
          await this.loadClientsData();
          break;
        case 'invoices':
          await this.loadInvoicesData();
          break;
        case 'schedule':
          await this.loadScheduleData();
          break;
        case 'expenses':
          await this.loadExpensesData();
          break;
        case 'settings':
          await this.loadSettingsData();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${viewName} data:`, error);
      this.showNotification(`Error loading ${viewName} data`, 'error');
    }
  }

  async loadDashboardData() {
    try {
      const stats = await window.db.getDashboardStats();
      
      // Update stats
      document.getElementById('revenue-stat').textContent = this.formatCurrency(stats.revenue);
      document.getElementById('quotes-stat').textContent = stats.activeQuotes;
      document.getElementById('jobs-stat').textContent = stats.activeJobs;
      document.getElementById('overdue-stat').textContent = stats.overdueInvoices;

      // Load today's schedule
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = await window.db.getScheduleEvents(today, today);
      this.renderTodaySchedule(todayEvents);

      // Load recent activity (placeholder for now)
      this.renderRecentActivity([]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  renderTodaySchedule(events) {
    const container = document.getElementById('today-schedule');
    
    if (events.length === 0) {
      container.innerHTML = '<p class="no-data">No appointments scheduled for today</p>';
      return;
    }

    const html = events.map(event => `
      <div class="schedule-item">
        <div class="schedule-time">
          ${new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div class="schedule-details">
          <h4>${event.title}</h4>
          <p>${event.client_name || 'No client'}</p>
          ${event.location ? `<p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  renderRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    
    if (activities.length === 0) {
      container.innerHTML = '<p class="no-data">No recent activity</p>';
      return;
    }

    // Placeholder for recent activity rendering
    container.innerHTML = '<p class="no-data">No recent activity</p>';
  }

  async loadQuotesData() {
    const quotes = await window.db.getQuotes();
    this.renderQuotesList(quotes);
  }

  renderQuotesList(quotes) {
    const container = document.getElementById('quotes-list');
    
    if (quotes.length === 0) {
      container.innerHTML = '<p class="no-data">No quotes found</p>';
      return;
    }

    const html = quotes.map(quote => `
      <div class="quote-card card">
        <div class="card-body">
          <div class="quote-header">
            <h3>${quote.title}</h3>
            <span class="status-badge status-${quote.status}">${quote.status}</span>
          </div>
          <p class="quote-client">${quote.client_name || 'No client'}</p>
          <p class="quote-description">${quote.description || ''}</p>
          <div class="quote-meta">
            <span class="quote-amount">${this.formatCurrency(quote.total)}</span>
            <span class="quote-date">${this.formatDate(quote.created_at)}</span>
          </div>
          <div class="quote-actions">
            <button class="btn btn-secondary" onclick="ui.editQuote(${quote.id})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-primary" onclick="ui.viewQuote(${quote.id})">
              <i class="fas fa-eye"></i> View
            </button>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  async loadJobsData() {
    const jobs = await window.db.getJobs();
    this.renderJobsList(jobs);
  }

  renderJobsList(jobs) {
    const container = document.getElementById('jobs-list');
    
    if (jobs.length === 0) {
      container.innerHTML = '<p class="no-data">No jobs found</p>';
      return;
    }

    const html = `
      <div class="jobs-grid">
        ${jobs.map(job => `
          <div class="job-card">
            <div class="job-card-header">
              <h3 class="job-card-title">${job.title}</h3>
              <p class="job-card-client">${job.client_name || 'No client'}</p>
            </div>
            <div class="job-card-body">
              <div class="job-card-meta">
                <div class="job-meta-item">
                  <span class="job-meta-label">Status</span>
                  <span class="status-badge status-${job.status}">${job.status}</span>
                </div>
                <div class="job-meta-item">
                  <span class="job-meta-label">Estimated Cost</span>
                  <span class="job-meta-value">${this.formatCurrency(job.estimated_cost)}</span>
                </div>
                <div class="job-meta-item">
                  <span class="job-meta-label">Start Date</span>
                  <span class="job-meta-value">${job.start_date ? this.formatDate(job.start_date) : 'Not set'}</span>
                </div>
                <div class="job-meta-item">
                  <span class="job-meta-label">Estimated Hours</span>
                  <span class="job-meta-value">${job.estimated_hours || 'Not set'}</span>
                </div>
              </div>
            </div>
            <div class="job-card-footer">
              <span class="job-meta-value">${this.formatDate(job.created_at)}</span>
              <div class="job-actions">
                <button class="btn btn-secondary" onclick="ui.editJob(${job.id})">
                  <i class="fas fa-edit"></i> Edit
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  async loadClientsData() {
    const clients = await window.db.getClients();
    this.renderClientsList(clients);
  }

  renderClientsList(clients) {
    const container = document.getElementById('clients-list');
    
    if (clients.length === 0) {
      container.innerHTML = '<p class="no-data">No clients found</p>';
      return;
    }

    const html = `
      <div class="clients-grid">
        ${clients.map(client => `
          <div class="client-card">
            <div class="client-card-header">
              <div class="client-avatar">
                ${client.name.charAt(0).toUpperCase()}
              </div>
              <div class="client-info">
                <h3>${client.name}</h3>
                <div class="client-contact">
                  ${client.email ? `<p><i class="fas fa-envelope"></i> ${client.email}</p>` : ''}
                  ${client.phone ? `<p><i class="fas fa-phone"></i> ${client.phone}</p>` : ''}
                </div>
              </div>
            </div>
            ${client.address ? `<p class="client-address"><i class="fas fa-map-marker-alt"></i> ${client.address}</p>` : ''}
            <div class="client-stats">
              <div class="client-stat">
                <div class="client-stat-value">0</div>
                <div class="client-stat-label">Jobs</div>
              </div>
              <div class="client-stat">
                <div class="client-stat-value">$0</div>
                <div class="client-stat-label">Revenue</div>
              </div>
            </div>
            <div class="client-actions">
              <button class="btn btn-secondary" onclick="ui.editClient(${client.id})">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-primary" onclick="ui.newQuoteForClient(${client.id})">
                <i class="fas fa-file-invoice-dollar"></i> Quote
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  async loadInvoicesData() {
    const invoices = await window.db.getInvoices();
    this.renderInvoicesList(invoices);
  }

  renderInvoicesList(invoices) {
    const container = document.getElementById('invoices-list');
    
    if (invoices.length === 0) {
      container.innerHTML = '<p class="no-data">No invoices found</p>';
      return;
    }

    const html = `
      <div class="invoice-list">
        ${invoices.map(invoice => `
          <div class="invoice-item">
            <div class="invoice-info">
              <div class="invoice-client">${invoice.client_name || 'No client'}</div>
              <div class="invoice-number">#${invoice.invoice_number}</div>
            </div>
            <div class="invoice-amount">${this.formatCurrency(invoice.total)}</div>
            <div class="invoice-date">${this.formatDate(invoice.created_at)}</div>
            <div class="invoice-status">
              <span class="status-badge status-${invoice.status}">${invoice.status}</span>
            </div>
            <div class="invoice-actions">
              <button class="action-icon-btn edit" onclick="ui.editInvoice(${invoice.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-icon-btn" onclick="ui.viewInvoice(${invoice.id})">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  async loadScheduleData() {
    // Load calendar for current month
    const now = new Date();
    this.currentCalendarDate = new Date(now.getFullYear(), now.getMonth(), 1);
    await this.renderCalendar();
  }

  async renderCalendar() {
    const monthYear = document.getElementById('calendar-month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    
    monthYear.textContent = new Date(year, month).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });

    // Get events for the month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const events = await window.db.getScheduleEvents(startDate, endDate);

    // Generate calendar grid
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    let html = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day other-month"></div>';
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      
      const dayEvents = events.filter(event => 
        event.start_datetime.startsWith(dateStr)
      );

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <div class="calendar-day-number">${day}</div>
          ${dayEvents.map(event => `
            <div class="calendar-event" title="${event.title}">
              ${event.title}
            </div>
          `).join('')}
        </div>
      `;
    }

    calendarGrid.innerHTML = html;

    // Add click handlers for calendar navigation
    document.getElementById('prev-month').onclick = () => {
      this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
      this.renderCalendar();
    };

    document.getElementById('next-month').onclick = () => {
      this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
      this.renderCalendar();
    };
  }

  async loadExpensesData() {
    const expenses = await window.db.getExpenses();
    this.renderExpensesList(expenses);
  }

  renderExpensesList(expenses) {
    const container = document.getElementById('expenses-list');
    
    if (expenses.length === 0) {
      container.innerHTML = '<p class="no-data">No expenses found</p>';
      return;
    }

    // Placeholder for expenses rendering
    container.innerHTML = '<p class="no-data">Expenses feature coming soon</p>';
  }

  async loadSettingsData() {
    // Load settings form data
    await window.settingsManager.loadSettings();
  }

  loadInitialView() {
    this.switchView('dashboard');
  }

  // Modal methods
  showModal(modalId, content = null) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    
    if (content) {
      const modalBody = modal.querySelector('.modal-body');
      modalBody.innerHTML = content;
    }
    
    overlay.classList.add('active');
    modal.style.display = 'block';
  }

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    
    // Hide all modals
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }

  showQuoteModal(quoteId = null) {
    window.quotesManager.showQuoteModal(quoteId);
  }

  showJobModal(jobId = null) {
    window.jobsManager.showJobModal(jobId);
  }

  showClientModal(clientId = null) {
    window.clientsManager.showClientModal(clientId);
  }

  showInvoiceModal(invoiceId = null) {
    // Placeholder for invoice modal
    this.showNotification('Invoice feature coming soon', 'info');
  }

  showAppointmentModal(eventId = null) {
    window.scheduleManager.showAppointmentModal(eventId);
  }

  // Action methods
  editQuote(id) {
    this.showQuoteModal(id);
  }

  viewQuote(id) {
    // Placeholder for quote viewer
    this.showNotification('Quote viewer coming soon', 'info');
  }

  editJob(id) {
    this.showJobModal(id);
  }

  editClient(id) {
    this.showClientModal(id);
  }

  newQuoteForClient(clientId) {
    window.quotesManager.showQuoteModal(null, clientId);
  }

  editInvoice(id) {
    this.showInvoiceModal(id);
  }

  viewInvoice(id) {
    // Placeholder for invoice viewer
    this.showNotification('Invoice viewer coming soon', 'info');
  }

  // Utility methods
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

  formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Manual close
    notification.querySelector('.notification-close').onclick = () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    };
  }
}

// Initialize UI manager
window.ui = new UIManager();

