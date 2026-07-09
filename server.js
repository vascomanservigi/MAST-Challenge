const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database table
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      INSERT INTO app_state (key, value) 
      VALUES ('background', '') 
      ON CONFLICT (key) DO NOTHING;
    `);
    
    console.log('Database initialized');
  } catch (err) {
    console.error('Database init error:', err);
  }
}

initDB();

// API Routes

// Get background
app.get('/api/background', async (req, res) => {
  try {
    const result = await pool.query('SELECT value FROM app_state WHERE key = $1', ['background']);
    res.json({ background: result.rows[0]?.value || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set background
app.post('/api/background', async (req, res) => {
  try {
    const { background } = req.body;
    await pool.query(
      'INSERT INTO app_state (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      ['background', background]
    );
    res.json({ success: true, background });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get robot data (for thought box)
app.get('/api', async (req, res) => {
  try {
    const result = await pool.query('SELECT value FROM app_state WHERE key = $1', ['robot_data']);
    if (result.rows[0]?.value) {
      res.json(JSON.parse(result.rows[0].value));
    } else {
      res.json({
        atto: "I",
        titolo: "L'Incoronazione",
        pensiero: "In attesa di dati dal robot...",
        status: "offline"
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set robot data (for robot to send data)
app.post('/api', async (req, res) => {
  try {
    const data = req.body;
    await pool.query(
      'INSERT INTO app_state (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      ['robot_data', JSON.stringify(data)]
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Handle HTML routes (without .html extension)
app.get(['/sfondo', '/admin', '/team', '/progetto', '/personaggio', '/demo', '/api-page'], (req, res) => {
  const page = req.path.replace('/', '') + '.html';
  res.sendFile(path.join(__dirname, page));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database URL: ${process.env.DATABASE_URL ? 'configured' : 'not set'}`);
});
