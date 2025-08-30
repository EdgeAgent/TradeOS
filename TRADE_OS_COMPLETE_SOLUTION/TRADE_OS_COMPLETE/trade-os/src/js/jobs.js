// Jobs management module for TRADE OS

class JobsManager {
  constructor() {
    this.currentJob = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Quick action buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="new-job"]')) {
        this.showJobModal();
      }
    });

    // New job button
    const newJobBtn = document.getElementById('new-job-btn');
    if (newJobBtn) {
      newJobBtn.addEventListener('click', () => this.showJobModal());
    }
  }

  async showJobModal(jobId = null) {
    this.currentJob = null;

    if (jobId) {
      this.currentJob = await window.db.getJob(jobId);
    }

    const clients = await window.db.getClients();
    const modalContent = this.generateJobModalContent(clients);
    
    window.ui.showModal('quote-modal', modalContent);
    this.setupJobFormHandlers();
    
    if (this.currentJob) {
      this.populateJobForm();
    }
  }

  generateJobModalContent(clients) {
    const isEdit = !!this.currentJob;
    const title = isEdit ? 'Edit Job' : 'Create New Job';

    return `
      <form id="job-form" class="job-form">
        <div class="form-row">
          <div class="form-group">
            <label for="job-client">Client *</label>
            <select id="job-client" name="client_id" required>
              <option value="">Select a client</option>
              ${clients.map(client => `
                <option value="${client.id}" ${this.currentJob?.client_id == client.id ? 'selected' : ''}>
                  ${client.name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="job-status">Status</label>
            <select id="job-status" name="status">
              <option value="quoted" ${this.currentJob?.status === 'quoted' ? 'selected' : ''}>Quoted</option>
              <option value="approved" ${this.currentJob?.status === 'approved' ? 'selected' : ''}>Approved</option>
              <option value="in-progress" ${this.currentJob?.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${this.currentJob?.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${this.currentJob?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="job-title">Job Title *</label>
            <input type="text" id="job-title" name="title" required 
                   value="${this.currentJob?.title || ''}" 
                   placeholder="e.g., Kitchen Renovation - Smith Residence">
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="job-description">Job Description</label>
            <textarea id="job-description" name="description" rows="4" 
                      placeholder="Detailed description of the work to be performed...">${this.currentJob?.description || ''}</textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="job-start-date">Start Date</label>
            <input type="date" id="job-start-date" name="start_date" 
                   value="${this.currentJob?.start_date || ''}">
          </div>
          <div class="form-group">
            <label for="job-end-date">End Date</label>
            <input type="date" id="job-end-date" name="end_date" 
                   value="${this.currentJob?.end_date || ''}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="job-estimated-hours">Estimated Hours</label>
            <input type="number" id="job-estimated-hours" name="estimated_hours" 
                   value="${this.currentJob?.estimated_hours || ''}" 
                   min="0" step="0.5" placeholder="40">
          </div>
          <div class="form-group">
            <label for="job-estimated-cost">Estimated Cost</label>
            <input type="number" id="job-estimated-cost" name="estimated_cost" 
                   value="${this.currentJob?.estimated_cost || ''}" 
                   min="0" step="0.01" placeholder="5000.00">
          </div>
        </div>

        ${isEdit ? `
          <div class="form-row">
            <div class="form-group">
              <label for="job-actual-hours">Actual Hours</label>
              <input type="number" id="job-actual-hours" name="actual_hours" 
                     value="${this.currentJob?.actual_hours || ''}" 
                     min="0" step="0.5" placeholder="42">
            </div>
            <div class="form-group">
              <label for="job-actual-cost">Actual Cost</label>
              <input type="number" id="job-actual-cost" name="actual_cost" 
                     value="${this.currentJob?.actual_cost || ''}" 
                     min="0" step="0.01" placeholder="5200.00">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="job-profit-margin">Profit Margin (%)</label>
              <input type="number" id="job-profit-margin" name="profit_margin" 
                     value="${this.currentJob?.profit_margin || ''}" 
                     min="0" max="100" step="0.1" placeholder="25.0" readonly>
              <small class="help-text">Automatically calculated based on estimated vs actual costs</small>
            </div>
            <div class="form-group">
              <!-- Spacer -->
            </div>
          </div>
        ` : ''}

        <div class="form-row full-width">
          <div class="form-group">
            <label for="job-notes">Notes</label>
            <textarea id="job-notes" name="notes" rows="3" 
                      placeholder="Additional notes, special requirements, etc...">${this.currentJob?.notes || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Update Job' : 'Create Job'}
          </button>
        </div>
      </form>
    `;
  }

  setupJobFormHandlers() {
    const form = document.getElementById('job-form');
    
    // Form submission
    form.addEventListener('submit', (e) => this.handleJobSubmit(e));

    // Auto-calculate profit margin for existing jobs
    if (this.currentJob) {
      const estimatedCostInput = document.getElementById('job-estimated-cost');
      const actualCostInput = document.getElementById('job-actual-cost');
      const profitMarginInput = document.getElementById('job-profit-margin');

      const calculateProfitMargin = () => {
        const estimated = parseFloat(estimatedCostInput.value) || 0;
        const actual = parseFloat(actualCostInput.value) || 0;
        
        if (estimated > 0 && actual > 0) {
          const margin = ((estimated - actual) / estimated) * 100;
          profitMarginInput.value = margin.toFixed(1);
        }
      };

      estimatedCostInput.addEventListener('input', calculateProfitMargin);
      actualCostInput.addEventListener('input', calculateProfitMargin);
    }
  }

  populateJobForm() {
    if (!this.currentJob) return;

    const form = document.getElementById('job-form');
    Object.keys(this.currentJob).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = this.currentJob[key] || '';
      }
    });
  }

  async handleJobSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      // Prepare job data
      const jobData = {
        client_id: parseInt(formData.get('client_id')),
        title: formData.get('title'),
        description: formData.get('description'),
        status: formData.get('status'),
        start_date: formData.get('start_date') || null,
        end_date: formData.get('end_date') || null,
        estimated_hours: parseFloat(formData.get('estimated_hours')) || null,
        estimated_cost: parseFloat(formData.get('estimated_cost')) || null,
        notes: formData.get('notes')
      };

      // Add actual data for existing jobs
      if (this.currentJob) {
        jobData.actual_hours = parseFloat(formData.get('actual_hours')) || null;
        jobData.actual_cost = parseFloat(formData.get('actual_cost')) || null;
        jobData.profit_margin = parseFloat(formData.get('profit_margin')) || null;
      }

      if (this.currentJob) {
        // Update existing job
        await window.db.updateJob(this.currentJob.id, jobData);
        window.ui.showNotification('Job updated successfully', 'success');
      } else {
        // Create new job
        await window.db.createJob(jobData);
        window.ui.showNotification('Job created successfully', 'success');
      }
      
      window.ui.closeModal();
      
      // Refresh jobs view if currently active
      if (window.ui.currentView === 'jobs') {
        await window.ui.loadJobsData();
      }

      // Refresh dashboard if currently active
      if (window.ui.currentView === 'dashboard') {
        await window.ui.loadDashboardData();
      }

    } catch (error) {
      console.error('Error saving job:', error);
      window.ui.showNotification('Failed to save job', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.currentJob ? 'Update Job' : 'Create Job';
    }
  }

  // Job status management
  async updateJobStatus(jobId, newStatus) {
    try {
      const job = await window.db.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      await window.db.updateJob(jobId, { ...job, status: newStatus });
      
      window.ui.showNotification(`Job status updated to ${newStatus}`, 'success');
      
      // Refresh current view
      if (window.ui.currentView === 'jobs') {
        await window.ui.loadJobsData();
      } else if (window.ui.currentView === 'dashboard') {
        await window.ui.loadDashboardData();
      }

    } catch (error) {
      console.error('Error updating job status:', error);
      window.ui.showNotification('Failed to update job status', 'error');
    }
  }

  // Convert quote to job
  async createJobFromQuote(quoteId) {
    try {
      const quote = await window.db.getQuote(quoteId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      const jobData = {
        client_id: quote.client_id,
        title: quote.title,
        description: quote.description,
        status: 'approved',
        estimated_cost: quote.total,
        notes: `Created from quote #${quote.quote_number}\n\n${quote.notes || ''}`
      };

      const jobId = await window.db.createJob(jobData);
      
      // Update quote status
      await window.db.updateQuote(quoteId, { ...quote, status: 'accepted' });

      window.ui.showNotification('Job created from quote successfully', 'success');
      
      return jobId;

    } catch (error) {
      console.error('Error creating job from quote:', error);
      window.ui.showNotification('Failed to create job from quote', 'error');
      return null;
    }
  }

  // Job completion workflow
  async completeJob(jobId) {
    try {
      const job = await window.db.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Show completion form
      const modalContent = this.generateJobCompletionForm(job);
      window.ui.showModal('quote-modal', modalContent);
      this.setupJobCompletionHandlers(jobId);

    } catch (error) {
      console.error('Error showing job completion form:', error);
      window.ui.showNotification('Failed to load job completion form', 'error');
    }
  }

  generateJobCompletionForm(job) {
    return `
      <form id="job-completion-form">
        <h3>Complete Job: ${job.title}</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="completion-actual-hours">Actual Hours Worked</label>
            <input type="number" id="completion-actual-hours" name="actual_hours" 
                   value="${job.actual_hours || ''}" 
                   min="0" step="0.5" required>
          </div>
          <div class="form-group">
            <label for="completion-actual-cost">Actual Total Cost</label>
            <input type="number" id="completion-actual-cost" name="actual_cost" 
                   value="${job.actual_cost || ''}" 
                   min="0" step="0.01" required>
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="completion-notes">Completion Notes</label>
            <textarea id="completion-notes" name="completion_notes" rows="4" 
                      placeholder="Final notes, lessons learned, client feedback, etc..."></textarea>
          </div>
        </div>

        <div class="completion-summary">
          <h4>Job Summary</h4>
          <div class="summary-row">
            <span>Estimated Cost:</span>
            <span>${window.ui.formatCurrency(job.estimated_cost)}</span>
          </div>
          <div class="summary-row">
            <span>Actual Cost:</span>
            <span id="summary-actual-cost">${window.ui.formatCurrency(job.actual_cost)}</span>
          </div>
          <div class="summary-row">
            <span>Profit/Loss:</span>
            <span id="summary-profit" class="profit-positive">$0.00</span>
          </div>
          <div class="summary-row">
            <span>Profit Margin:</span>
            <span id="summary-margin">0.0%</span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-success">
            <i class="fas fa-check"></i> Complete Job
          </button>
        </div>
      </form>
    `;
  }

  setupJobCompletionHandlers(jobId) {
    const form = document.getElementById('job-completion-form');
    const actualCostInput = document.getElementById('completion-actual-cost');
    
    // Update summary when actual cost changes
    const updateSummary = () => {
      const job = this.currentJob;
      const actualCost = parseFloat(actualCostInput.value) || 0;
      const estimatedCost = job.estimated_cost || 0;
      
      const profit = estimatedCost - actualCost;
      const margin = estimatedCost > 0 ? (profit / estimatedCost) * 100 : 0;

      document.getElementById('summary-actual-cost').textContent = window.ui.formatCurrency(actualCost);
      document.getElementById('summary-profit').textContent = window.ui.formatCurrency(profit);
      document.getElementById('summary-margin').textContent = `${margin.toFixed(1)}%`;

      const profitElement = document.getElementById('summary-profit');
      profitElement.className = profit >= 0 ? 'profit-positive' : 'profit-negative';
    };

    actualCostInput.addEventListener('input', updateSummary);
    updateSummary(); // Initial calculation

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Completing...';

        const job = await window.db.getJob(jobId);
        const actualCost = parseFloat(formData.get('actual_cost'));
        const estimatedCost = job.estimated_cost || 0;
        const profitMargin = estimatedCost > 0 ? ((estimatedCost - actualCost) / estimatedCost) * 100 : 0;

        const updateData = {
          ...job,
          status: 'completed',
          actual_hours: parseFloat(formData.get('actual_hours')),
          actual_cost: actualCost,
          profit_margin: profitMargin,
          notes: job.notes + '\n\nCompletion Notes:\n' + formData.get('completion_notes')
        };

        await window.db.updateJob(jobId, updateData);
        
        window.ui.showNotification('Job completed successfully', 'success');
        window.ui.closeModal();
        
        // Refresh current view
        if (window.ui.currentView === 'jobs') {
          await window.ui.loadJobsData();
        } else if (window.ui.currentView === 'dashboard') {
          await window.ui.loadDashboardData();
        }

      } catch (error) {
        console.error('Error completing job:', error);
        window.ui.showNotification('Failed to complete job', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Job';
      }
    });
  }
}

// Initialize jobs manager
window.jobsManager = new JobsManager();

