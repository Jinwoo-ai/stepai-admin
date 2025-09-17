const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

// API 프록시 설정
app.use('/api', async (req, res) => {
  const apiUrl = `http://115.85.182.98:3004${req.originalUrl}`;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const options = {
      method: req.method,
      headers: { 
        'Content-Type': 'application/json',
        ...req.headers 
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    };
    
    const response = await fetch(apiUrl, options);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'build')));

// SPA를 위한 fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});