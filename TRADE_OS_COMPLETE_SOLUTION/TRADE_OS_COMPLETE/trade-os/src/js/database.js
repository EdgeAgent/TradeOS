// Database interaction module for TRADE OS
const { ipcRenderer } = require('electron');

class Database {
  constructor() {
    this.cache = new Map();
  }

  // Generic query method
  async query(sql, params = []) {
    try {
      const result = await ipcRenderer.invoke('db-query', sql, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Settings methods
  async getSetting(key) {
    try {
      const value = await ipcRenderer.invoke('get-setting', key);
      return value;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  async setSetting(key, value) {
    try {
      await ipcRenderer.invoke('set-setting', key, value);
      this.cache.delete('settings'); // Clear cache
      return true;
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  }

  // Client methods
  async getClients() {
    try {
      const clients = await this.query('SELECT * FROM clients ORDER BY name ASC');
      return clients;
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  async getClient(id) {
    try {
      const client = await this.query('SELECT * FROM clients WHERE id = ?', [id]);
      return client[0] || null;
    } catch (error) {
      console.error('Error getting client:', error);
      return null;
    }
  }

  async createClient(clientData) {
    try {
      const { name, email, phone, address, city, state, zip, notes } = clientData;
      const result = await this.query(
        `INSERT INTO clients (name, email, phone, address, city, state, zip, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, address, city, state, zip, notes]
      );
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(id, clientData) {
    try {
      const { name, email, phone, address, city, state, zip, notes } = clientData;
      await this.query(
        `UPDATE clients SET name = ?, email = ?, phone = ?, address = ?, 
         city = ?, state = ?, zip = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name, email, phone, address, city, state, zip, notes, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      return false;
    }
  }

  async deleteClient(id) {
    try {
      await this.query('DELETE FROM clients WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }

  // Job methods
  async getJobs() {
    try {
      const jobs = await this.query(`
        SELECT j.*, c.name as client_name 
        FROM jobs j 
        LEFT JOIN clients c ON j.client_id = c.id 
        ORDER BY j.created_at DESC
      `);
      return jobs;
    } catch (error) {
      console.error('Error getting jobs:', error);
      return [];
    }
  }

  async getJob(id) {
    try {
      const job = await this.query(`
        SELECT j.*, c.name as client_name 
        FROM jobs j 
        LEFT JOIN clients c ON j.client_id = c.id 
        WHERE j.id = ?
      `, [id]);
      return job[0] || null;
    } catch (error) {
      console.error('Error getting job:', error);
      return null;
    }
  }

  async createJob(jobData) {
    try {
      const { 
        client_id, title, description, status, start_date, end_date, 
        estimated_hours, estimated_cost, notes 
      } = jobData;
      const result = await this.query(
        `INSERT INTO jobs (client_id, title, description, status, start_date, 
         end_date, estimated_hours, estimated_cost, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [client_id, title, description, status, start_date, end_date, 
         estimated_hours, estimated_cost, notes]
      );
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async updateJob(id, jobData) {
    try {
      const { 
        client_id, title, description, status, start_date, end_date, 
        estimated_hours, actual_hours, estimated_cost, actual_cost, 
        profit_margin, notes 
      } = jobData;
      await this.query(
        `UPDATE jobs SET client_id = ?, title = ?, description = ?, status = ?, 
         start_date = ?, end_date = ?, estimated_hours = ?, actual_hours = ?, 
         estimated_cost = ?, actual_cost = ?, profit_margin = ?, notes = ?, 
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [client_id, title, description, status, start_date, end_date, 
         estimated_hours, actual_hours, estimated_cost, actual_cost, 
         profit_margin, notes, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating job:', error);
      return false;
    }
  }

  // Quote methods
  async getQuotes() {
    try {
      const quotes = await this.query(`
        SELECT q.*, c.name as client_name 
        FROM quotes q 
        LEFT JOIN clients c ON q.client_id = c.id 
        ORDER BY q.created_at DESC
      `);
      return quotes;
    } catch (error) {
      console.error('Error getting quotes:', error);
      return [];
    }
  }

  async getQuote(id) {
    try {
      const quote = await this.query(`
        SELECT q.*, c.name as client_name 
        FROM quotes q 
        LEFT JOIN clients c ON q.client_id = c.id 
        WHERE q.id = ?
      `, [id]);
      return quote[0] || null;
    } catch (error) {
      console.error('Error getting quote:', error);
      return null;
    }
  }

  async createQuote(quoteData) {
    try {
      const { 
        client_id, job_id, quote_number, title, description, 
        subtotal, tax_rate, tax_amount, total, status, valid_until, notes 
      } = quoteData;
      const result = await this.query(
        `INSERT INTO quotes (client_id, job_id, quote_number, title, description, 
         subtotal, tax_rate, tax_amount, total, status, valid_until, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [client_id, job_id, quote_number, title, description, 
         subtotal, tax_rate, tax_amount, total, status, valid_until, notes]
      );
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  async updateQuote(id, quoteData) {
    try {
      const { 
        client_id, job_id, title, description, subtotal, tax_rate, 
        tax_amount, total, status, valid_until, notes 
      } = quoteData;
      await this.query(
        `UPDATE quotes SET client_id = ?, job_id = ?, title = ?, description = ?, 
         subtotal = ?, tax_rate = ?, tax_amount = ?, total = ?, status = ?, 
         valid_until = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [client_id, job_id, title, description, subtotal, tax_rate, 
         tax_amount, total, status, valid_until, notes, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating quote:', error);
      return false;
    }
  }

  // Quote items methods
  async getQuoteItems(quoteId) {
    try {
      const items = await this.query(
        'SELECT * FROM quote_items WHERE quote_id = ? ORDER BY id ASC',
        [quoteId]
      );
      return items;
    } catch (error) {
      console.error('Error getting quote items:', error);
      return [];
    }
  }

  async createQuoteItem(itemData) {
    try {
      const { quote_id, description, quantity, unit_price, total, category } = itemData;
      const result = await this.query(
        `INSERT INTO quote_items (quote_id, description, quantity, unit_price, total, category) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [quote_id, description, quantity, unit_price, total, category]
      );
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating quote item:', error);
      throw error;
    }
  }

  async updateQuoteItem(id, itemData) {
    try {
      const { description, quantity, unit_price, total, category } = itemData;
      await this.query(
        `UPDATE quote_items SET description = ?, quantity = ?, unit_price = ?, 
         total = ?, category = ? WHERE id = ?`,
        [description, quantity, unit_price, total, category, id]
      );
      return true;
    } catch (error) {
      console.error('Error updating quote item:', error);
      return false;
    }
  }

  async deleteQuoteItem(id) {
    try {
      await this.query('DELETE FROM quote_items WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting quote item:', error);
      return false;
    }
  }

  async deleteQuoteItems(quoteId) {
    try {
      await this.query('DELETE FROM quote_items WHERE quote_id = ?', [quoteId]);
      return true;
    } catch (error) {
      console.error('Error deleting quote items:', error);
      return false;
    }
  }

  // Invoice methods
  async getInvoices() {
    try {
      const invoices = await this.query(`
        SELECT i.*, c.name as client_name 
        FROM invoices i 
        LEFT JOIN clients c ON i.client_id = c.id 
        ORDER BY i.created_at DESC
      `);
      return invoices;
    } catch (error) {
      console.error('Error getting invoices:', error);
      return [];
    }
  }

  async getInvoice(id) {
    try {
      const invoice = await this.query(`
        SELECT i.*, c.name as client_name 
        FROM invoices i 
        LEFT JOIN clients c ON i.client_id = c.id 
        WHERE i.id = ?
      `, [id]);
      return invoice[0] || null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      return null;
    }
  }

  async createInvoice(invoiceData) {
    try {
      const { 
        client_id, job_id, quote_id, invoice_number, title, description, 
        subtotal, tax_rate, tax_amount, total, status, due_date, notes 
      } = invoiceData;
      const result = await this.query(
        `INSERT INTO invoices (client_id, job_id, quote_id, invoice_number, title, 
         description, subtotal, tax_rate, tax_amount, total, status, due_date, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [client_id, job_id, quote_id, invoice_number, title, description, 
         subtotal, tax_rate, tax_amount, total, status, due_date, notes]
      );
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Schedule methods
  async getScheduleEvents(startDate, endDate) {
    try {
      const events = await this.query(`
        SELECT s.*, c.name as client_name, j.title as job_title 
        FROM schedule_events s 
        LEFT JOIN clients c ON s.client_id = c.id 
        LEFT JOIN jobs j ON s.job_id = j.id 
        WHERE DATE(s.start_datetime) BETWEEN ? AND ? 
        ORDER BY s.start_datetime ASC
      `, [startDate, endDate]);
      return events;
    } catch (error) {
      console.error('Error getting schedule events:', error);
      return [];
    }
  }

  async createScheduleEvent(eventData) {
    try {
      const { 
        title, description, start_datetime, end_datetime, job_id, 
        client_id, location, crew_members, status, notes 
      } = eventData;
      const result = await this.query(
        `INSERT INTO schedule_events (title, description, start_datetime, end_datetime, 
         job_id, client_id, location, crew_members, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, start_datetime, end_datetime, job_id, 
         client_id, location, crew_members, status, notes]
      );
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating schedule event:', error);
      throw error;
    }
  }

  // Expense methods
  async getExpenses(jobId = null) {
    try {
      let sql = `
        SELECT e.*, j.title as job_title 
        FROM expenses e 
        LEFT JOIN jobs j ON e.job_id = j.id
      `;
      let params = [];
      
      if (jobId) {
        sql += ' WHERE e.job_id = ?';
        params.push(jobId);
      }
      
      sql += ' ORDER BY e.date DESC';
      
      const expenses = await this.query(sql, params);
      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  async createExpense(expenseData) {
    try {
      const { job_id, description, amount, category, date, receipt_path, notes } = expenseData;
      const result = await this.query(
        `INSERT INTO expenses (job_id, description, amount, category, date, receipt_path, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [job_id, description, amount, category, date, receipt_path, notes]
      );
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  // Dashboard statistics
  async getDashboardStats() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Revenue this month
      const revenueResult = await this.query(`
        SELECT COALESCE(SUM(amount_paid), 0) as revenue 
        FROM invoices 
        WHERE strftime('%Y-%m', paid_date) = ?
      `, [currentMonth]);
      
      // Active quotes
      const quotesResult = await this.query(`
        SELECT COUNT(*) as count 
        FROM quotes 
        WHERE status IN ('draft', 'sent')
      `);
      
      // Active jobs
      const jobsResult = await this.query(`
        SELECT COUNT(*) as count 
        FROM jobs 
        WHERE status IN ('quoted', 'in-progress')
      `);
      
      // Overdue invoices
      const overdueResult = await this.query(`
        SELECT COUNT(*) as count 
        FROM invoices 
        WHERE status != 'paid' AND due_date < DATE('now')
      `);
      
      return {
        revenue: revenueResult[0]?.revenue || 0,
        activeQuotes: quotesResult[0]?.count || 0,
        activeJobs: jobsResult[0]?.count || 0,
        overdueInvoices: overdueResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        revenue: 0,
        activeQuotes: 0,
        activeJobs: 0,
        overdueInvoices: 0
      };
    }
  }

  // AI integration
  async generateQuote(projectDescription, clientId = null) {
    try {
      // Get client history if clientId provided
      let clientHistory = [];
      if (clientId) {
        clientHistory = await this.query(`
          SELECT j.title, j.estimated_cost, j.actual_cost, j.profit_margin 
          FROM jobs j 
          WHERE j.client_id = ? AND j.status = 'completed' 
          ORDER BY j.created_at DESC 
          LIMIT 5
        `, [clientId]);
      }
      
      const result = await ipcRenderer.invoke('ai-generate-quote', projectDescription, clientHistory);
      return result;
    } catch (error) {
      console.error('Error generating AI quote:', error);
      throw error;
    }
  }
}

// Export singleton instance
window.db = new Database();

