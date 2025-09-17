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
        'User-Agent': 'StepAI-Admin-Proxy/1.0'
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
      timeout: 30000
    };
    
    const response = await fetch(apiUrl, options);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: `API Error: ${response.status} ${response.statusText}` 
      });
    }
    
    const text = await response.text();
    
    if (!text) {
      return res.json({ success: false, error: 'Empty response from API' });
    }
    
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Response:', text);
      res.status(500).json({ 
        success: false, 
        error: 'Invalid JSON response from API',
        raw: text.substring(0, 200)
      });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Proxy request failed' 
    });
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