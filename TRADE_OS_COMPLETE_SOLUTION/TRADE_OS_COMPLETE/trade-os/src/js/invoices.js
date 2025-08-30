// Invoices management module for TRADE OS

class InvoicesManager {
  constructor() {
    this.currentInvoice = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // New invoice button
    const newInvoiceBtn = document.getElementById('new-invoice-btn');
    if (newInvoiceBtn) {
      newInvoiceBtn.addEventListener('click', () => this.showInvoiceModal());
    }
  }

  async showInvoiceModal(invoiceId = null) {
    this.currentInvoice = null;

    if (invoiceId) {
      this.currentInvoice = await window.db.getInvoice(invoiceId);
    }

    const clients = await window.db.getClients();
    const jobs = await window.db.getJobs();
    const quotes = await window.db.getQuotes();
    const modalContent = this.generateInvoiceModalContent(clients, jobs, quotes);
    
    window.ui.showModal('quote-modal', modalContent);
    this.setupInvoiceFormHandlers();
    
    if (this.currentInvoice) {
      this.populateInvoiceForm();
    }
  }

  generateInvoiceModalContent(clients, jobs, quotes) {
    const isEdit = !!this.currentInvoice;
    const title = isEdit ? 'Edit Invoice' : 'Create New Invoice';

    return `
      <form id="invoice-form" class="invoice-form">
        <div class="form-row">
          <div class="form-group">
            <label for="invoice-client">Client *</label>
            <select id="invoice-client" name="client_id" required>
              <option value="">Select a client</option>
              ${clients.map(client => `
                <option value="${client.id}" ${this.currentInvoice?.client_id == client.id ? 'selected' : ''}>
                  ${client.name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="invoice-number">Invoice Number</label>
            <input type="text" id="invoice-number" name="invoice_number" 
                   value="${this.currentInvoice?.invoice_number || this.generateInvoiceNumber()}" readonly>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="invoice-job">Related Job</label>
            <select id="invoice-job" name="job_id">
              <option value="">Select a job (optional)</option>
              ${jobs.map(job => `
                <option value="${job.id}" ${this.currentInvoice?.job_id == job.id ? 'selected' : ''}>
                  ${job.title}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="invoice-quote">Based on Quote</label>
            <select id="invoice-quote" name="quote_id">
              <option value="">Select a quote (optional)</option>
              ${quotes.map(quote => `
                <option value="${quote.id}" ${this.currentInvoice?.quote_id == quote.id ? 'selected' : ''}>
                  ${quote.quote_number} - ${quote.title}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="invoice-title">Invoice Title *</label>
            <input type="text" id="invoice-title" name="title" required 
                   value="${this.currentInvoice?.title || ''}" 
                   placeholder="e.g., Kitchen Renovation - Final Invoice">
          </div>
          <div class="form-group">
            <label for="invoice-status">Status</label>
            <select id="invoice-status" name="status">
              <option value="draft" ${this.currentInvoice?.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="sent" ${this.currentInvoice?.status === 'sent' ? 'selected' : ''}>Sent</option>
              <option value="paid" ${this.currentInvoice?.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="overdue" ${this.currentInvoice?.status === 'overdue' ? 'selected' : ''}>Overdue</option>
              <option value="cancelled" ${this.currentInvoice?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="invoice-due-date">Due Date</label>
            <input type="date" id="invoice-due-date" name="due_date" 
                   value="${this.currentInvoice?.due_date || this.getDefaultDueDate()}">
          </div>
          <div class="form-group">
            <label for="invoice-paid-date">Paid Date</label>
            <input type="date" id="invoice-paid-date" name="paid_date" 
                   value="${this.currentInvoice?.paid_date || ''}">
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="invoice-description">Description</label>
            <textarea id="invoice-description" name="description" rows="3" 
                      placeholder="Invoice description or work summary...">${this.currentInvoice?.description || ''}</textarea>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="invoice-quick-actions">
          <h4>Quick Actions</h4>
          <div class="quick-action-buttons">
            <button type="button" id="load-from-quote" class="btn btn-secondary">
              <i class="fas fa-file-import"></i> Load from Quote
            </button>
            <button type="button" id="copy-from-job" class="btn btn-secondary">
              <i class="fas fa-copy"></i> Copy from Job
            </button>
          </div>
        </div>

        <!-- Invoice Items Section -->
        <div class="invoice-items-section">
          <div class="invoice-items-header">
            <h3>Invoice Items</h3>
            <button type="button" id="add-invoice-item" class="btn btn-secondary">
              <i class="fas fa-plus"></i> Add Item
            </button>
          </div>

          <div class="invoice-items-container">
            <table class="invoice-items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="invoice-items-tbody">
                <!-- Items will be added here -->
              </tbody>
            </table>
          </div>

          <!-- Invoice Totals -->
          <div class="invoice-totals">
            <div class="invoice-total-row">
              <span>Subtotal:</span>
              <span id="invoice-subtotal">$0.00</span>
            </div>
            <div class="invoice-total-row">
              <span>Tax (<span id="invoice-tax-rate-display">8.5</span>%):</span>
              <span id="invoice-tax">$0.00</span>
            </div>
            <div class="invoice-total-row final">
              <span>Total:</span>
              <span id="invoice-total">$0.00</span>
            </div>
            <div class="invoice-total-row">
              <span>Amount Paid:</span>
              <span>
                <input type="number" id="invoice-amount-paid" name="amount_paid" 
                       value="${this.currentInvoice?.amount_paid || 0}" 
                       min="0" step="0.01" class="amount-input">
              </span>
            </div>
            <div class="invoice-total-row balance">
              <span>Balance Due:</span>
              <span id="invoice-balance">$0.00</span>
            </div>
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="invoice-notes">Notes</label>
            <textarea id="invoice-notes" name="notes" rows="3" 
                      placeholder="Payment terms, additional notes...">${this.currentInvoice?.notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Update Invoice' : 'Create Invoice'}
          </button>
          ${isEdit ? `
            <button type="button" class="btn btn-success" onclick="window.invoicesManager.markAsPaid(${this.currentInvoice.id})">
              <i class="fas fa-check"></i> Mark as Paid
            </button>
          ` : ''}
        </div>
      </form>
    `;
  }

  setupInvoiceFormHandlers() {
    const form = document.getElementById('invoice-form');
    const addItemBtn = document.getElementById('add-invoice-item');
    const loadFromQuoteBtn = document.getElementById('load-from-quote');
    const copyFromJobBtn = document.getElementById('copy-from-job');
    const amountPaidInput = document.getElementById('invoice-amount-paid');

    // Form submission
    form.addEventListener('submit', (e) => this.handleInvoiceSubmit(e));

    // Add item button
    addItemBtn.addEventListener('click', () => this.addInvoiceItem());

    // Quick action buttons
    loadFromQuoteBtn.addEventListener('click', () => this.loadFromQuote());
    copyFromJobBtn.addEventListener('click', () => this.copyFromJob());

    // Amount paid changes
    amountPaidInput.addEventListener('input', () => this.calculateBalance());

    // Client selection updates job and quote dropdowns
    const clientSelect = document.getElementById('invoice-client');
    clientSelect.addEventListener('change', (e) => this.updateClientRelatedOptions(e.target.value));

    // Load tax rate
    this.loadTaxRate();

    // Initialize with one item if creating new invoice
    if (!this.currentInvoice) {
      this.invoiceItems = [];
      this.addInvoiceItem();
    } else {
      this.loadInvoiceItems();
    }
  }

  async loadTaxRate() {
    const taxRate = await window.db.getSetting('tax_rate') || '8.5';
    document.getElementById('invoice-tax-rate-display').textContent = taxRate;
  }

  async updateClientRelatedOptions(clientId) {
    const jobSelect = document.getElementById('invoice-job');
    const quoteSelect = document.getElementById('invoice-quote');

    // Clear existing options
    jobSelect.innerHTML = '<option value="">Select a job (optional)</option>';
    quoteSelect.innerHTML = '<option value="">Select a quote (optional)</option>';

    if (!clientId) return;

    try {
      // Load client's jobs
      const jobs = await window.db.query(
        'SELECT * FROM jobs WHERE client_id = ? ORDER BY created_at DESC',
        [clientId]
      );

      jobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = job.title;
        jobSelect.appendChild(option);
      });

      // Load client's quotes
      const quotes = await window.db.query(
        'SELECT * FROM quotes WHERE client_id = ? ORDER BY created_at DESC',
        [clientId]
      );

      quotes.forEach(quote => {
        const option = document.createElement('option');
        option.value = quote.id;
        option.textContent = `${quote.quote_number} - ${quote.title}`;
        quoteSelect.appendChild(option);
      });

    } catch (error) {
      console.error('Error loading client related options:', error);
    }
  }

  addInvoiceItem(itemData = null) {
    const item = itemData || {
      id: Date.now(),
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    };

    if (!this.invoiceItems) {
      this.invoiceItems = [];
    }

    this.invoiceItems.push(item);
    this.renderInvoiceItems();
    this.calculateTotals();
  }

  renderInvoiceItems() {
    const tbody = document.getElementById('invoice-items-tbody');
    
    tbody.innerHTML = this.invoiceItems.map((item, index) => `
      <tr data-index="${index}">
        <td>
          <input type="text" class="invoice-item-input" name="description" 
                 value="${item.description}" placeholder="Item description">
        </td>
        <td>
          <input type="number" class="invoice-item-input" name="quantity" 
                 value="${item.quantity}" min="0" step="0.01" style="width: 80px;">
        </td>
        <td>
          <input type="number" class="invoice-item-input" name="unit_price" 
                 value="${item.unit_price}" min="0" step="0.01" style="width: 100px;">
        </td>
        <td class="item-total">$${item.total.toFixed(2)}</td>
        <td>
          <button type="button" class="remove-item-btn" onclick="window.invoicesManager.removeInvoiceItem(${index})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Add event listeners for calculations
    tbody.querySelectorAll('.invoice-item-input').forEach(input => {
      input.addEventListener('input', (e) => this.updateInvoiceItem(e));
    });
  }

  updateInvoiceItem(event) {
    const row = event.target.closest('tr');
    const index = parseInt(row.dataset.index);
    const field = event.target.name;
    const value = event.target.value;

    this.invoiceItems[index][field] = field === 'quantity' || field === 'unit_price' ? 
      parseFloat(value) || 0 : value;

    // Recalculate item total
    const item = this.invoiceItems[index];
    item.total = item.quantity * item.unit_price;

    // Update display
    row.querySelector('.item-total').textContent = `$${item.total.toFixed(2)}`;
    
    this.calculateTotals();
  }

  removeInvoiceItem(index) {
    this.invoiceItems.splice(index, 1);
    this.renderInvoiceItems();
    this.calculateTotals();
  }

  async calculateTotals() {
    const subtotal = this.invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(await window.db.getSetting('tax_rate') || '8.5') / 100;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    const amountPaid = parseFloat(document.getElementById('invoice-amount-paid').value) || 0;
    const balance = total - amountPaid;

    document.getElementById('invoice-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('invoice-tax').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('invoice-total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('invoice-balance').textContent = `$${balance.toFixed(2)}`;

    // Update balance styling
    const balanceElement = document.getElementById('invoice-balance');
    balanceElement.className = balance <= 0 ? 'balance-paid' : 'balance-due';
  }

  calculateBalance() {
    this.calculateTotals();
  }

  async loadFromQuote() {
    const quoteId = document.getElementById('invoice-quote').value;
    if (!quoteId) {
      window.ui.showNotification('Please select a quote first', 'warning');
      return;
    }

    try {
      const quote = await window.db.getQuote(quoteId);
      const quoteItems = await window.db.getQuoteItems(quoteId);

      if (!quote) {
        throw new Error('Quote not found');
      }

      // Populate invoice fields from quote
      document.getElementById('invoice-title').value = quote.title;
      document.getElementById('invoice-description').value = quote.description || '';

      // Load quote items
      this.invoiceItems = quoteItems.map(item => ({
        id: Date.now() + Math.random(),
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }));

      this.renderInvoiceItems();
      this.calculateTotals();

      window.ui.showNotification('Invoice loaded from quote successfully', 'success');

    } catch (error) {
      console.error('Error loading from quote:', error);
      window.ui.showNotification('Failed to load from quote', 'error');
    }
  }

  async copyFromJob() {
    const jobId = document.getElementById('invoice-job').value;
    if (!jobId) {
      window.ui.showNotification('Please select a job first', 'warning');
      return;
    }

    try {
      const job = await window.db.getJob(jobId);

      if (!job) {
        throw new Error('Job not found');
      }

      // Populate invoice fields from job
      document.getElementById('invoice-title').value = job.title;
      document.getElementById('invoice-description').value = job.description || '';

      // Create a simple line item from job cost
      this.invoiceItems = [{
        id: Date.now(),
        description: job.title,
        quantity: 1,
        unit_price: job.actual_cost || job.estimated_cost || 0,
        total: job.actual_cost || job.estimated_cost || 0
      }];

      this.renderInvoiceItems();
      this.calculateTotals();

      window.ui.showNotification('Invoice copied from job successfully', 'success');

    } catch (error) {
      console.error('Error copying from job:', error);
      window.ui.showNotification('Failed to copy from job', 'error');
    }
  }

  async loadInvoiceItems() {
    // For now, create a simple item from invoice total
    // In a full implementation, you'd have an invoice_items table
    this.invoiceItems = [{
      id: 1,
      description: this.currentInvoice.title,
      quantity: 1,
      unit_price: this.currentInvoice.subtotal || 0,
      total: this.currentInvoice.subtotal || 0
    }];

    this.renderInvoiceItems();
    this.calculateTotals();
  }

  populateInvoiceForm() {
    if (!this.currentInvoice) return;

    const form = document.getElementById('invoice-form');
    Object.keys(this.currentInvoice).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = this.currentInvoice[key] || '';
      }
    });
  }

  async handleInvoiceSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      // Calculate totals
      const subtotal = this.invoiceItems.reduce((sum, item) => sum + item.total, 0);
      const taxRate = parseFloat(await window.db.getSetting('tax_rate') || '8.5') / 100;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Prepare invoice data
      const invoiceData = {
        client_id: parseInt(formData.get('client_id')),
        job_id: formData.get('job_id') ? parseInt(formData.get('job_id')) : null,
        quote_id: formData.get('quote_id') ? parseInt(formData.get('quote_id')) : null,
        invoice_number: formData.get('invoice_number'),
        title: formData.get('title'),
        description: formData.get('description'),
        subtotal: subtotal,
        tax_rate: taxRate * 100,
        tax_amount: taxAmount,
        total: total,
        amount_paid: parseFloat(formData.get('amount_paid')) || 0,
        status: formData.get('status'),
        due_date: formData.get('due_date') || null,
        paid_date: formData.get('paid_date') || null,
        notes: formData.get('notes')
      };

      if (this.currentInvoice) {
        // Update existing invoice
        await this.updateInvoice(this.currentInvoice.id, invoiceData);
        window.ui.showNotification('Invoice updated successfully', 'success');
      } else {
        // Create new invoice
        await window.db.createInvoice(invoiceData);
        window.ui.showNotification('Invoice created successfully', 'success');
      }
      
      window.ui.closeModal();
      
      // Refresh invoices view if currently active
      if (window.ui.currentView === 'invoices') {
        await window.ui.loadInvoicesData();
      }

      // Refresh dashboard if currently active
      if (window.ui.currentView === 'dashboard') {
        await window.ui.loadDashboardData();
      }

    } catch (error) {
      console.error('Error saving invoice:', error);
      window.ui.showNotification('Failed to save invoice', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.currentInvoice ? 'Update Invoice' : 'Create Invoice';
    }
  }

  async updateInvoice(id, invoiceData) {
    try {
      await window.db.query(
        `UPDATE invoices SET 
         client_id = ?, job_id = ?, quote_id = ?, title = ?, description = ?, 
         subtotal = ?, tax_rate = ?, tax_amount = ?, total = ?, amount_paid = ?, 
         status = ?, due_date = ?, paid_date = ?, notes = ?, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          invoiceData.client_id, invoiceData.job_id, invoiceData.quote_id,
          invoiceData.title, invoiceData.description, invoiceData.subtotal,
          invoiceData.tax_rate, invoiceData.tax_amount, invoiceData.total,
          invoiceData.amount_paid, invoiceData.status, invoiceData.due_date,
          invoiceData.paid_date, invoiceData.notes, id
        ]
      );
      return true;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  async markAsPaid(invoiceId) {
    try {
      const invoice = await window.db.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const updateData = {
        ...invoice,
        status: 'paid',
        amount_paid: invoice.total,
        paid_date: new Date().toISOString().split('T')[0]
      };

      await this.updateInvoice(invoiceId, updateData);
      
      window.ui.showNotification('Invoice marked as paid', 'success');
      window.ui.closeModal();
      
      // Refresh current view
      if (window.ui.currentView === 'invoices') {
        await window.ui.loadInvoicesData();
      } else if (window.ui.currentView === 'dashboard') {
        await window.ui.loadDashboardData();
      }

    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      window.ui.showNotification('Failed to mark invoice as paid', 'error');
    }
  }

  generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    
    return `INV${year}${month}${day}-${time}`;
  }

  getDefaultDueDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  }
}

// Initialize invoices manager
window.invoicesManager = new InvoicesManager();

