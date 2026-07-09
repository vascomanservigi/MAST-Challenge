const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let robotData = null;
let backgroundUrl = '';

app.get('/api/background', (req, res) => {
  res.json({ background: backgroundUrl });
});

app.post('/api/background', (req, res) => {
  backgroundUrl = req.body.background;
  res.json({ success: true, background: backgroundUrl });
});

app.get('/api', (req, res) => {
  if (robotData) {
    res.json(robotData);
  } else {
    res.json({
      atto: "I",
      titolo: "L'Incoronazione",
      pensiero: "In attesa di dati dal robot...",
      status: "offline"
    });
  }
});

app.post('/api', (req, res) => {
  robotData = req.body;
  res.json({ success: true, data: robotData });
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
