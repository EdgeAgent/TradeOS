// Schedule management module for TRADE OS

class ScheduleManager {
  constructor() {
    this.currentEvent = null;
    this.currentDate = new Date();
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Quick action buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="schedule-appointment"]')) {
        this.showAppointmentModal();
      }
    });

    // New appointment button
    const newAppointmentBtn = document.getElementById('new-appointment-btn');
    if (newAppointmentBtn) {
      newAppointmentBtn.addEventListener('click', () => this.showAppointmentModal());
    }

    // Calendar day clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('.calendar-day')) {
        const calendarDay = e.target.closest('.calendar-day');
        const date = calendarDay.dataset.date;
        if (date) {
          this.showAppointmentModal(null, date);
        }
      }
    });
  }

  async showAppointmentModal(eventId = null, selectedDate = null) {
    this.currentEvent = null;

    if (eventId) {
      this.currentEvent = await this.getScheduleEvent(eventId);
    }

    const clients = await window.db.getClients();
    const jobs = await window.db.getJobs();
    const modalContent = this.generateAppointmentModalContent(clients, jobs, selectedDate);
    
    window.ui.showModal('quote-modal', modalContent);
    this.setupAppointmentFormHandlers();
    
    if (this.currentEvent) {
      this.populateAppointmentForm();
    }
  }

  generateAppointmentModalContent(clients, jobs, selectedDate = null) {
    const isEdit = !!this.currentEvent;
    const title = isEdit ? 'Edit Appointment' : 'Schedule New Appointment';

    // Default date and time
    const defaultDate = selectedDate || new Date().toISOString().split('T')[0];
    const defaultStartTime = this.currentEvent?.start_datetime ? 
      new Date(this.currentEvent.start_datetime).toTimeString().slice(0, 5) : '09:00';
    const defaultEndTime = this.currentEvent?.end_datetime ? 
      new Date(this.currentEvent.end_datetime).toTimeString().slice(0, 5) : '17:00';

    return `
      <form id="appointment-form" class="appointment-form">
        <div class="form-row full-width">
          <div class="form-group">
            <label for="appointment-title">Appointment Title *</label>
            <input type="text" id="appointment-title" name="title" required 
                   value="${this.currentEvent?.title || ''}" 
                   placeholder="e.g., Kitchen Installation - Smith Residence">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="appointment-client">Client</label>
            <select id="appointment-client" name="client_id">
              <option value="">Select a client (optional)</option>
              ${clients.map(client => `
                <option value="${client.id}" ${this.currentEvent?.client_id == client.id ? 'selected' : ''}>
                  ${client.name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="appointment-job">Related Job</label>
            <select id="appointment-job" name="job_id">
              <option value="">Select a job (optional)</option>
              ${jobs.map(job => `
                <option value="${job.id}" ${this.currentEvent?.job_id == job.id ? 'selected' : ''}>
                  ${job.title}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="appointment-date">Date *</label>
            <input type="date" id="appointment-date" name="date" required 
                   value="${selectedDate || (this.currentEvent?.start_datetime ? this.currentEvent.start_datetime.split('T')[0] : defaultDate)}">
          </div>
          <div class="form-group">
            <label for="appointment-status">Status</label>
            <select id="appointment-status" name="status">
              <option value="scheduled" ${this.currentEvent?.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="confirmed" ${this.currentEvent?.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="in-progress" ${this.currentEvent?.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${this.currentEvent?.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="cancelled" ${this.currentEvent?.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="appointment-start-time">Start Time *</label>
            <input type="time" id="appointment-start-time" name="start_time" required 
                   value="${defaultStartTime}">
          </div>
          <div class="form-group">
            <label for="appointment-end-time">End Time *</label>
            <input type="time" id="appointment-end-time" name="end_time" required 
                   value="${defaultEndTime}">
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="appointment-location">Location</label>
            <input type="text" id="appointment-location" name="location" 
                   value="${this.currentEvent?.location || ''}" 
                   placeholder="Job site address or meeting location">
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="appointment-crew">Crew Members</label>
            <input type="text" id="appointment-crew" name="crew_members" 
                   value="${this.currentEvent?.crew_members || ''}" 
                   placeholder="John, Mike, Sarah (comma-separated)">
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="appointment-description">Description</label>
            <textarea id="appointment-description" name="description" rows="3" 
                      placeholder="Appointment details, special instructions, etc...">${this.currentEvent?.description || ''}</textarea>
          </div>
        </div>

        <div class="form-row full-width">
          <div class="form-group">
            <label for="appointment-notes">Notes</label>
            <textarea id="appointment-notes" name="notes" rows="3" 
                      placeholder="Internal notes, reminders, etc...">${this.currentEvent?.notes || ''}</textarea>
          </div>
        </div>

        <!-- Quick Time Presets -->
        <div class="time-presets">
          <h4>Quick Time Presets</h4>
          <div class="preset-buttons">
            <button type="button" class="btn btn-secondary preset-btn" data-start="08:00" data-end="12:00">
              Morning (8 AM - 12 PM)
            </button>
            <button type="button" class="btn btn-secondary preset-btn" data-start="13:00" data-end="17:00">
              Afternoon (1 PM - 5 PM)
            </button>
            <button type="button" class="btn btn-secondary preset-btn" data-start="09:00" data-end="17:00">
              Full Day (9 AM - 5 PM)
            </button>
            <button type="button" class="btn btn-secondary preset-btn" data-start="18:00" data-end="20:00">
              Evening (6 PM - 8 PM)
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.ui.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Update Appointment' : 'Schedule Appointment'}
          </button>
          ${isEdit ? `
            <button type="button" class="btn btn-danger" onclick="window.scheduleManager.deleteAppointment(${this.currentEvent.id})">
              <i class="fas fa-trash"></i> Delete
            </button>
          ` : ''}
        </div>
      </form>
    `;
  }

  setupAppointmentFormHandlers() {
    const form = document.getElementById('appointment-form');
    
    // Form submission
    form.addEventListener('submit', (e) => this.handleAppointmentSubmit(e));

    // Client selection auto-fills job dropdown
    const clientSelect = document.getElementById('appointment-client');
    const jobSelect = document.getElementById('appointment-job');
    
    clientSelect.addEventListener('change', async (e) => {
      const clientId = e.target.value;
      if (clientId) {
        await this.updateJobOptions(clientId);
        
        // Auto-fill location from client address
        const client = await window.db.getClient(clientId);
        if (client && client.address) {
          const locationInput = document.getElementById('appointment-location');
          if (!locationInput.value) {
            const fullAddress = [client.address, client.city, client.state].filter(Boolean).join(', ');
            locationInput.value = fullAddress;
          }
        }
      }
    });

    // Time preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const startTime = btn.dataset.start;
        const endTime = btn.dataset.end;
        
        document.getElementById('appointment-start-time').value = startTime;
        document.getElementById('appointment-end-time').value = endTime;
      });
    });

    // Auto-calculate end time when start time changes
    const startTimeInput = document.getElementById('appointment-start-time');
    const endTimeInput = document.getElementById('appointment-end-time');
    
    startTimeInput.addEventListener('change', (e) => {
      if (!endTimeInput.value || endTimeInput.value <= e.target.value) {
        const startTime = new Date(`2000-01-01T${e.target.value}`);
        startTime.setHours(startTime.getHours() + 4); // Default 4-hour duration
        endTimeInput.value = startTime.toTimeString().slice(0, 5);
      }
    });
  }

  async updateJobOptions(clientId) {
    const jobSelect = document.getElementById('appointment-job');
    
    try {
      const clientJobs = await window.db.query(
        'SELECT * FROM jobs WHERE client_id = ? ORDER BY created_at DESC',
        [clientId]
      );

      // Clear existing options except the first one
      jobSelect.innerHTML = '<option value="">Select a job (optional)</option>';
      
      // Add client's jobs
      clientJobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = job.title;
        jobSelect.appendChild(option);
      });

    } catch (error) {
      console.error('Error loading client jobs:', error);
    }
  }

  populateAppointmentForm() {
    if (!this.currentEvent) return;

    const form = document.getElementById('appointment-form');
    
    // Populate basic fields
    Object.keys(this.currentEvent).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = this.currentEvent[key] || '';
      }
    });

    // Handle datetime fields
    if (this.currentEvent.start_datetime) {
      const startDate = new Date(this.currentEvent.start_datetime);
      document.getElementById('appointment-date').value = startDate.toISOString().split('T')[0];
      document.getElementById('appointment-start-time').value = startDate.toTimeString().slice(0, 5);
    }

    if (this.currentEvent.end_datetime) {
      const endDate = new Date(this.currentEvent.end_datetime);
      document.getElementById('appointment-end-time').value = endDate.toTimeString().slice(0, 5);
    }
  }

  async handleAppointmentSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      // Prepare appointment data
      const date = formData.get('date');
      const startTime = formData.get('start_time');
      const endTime = formData.get('end_time');

      const startDateTime = `${date}T${startTime}:00`;
      const endDateTime = `${date}T${endTime}:00`;

      // Validate times
      if (startTime >= endTime) {
        throw new Error('End time must be after start time');
      }

      const appointmentData = {
        title: formData.get('title'),
        description: formData.get('description'),
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        client_id: formData.get('client_id') ? parseInt(formData.get('client_id')) : null,
        job_id: formData.get('job_id') ? parseInt(formData.get('job_id')) : null,
        location: formData.get('location'),
        crew_members: formData.get('crew_members'),
        status: formData.get('status'),
        notes: formData.get('notes')
      };

      if (this.currentEvent) {
        // Update existing appointment
        await this.updateScheduleEvent(this.currentEvent.id, appointmentData);
        window.ui.showNotification('Appointment updated successfully', 'success');
      } else {
        // Create new appointment
        await window.db.createScheduleEvent(appointmentData);
        window.ui.showNotification('Appointment scheduled successfully', 'success');
      }
      
      window.ui.closeModal();
      
      // Refresh schedule view if currently active
      if (window.ui.currentView === 'schedule') {
        await window.ui.loadScheduleData();
      }

      // Refresh dashboard if currently active
      if (window.ui.currentView === 'dashboard') {
        await window.ui.loadDashboardData();
      }

    } catch (error) {
      console.error('Error saving appointment:', error);
      window.ui.showNotification(error.message || 'Failed to save appointment', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.currentEvent ? 'Update Appointment' : 'Schedule Appointment';
    }
  }

  async getScheduleEvent(id) {
    try {
      const events = await window.db.query(
        `SELECT s.*, c.name as client_name, j.title as job_title 
         FROM schedule_events s 
         LEFT JOIN clients c ON s.client_id = c.id 
         LEFT JOIN jobs j ON s.job_id = j.id 
         WHERE s.id = ?`,
        [id]
      );
      return events[0] || null;
    } catch (error) {
      console.error('Error getting schedule event:', error);
      return null;
    }
  }

  async updateScheduleEvent(id, eventData) {
    try {
      await window.db.query(
        `UPDATE schedule_events SET 
         title = ?, description = ?, start_datetime = ?, end_datetime = ?, 
         client_id = ?, job_id = ?, location = ?, crew_members = ?, 
         status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          eventData.title, eventData.description, eventData.start_datetime, eventData.end_datetime,
          eventData.client_id, eventData.job_id, eventData.location, eventData.crew_members,
          eventData.status, eventData.notes, id
        ]
      );
      return true;
    } catch (error) {
      console.error('Error updating schedule event:', error);
      throw error;
    }
  }

  async deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    try {
      await window.db.query('DELETE FROM schedule_events WHERE id = ?', [id]);
      
      window.ui.showNotification('Appointment deleted successfully', 'success');
      window.ui.closeModal();
      
      // Refresh schedule view
      if (window.ui.currentView === 'schedule') {
        await window.ui.loadScheduleData();
      }

    } catch (error) {
      console.error('Error deleting appointment:', error);
      window.ui.showNotification('Failed to delete appointment', 'error');
    }
  }

  // Calendar navigation helpers
  navigateToDate(date) {
    this.currentDate = new Date(date);
    if (window.ui.currentView === 'schedule') {
      window.ui.renderCalendar();
    }
  }

  goToToday() {
    this.navigateToDate(new Date());
  }

  // Appointment conflict detection
  async checkForConflicts(startDateTime, endDateTime, excludeEventId = null) {
    try {
      let sql = `
        SELECT * FROM schedule_events 
        WHERE (
          (start_datetime <= ? AND end_datetime > ?) OR
          (start_datetime < ? AND end_datetime >= ?) OR
          (start_datetime >= ? AND end_datetime <= ?)
        )
      `;
      let params = [startDateTime, startDateTime, endDateTime, endDateTime, startDateTime, endDateTime];

      if (excludeEventId) {
        sql += ' AND id != ?';
        params.push(excludeEventId);
      }

      const conflicts = await window.db.query(sql, params);
      return conflicts;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return [];
    }
  }

  // Export schedule to calendar formats
  async exportSchedule(startDate, endDate, format = 'ics') {
    try {
      const events = await window.db.getScheduleEvents(startDate, endDate);
      
      if (format === 'ics') {
        const icsContent = this.generateICSContent(events);
        this.downloadFile(icsContent, `schedule_${startDate}_${endDate}.ics`, 'text/calendar');
      } else if (format === 'csv') {
        const csvContent = this.generateScheduleCSV(events);
        this.downloadFile(csvContent, `schedule_${startDate}_${endDate}.csv`, 'text/csv');
      }

      window.ui.showNotification('Schedule exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting schedule:', error);
      window.ui.showNotification('Failed to export schedule', 'error');
    }
  }

  generateICSContent(events) {
    const icsEvents = events.map(event => {
      const startDate = new Date(event.start_datetime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(event.end_datetime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return [
        'BEGIN:VEVENT',
        `UID:${event.id}@tradeos.local`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `LOCATION:${event.location || ''}`,
        'END:VEVENT'
      ].join('\r\n');
    }).join('\r\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TRADE OS//Schedule Export//EN',
      icsEvents,
      'END:VCALENDAR'
    ].join('\r\n');
  }

  generateScheduleCSV(events) {
    const headers = ['Title', 'Start Date', 'Start Time', 'End Date', 'End Time', 'Client', 'Location', 'Status', 'Description'];
    const rows = events.map(event => {
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime);
      
      return [
        event.title,
        startDate.toLocaleDateString(),
        startDate.toLocaleTimeString(),
        endDate.toLocaleDateString(),
        endDate.toLocaleTimeString(),
        event.client_name || '',
        event.location || '',
        event.status,
        event.description || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize schedule manager
window.scheduleManager = new ScheduleManager();

