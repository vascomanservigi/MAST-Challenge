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
app.use(express.raw({ type: '*/*', limit: '10mb' }));

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
  
  var data = req.body;
  
  // Caso 1: Buffer raw (quando arriva senza Content-Type specifico)
  if (Buffer.isBuffer(req.body)) {
    logToFile('Data is buffer');
    var str = req.body.toString('utf8').trim();
    logToFile('Buffer as string: ' + str);
    try {
      data = JSON.parse(str);
      logToFile('Parsed buffer as JSON');
    } catch (e) {
      logToFile('Buffer parse failed, using as string');
      data = { pensiero: str };
    }
  }
  // Caso 2: Stringa (text/plain o raw string)
  else if (typeof req.body === 'string') {
    logToFile('Data is string: ' + req.body);
    try {
      data = JSON.parse(req.body.trim());
      logToFile('Parsed string as JSON');
    } catch (e) {
      logToFile('String parse failed, using as pensiero');
      data = { pensiero: req.body };
    }
  }
  // Caso 3: Oggetto JSON già parsato
  else if (typeof req.body === 'object' && req.body !== null) {
    logToFile('Data is object with keys: ' + Object.keys(req.body).join(', '));
    
    // Se l'oggetto è vuoto, potrebbe essere che il form-urlencoded ha fallito
    if (Object.keys(req.body).length === 0) {
      logToFile('Object is empty - trying to read raw body');
      // Express popola req.rawBody se usiamo express.raw()
      if (req.rawBody) {
        logToFile('Found rawBody: ' + req.rawBody);
        try {
          data = JSON.parse(req.rawBody);
          logToFile('Parsed rawBody as JSON');
        } catch (e) {
          logToFile('rawBody parse failed');
          data = { pensiero: req.rawBody };
        }
      } else {
        logToFile('No rawBody found');
      }
    }
  }
  
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    logToFile('ERROR: data is empty after all parsing attempts');
    data = { pensiero: "Messaggio vuoto" };
  }
  
  if (data.Data) {
    logToFile('Converting Data to pensiero: ' + data.Data);
    data.pensiero = data.Data;
  }
  
  if (data.reason) {
    logToFile('Converting reason to pensiero: ' + data.reason);
    data.pensiero = data.reason;
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
