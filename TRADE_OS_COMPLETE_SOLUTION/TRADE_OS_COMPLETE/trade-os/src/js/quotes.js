// Quotes management module for TRADE OS

class QuotesManager {
  constructor() {
    this.currentQuote = null;
    this.quoteItems = [];
    this.aiSuggestions = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Quick action buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="new-quote"]')) {
        this.showQuoteModal();
      }
    });

    // New quote button
    const newQuoteBtn = document.getElementById('new-quote-btn');
    if (newQuoteBtn) {
      newQuoteBtn.addEventListener('click', () => this.showQuoteModal());
    }
  }

  async showQuoteModal(quoteId = null, clientId = null) {
    this.currentQuote = null;
    this.quoteItems = [];
    this.aiSuggestions = [];

    if (quoteId) {
      // Load existing quote
      this.currentQuote = await window.db.getQuote(quoteId);
      if (this.currentQuote) {
        this.quoteItems = await window.db.getQuoteItems(quoteId);
      }
    }

    const clients = await window.db.getClients();
    const modalContent = this.generateQuoteModalContent(clients, clientId);
    
    window.ui.showModal('quote-modal', modalContent);
    this.setupQuoteFormHandlers();
    
    if (this.currentQuote) {
      this.populateQuoteForm();
    }
  }

  generateQuoteModalContent(clients, preselectedClientId = null) {
    const isEdit = !!this.currentQuote;
    const title = isEdit ? 'Edit Quote' : 'Create New Quote';

    return `
      <form id="quote-form" class="quote-form">
        <div class="form-row">
          <div class="form-group">
            <label for="quote-client">Client *</label>
            <select id="quote-client" name="client_id" required>
              <option value="">Select a client</option>
              ${clients.map(client => `
                <option value="${client.id}" ${(preselectedClientId == client.id || this.currentQuote?.client_id == client.id) ? 'selected' : ''}>
                  ${client.name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="quote-number">Quote Number</label>
            <input type="text" id="quote-number" name="quote_number" 
                   value="${this.currentQuote?.quote_number || this.generateQuoteNumber()}" readonly>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="quote-title">Project Title *</label>
            <input type="text" id="quote-title" name="title" required 
                   value="${this.currentQuote?.title || ''}" 
                   placeholder="e.g., Kitchen Renovation">
          </div>
          <div class="form-group">
            <label for="quote-valid-until">Valid Until</label>
            <input type="date" id="quote-valid-until" name="valid_until" 
                   value="${this.currentQuote?.valid_until || this.getDefaultValidUntil()}">
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="quote-description">Project Description</label>
            <textarea id="quote-description" name="description" rows="3" 
                      placeholder="Describe the project scope and requirements...">${this.currentQuote?.description || ''}</textarea>
          </div>
        </div>

        <!-- AI Quote Generation Section -->
        <div class="ai-quote-section">
          <div class="form-group">
            <label>AI-Powered Quote Generation</label>
            <div class="ai-input-group">
              <textarea id="ai-project-description" rows="3" 
                        placeholder="Describe your project in detail for AI analysis..."></textarea>
              <button type="button" id="generate-ai-quote" class="btn btn-primary">
                <i class="fas fa-magic"></i> Generate AI Quote
              </button>
            </div>
            <small class="help-text">
              Describe your project and let AI suggest line items, quantities, and pricing based on industry standards.
            </small>
          </div>
        </div>

        <!-- Quote Items Section -->
        <div class="quote-items-section">
          <div class="quote-items-header">
            <h3>Quote Items</h3>
            <button type="button" id="add-quote-item" class="btn btn-secondary">
              <i class="fas fa-plus"></i> Add Item
            </button>
          </div>

          <div class="quote-items-container">
            <table class="quote-items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="quote-items-tbody">
                <!-- Items will be added here -->
              </tbody>
            </table>
          </div>

          <!-- AI Suggestions -->
          <div id="ai-suggestions-container" style="display: none;">
            <div class="ai-suggestions">
              <h4><i class="fas fa-lightbulb"></i> AI Suggestions</h4>
              <div id="ai-suggestions-list">
                <!-- AI suggestions will be displayed here -->
              </div>
              <div class="ai-suggestions-actions">
                <button type="button" id="apply-ai-suggestions" class="btn btn-primary">
                  Apply Selected Suggestions
                </button>
                <button type="button" id="dismiss-ai-suggestions" class="btn btn-secondary">
                  Dismiss
                </button>
              </div>
            </div>
          </div>

          <!-- Quote Totals -->
          <div class="quote-totals">
            <div class="quote-total-row">
              <span>Subtotal:</span>
              <span id="quote-subtotal">$0.00</span>
            </div>
            <div class="quote-total-row">
              <span>Tax (<span id="tax-rate-display">8.5</span>%):</span>
              <span id="quote-tax">$0.00</span>
            </div>
            <div class="quote-total-row final">
              <span>Total:</span>
              <span id="quote-total">$0.00</span>
            </div>
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="quote-notes">Notes</label>
            <textarea id="quote-notes" name="notes" rows="3" 
                      placeholder="Additional notes or terms...">${this.currentQuote?.notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Update Quote' : 'Create Quote'}
          </button>
        </div>
      </form>
    `;
  }

  setupQuoteFormHandlers() {
    const form = document.getElementById('quote-form');
    const addItemBtn = document.getElementById('add-quote-item');
    const generateAIBtn = document.getElementById('generate-ai-quote');
    const applyAIBtn = document.getElementById('apply-ai-suggestions');
    const dismissAIBtn = document.getElementById('dismiss-ai-suggestions');

    // Form submission
    form.addEventListener('submit', (e) => this.handleQuoteSubmit(e));

    // Add item button
    addItemBtn.addEventListener('click', () => this.addQuoteItem());

    // AI generation
    generateAIBtn.addEventListener('click', () => this.generateAIQuote());

    // AI suggestions
    if (applyAIBtn) {
      applyAIBtn.addEventListener('click', () => this.applyAISuggestions());
    }
    if (dismissAIBtn) {
      dismissAIBtn.addEventListener('click', () => this.dismissAISuggestions());
    }

    // Load tax rate
    this.loadTaxRate();

    // Add initial item if creating new quote
    if (!this.currentQuote || this.quoteItems.length === 0) {
      this.addQuoteItem();
    } else {
      this.renderQuoteItems();
    }
  }

  async loadTaxRate() {
    const taxRate = await window.db.getSetting('tax_rate') || '8.5';
    document.getElementById('tax-rate-display').textContent = taxRate;
  }

  addQuoteItem(itemData = null) {
    const item = itemData || {
      id: Date.now(), // Temporary ID for new items
      description: '',
      category: 'labor',
      quantity: 1,
      unit_price: 0,
      total: 0
    };

    this.quoteItems.push(item);
    this.renderQuoteItems();
    this.calculateTotals();
  }

  renderQuoteItems() {
    const tbody = document.getElementById('quote-items-tbody');
    
    tbody.innerHTML = this.quoteItems.map((item, index) => `
      <tr data-index="${index}">
        <td>
          <input type="text" class="quote-item-input" name="description" 
                 value="${item.description}" placeholder="Item description">
        </td>
        <td>
          <select class="quote-item-input" name="category">
            <option value="labor" ${item.category === 'labor' ? 'selected' : ''}>Labor</option>
            <option value="materials" ${item.category === 'materials' ? 'selected' : ''}>Materials</option>
            <option value="equipment" ${item.category === 'equipment' ? 'selected' : ''}>Equipment</option>
            <option value="other" ${item.category === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </td>
        <td>
          <input type="number" class="quote-item-input" name="quantity" 
                 value="${item.quantity}" min="0" step="0.01">
        </td>
        <td>
          <input type="number" class="quote-item-input" name="unit_price" 
                 value="${item.unit_price}" min="0" step="0.01">
        </td>
        <td class="item-total">$${item.total.toFixed(2)}</td>
        <td>
          <button type="button" class="remove-item-btn" onclick="window.quotesManager.removeQuoteItem(${index})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Add event listeners for calculations
    tbody.querySelectorAll('.quote-item-input').forEach(input => {
      input.addEventListener('input', (e) => this.updateQuoteItem(e));
    });
  }

  updateQuoteItem(event) {
    const row = event.target.closest('tr');
    const index = parseInt(row.dataset.index);
    const field = event.target.name;
    const value = event.target.value;

    this.quoteItems[index][field] = field === 'quantity' || field === 'unit_price' ? 
      parseFloat(value) || 0 : value;

    // Recalculate item total
    const item = this.quoteItems[index];
    item.total = item.quantity * item.unit_price;

    // Update display
    row.querySelector('.item-total').textContent = `$${item.total.toFixed(2)}`;
    
    this.calculateTotals();
  }

  removeQuoteItem(index) {
    this.quoteItems.splice(index, 1);
    this.renderQuoteItems();
    this.calculateTotals();
  }

  async calculateTotals() {
    const subtotal = this.quoteItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(await window.db.getSetting('tax_rate') || '8.5') / 100;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    document.getElementById('quote-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('quote-tax').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('quote-total').textContent = `$${total.toFixed(2)}`;
  }

  async generateAIQuote() {
    const generateBtn = document.getElementById('generate-ai-quote');
    const projectDescription = document.getElementById('ai-project-description').value.trim();
    const clientId = document.getElementById('quote-client').value;

    if (!projectDescription) {
      window.ui.showNotification('Please enter a project description for AI analysis', 'warning');
      return;
    }

    try {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

      const result = await window.db.generateQuote(projectDescription, clientId || null);
      
      this.aiSuggestions = result.items || [];
      this.displayAISuggestions(result);

    } catch (error) {
      console.error('AI generation error:', error);
      window.ui.showNotification(error.message || 'Failed to generate AI quote', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate AI Quote';
    }
  }

  displayAISuggestions(result) {
    const container = document.getElementById('ai-suggestions-container');
    const listContainer = document.getElementById('ai-suggestions-list');

    if (!result.items || result.items.length === 0) {
      window.ui.showNotification('No AI suggestions generated', 'info');
      return;
    }

    const html = `
      <div class="ai-analysis">
        <div class="ai-analysis-item">
          <strong>Estimated Hours:</strong> ${result.estimated_hours || 'Not specified'}
        </div>
        <div class="ai-analysis-item">
          <strong>Confidence Level:</strong> ${result.confidence_level || 'Medium'}
        </div>
        ${result.risk_factors && result.risk_factors.length > 0 ? `
          <div class="ai-analysis-item">
            <strong>Risk Factors:</strong> ${result.risk_factors.join(', ')}
          </div>
        ` : ''}
        ${result.recommendations ? `
          <div class="ai-analysis-item">
            <strong>Recommendations:</strong> ${result.recommendations}
          </div>
        ` : ''}
      </div>
      <div class="ai-suggestions-items">
        ${result.items.map((item, index) => `
          <div class="ai-suggestion-item" data-index="${index}">
            <label>
              <input type="checkbox" checked> 
              <strong>${item.description}</strong>
            </label>
            <div class="suggestion-details">
              <span class="suggestion-category">${item.category}</span>
              <span class="suggestion-quantity">Qty: ${item.quantity}</span>
              <span class="suggestion-price">$${item.unit_price.toFixed(2)}</span>
              <span class="suggestion-total">Total: $${(item.quantity * item.unit_price).toFixed(2)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    listContainer.innerHTML = html;
    container.style.display = 'block';
  }

  applyAISuggestions() {
    const selectedSuggestions = [];
    const checkboxes = document.querySelectorAll('#ai-suggestions-list input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
      const index = parseInt(checkbox.closest('.ai-suggestion-item').dataset.index);
      const suggestion = this.aiSuggestions[index];
      if (suggestion) {
        selectedSuggestions.push({
          id: Date.now() + Math.random(), // Temporary ID
          description: suggestion.description,
          category: suggestion.category,
          quantity: suggestion.quantity,
          unit_price: suggestion.unit_price,
          total: suggestion.quantity * suggestion.unit_price
        });
      }
    });

    // Add selected suggestions to quote items
    selectedSuggestions.forEach(item => {
      this.quoteItems.push(item);
    });

    this.renderQuoteItems();
    this.calculateTotals();
    this.dismissAISuggestions();

    window.ui.showNotification(`Added ${selectedSuggestions.length} items from AI suggestions`, 'success');
  }

  dismissAISuggestions() {
    document.getElementById('ai-suggestions-container').style.display = 'none';
    this.aiSuggestions = [];
  }

  populateQuoteForm() {
    if (!this.currentQuote) return;

    // Populate form fields
    const form = document.getElementById('quote-form');
    Object.keys(this.currentQuote).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = this.currentQuote[key] || '';
      }
    });

    // Render existing items
    this.renderQuoteItems();
    this.calculateTotals();
  }

  async handleQuoteSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      // Prepare quote data
      const quoteData = {
        client_id: parseInt(formData.get('client_id')),
        quote_number: formData.get('quote_number'),
        title: formData.get('title'),
        description: formData.get('description'),
        notes: formData.get('notes'),
        valid_until: formData.get('valid_until'),
        status: 'draft'
      };

      // Calculate totals
      const subtotal = this.quoteItems.reduce((sum, item) => sum + item.total, 0);
      const taxRate = parseFloat(await window.db.getSetting('tax_rate') || '8.5') / 100;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      quoteData.subtotal = subtotal;
      quoteData.tax_rate = taxRate * 100;
      quoteData.tax_amount = taxAmount;
      quoteData.total = total;

      let quoteId;
      if (this.currentQuote) {
        // Update existing quote
        await window.db.updateQuote(this.currentQuote.id, quoteData);
        quoteId = this.currentQuote.id;
        
        // Delete existing items and recreate
        await window.db.deleteQuoteItems(quoteId);
      } else {
        // Create new quote
        quoteId = await window.db.createQuote(quoteData);
      }

      // Save quote items
      for (const item of this.quoteItems) {
        await window.db.createQuoteItem({
          quote_id: quoteId,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        });
      }

      window.ui.showNotification(
        this.currentQuote ? 'Quote updated successfully' : 'Quote created successfully', 
        'success'
      );
      
      window.ui.closeModal();
      
      // Refresh quotes view if currently active
      if (window.ui.currentView === 'quotes') {
        await window.ui.loadQuotesData();
      }

    } catch (error) {
      console.error('Error saving quote:', error);
      window.ui.showNotification('Failed to save quote', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.currentQuote ? 'Update Quote' : 'Create Quote';
    }
  }

  generateQuoteNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    
    return `Q${year}${month}${day}-${time}`;
  }

  getDefaultValidUntil() {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  }
}

// Initialize quotes manager
window.quotesManager = new QuotesManager();

