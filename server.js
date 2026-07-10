const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.raw({ type: '*/*' }));

let robotData = [];
let backgroundUrl = '';

app.get('/api/background', (req, res) => {
  res.json({ background: backgroundUrl });
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
  var data = req.body;
  
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = { pensiero: data };
    }
  } else if (Buffer.isBuffer(data)) {
    var str = data.toString();
    try {
      data = JSON.parse(str);
    } catch (e) {
      data = { pensiero: str };
    }
  }
  
  if (!data || Object.keys(data).length === 0) {
    data = { pensiero: "Messaggio vuoto" };
  }
  
  // Se c'è il campo "Data", converte in "pensiero"
  if (data.Data) {
    data.pensiero = data.Data;
  }
  
  robotData.push(data);
  console.log('Messaggio ricevuto:', data);
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
