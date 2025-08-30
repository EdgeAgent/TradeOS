const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Keep a global reference of the window object
let mainWindow;
let db;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  mainWindow.loadFile('src/index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Initialize database
  initializeDatabase();
}

function initializeDatabase() {
  const dbPath = path.join(__dirname, 'data', 'trade-os.db');
  
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);
  
  // Create tables
  createTables();
}

function createTables() {
  // Settings table for API keys and configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'quoted',
      start_date DATE,
      end_date DATE,
      estimated_hours REAL,
      actual_hours REAL,
      estimated_cost REAL,
      actual_cost REAL,
      profit_margin REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Quotes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      job_id INTEGER,
      quote_number TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      valid_until DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id),
      FOREIGN KEY (job_id) REFERENCES jobs (id)
    )
  `);

  // Quote line items
  db.exec(`
    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER,
      description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes (id)
    )
  `);

  // Invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      job_id INTEGER,
      quote_id INTEGER,
      invoice_number TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      due_date DATE,
      paid_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id),
      FOREIGN KEY (job_id) REFERENCES jobs (id),
      FOREIGN KEY (quote_id) REFERENCES quotes (id)
    )
  `);

  // Schedule/Calendar events
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_datetime DATETIME,
      end_datetime DATETIME,
      job_id INTEGER,
      client_id INTEGER,
      location TEXT,
      crew_members TEXT,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs (id),
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      date DATE,
      receipt_path TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs (id)
    )
  `);

  // Insert default settings
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('ai_provider', 'openai');
  insertSetting.run('openai_api_key', '');
  insertSetting.run('groq_api_key', '');
  insertSetting.run('company_name', 'Your Trade Company');
  insertSetting.run('company_email', '');
  insertSetting.run('company_phone', '');
  insertSetting.run('company_address', '');
  insertSetting.run('tax_rate', '8.5');
  insertSetting.run('default_profit_margin', '25');
}

// IPC handlers for database operations
ipcMain.handle('db-query', async (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toLowerCase().startsWith('select')) {
      return stmt.all(params);
    } else {
      return stmt.run(params);
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
});

ipcMain.handle('get-setting', async (event, key) => {
  try {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key);
    return result ? result.value : null;
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
});

ipcMain.handle('set-setting', async (event, key, value) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    return stmt.run(key, value);
  } catch (error) {
    console.error('Error setting value:', error);
    throw error;
  }
});

// AI API integration
ipcMain.handle('ai-generate-quote', async (event, projectDescription, clientHistory = []) => {
  try {
    const aiProvider = await getSetting('ai_provider');
    const apiKey = await getSetting(`${aiProvider}_api_key`);
    
    if (!apiKey) {
      throw new Error('AI API key not configured. Please set up your API key in Settings.');
    }

    let response;
    if (aiProvider === 'openai') {
      response = await generateQuoteWithOpenAI(apiKey, projectDescription, clientHistory);
    } else if (aiProvider === 'groq') {
      response = await generateQuoteWithGroq(apiKey, projectDescription, clientHistory);
    } else {
      throw new Error('Unsupported AI provider');
    }

    return response;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
});

async function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key);
  return result ? result.value : null;
}

async function generateQuoteWithOpenAI(apiKey, projectDescription, clientHistory) {
  const fetch = require('node-fetch');
  
  const prompt = `You are an expert contractor estimator. Based on the following project description and client history, provide a detailed quote breakdown.

Project Description: ${projectDescription}

Client History: ${JSON.stringify(clientHistory)}

Please provide a JSON response with the following structure:
{
  "items": [
    {
      "description": "Item description",
      "quantity": 1,
      "unit_price": 100.00,
      "category": "labor|materials|equipment"
    }
  ],
  "estimated_hours": 40,
  "risk_factors": ["factor1", "factor2"],
  "recommendations": "Additional recommendations",
  "confidence_level": "high|medium|low"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a professional contractor estimator.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function generateQuoteWithGroq(apiKey, projectDescription, clientHistory) {
  const fetch = require('node-fetch');
  
  const prompt = `You are an expert contractor estimator. Based on the following project description and client history, provide a detailed quote breakdown.

Project Description: ${projectDescription}

Client History: ${JSON.stringify(clientHistory)}

Please provide a JSON response with the following structure:
{
  "items": [
    {
      "description": "Item description",
      "quantity": 1,
      "unit_price": 100.00,
      "category": "labor|materials|equipment"
    }
  ],
  "estimated_hours": 40,
  "risk_factors": ["factor1", "factor2"],
  "recommendations": "Additional recommendations",
  "confidence_level": "high|medium|low"
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: 'You are a professional contractor estimator.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Quote',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-quote');
          }
        },
        {
          label: 'New Job',
          accelerator: 'CmdOrCtrl+J',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-job');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-action', 'settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('menu-action', 'dashboard');
          }
        },
        {
          label: 'Quotes',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('menu-action', 'quotes');
          }
        },
        {
          label: 'Jobs',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('menu-action', 'jobs');
          }
        },
        {
          label: 'Schedule',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.webContents.send('menu-action', 'schedule');
          }
        },
        {
          label: 'Clients',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            mainWindow.webContents.send('menu-action', 'clients');
          }
        },
        {
          label: 'Invoices',
          accelerator: 'CmdOrCtrl+6',
          click: () => {
            mainWindow.webContents.send('menu-action', 'invoices');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About TRADE OS',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About TRADE OS',
              message: 'TRADE OS v1.0.0',
              detail: 'The essential operating system for specialty trade contractors.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createMenu();
});

