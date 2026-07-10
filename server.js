const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = path.join(__dirname, 'debug.log');

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
  console.log(message);
}

// Clear log file on startup
fs.writeFileSync(LOG_FILE, '');
logToFile('=== SERVER STARTED ===');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

let robotData = [];
let backgroundUrl = '';

app.get('/api/background', (req, res) => {
  res.json({ background: backgroundUrl });
});

app.get('/api/debug', (req, res) => {
  try {
    const log = fs.readFileSync(LOG_FILE, 'utf8');
    res.type('text/plain').send(log);
  } catch (e) {
    res.status(404).send('Log file not found');
  }
});

app.post('/api/background', (req, res) => {
  backgroundUrl = req.body.background;
  res.json({ success: true, background: backgroundUrl });
});

app.get('/api', (req, res) => {
  console.log('GET /api - robotData length:', robotData.length);
  if (robotData.length > 0) {
    res.json(robotData);
  } else {
    res.json([{
      pensiero: "In attesa di dati dal robot...",
      status: "offline",
      timestamp: new Date().toISOString()
    }]);
  }
});

app.post('/api', (req, res) => {
  logToFile('=== POST /api ===');
  logToFile('Content-Type: ' + req.get('Content-Type'));
  logToFile('req.body type: ' + typeof req.body);
  logToFile('req.body raw: ' + JSON.stringify(req.body));
  logToFile('req.body keys: ' + Object.keys(req.body || {}).join(', '));
  
  var data = req.body;
  
  if (typeof data === 'string') {
    logToFile('Data is string, parsing...');
    try {
      data = JSON.parse(data);
      logToFile('Parsed JSON successfully: ' + JSON.stringify(data));
    } catch (e) {
      logToFile('Parse failed, using as pensiero');
      data = { pensiero: data };
    }
  } else if (Buffer.isBuffer(data)) {
    logToFile('Data is buffer');
    var str = data.toString();
    try {
      data = JSON.parse(str);
      logToFile('Parsed buffer JSON: ' + JSON.stringify(data));
    } catch (e) {
      logToFile('Buffer parse failed');
      data = { pensiero: str };
    }
  }
  
  if (!data) {
    logToFile('ERROR: data is null/undefined');
    data = { pensiero: "Messaggio vuoto - data is null" };
  } else if (Object.keys(data).length === 0) {
    logToFile('ERROR: data has no keys');
    data = { pensiero: "Messaggio vuoto - no keys" };
  }
  
  if (data.Data) {
    logToFile('Converting Data to pensiero: ' + data.Data);
    data.pensiero = data.Data;
  }
  
  logToFile('FINAL DATA: ' + JSON.stringify(data));
  robotData.push(data);
  res.json({ success: true, data: data });
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Handle HTML routes (without .html extension)
app.get(['/sfondo', '/admin', '/team', '/progetto', '/api-page'], (req, res) => {
  const page = req.path.replace('/', '') + '.html';
  res.sendFile(path.join(__dirname, page));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Ready to receive robot data!');
});
