const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

const port = process.env.PORT || 3000;

// API 프록시 설정 - multipart 데이터 지원
app.use('/api', createProxyMiddleware({
  target: 'http://115.85.182.98:3004',
  changeOrigin: true,
  timeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Proxy request failed' 
    });
  }
}));

// 업로드된 파일 프록시
app.use('/uploads', createProxyMiddleware({
  target: 'http://115.85.182.98:3004',
  changeOrigin: true,
  timeout: 30000
}));


// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'build')));

// SPA를 위한 fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});