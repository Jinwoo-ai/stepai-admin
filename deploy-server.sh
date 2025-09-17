#!/bin/bash

# StepAI Admin 배포 스크립트

echo "🚀 StepAI Admin 배포 시작..."

# 서버 IP 입력받기
read -p "서버 IP 주소를 입력하세요: " SERVER_IP

# 환경변수 파일 업데이트
echo "📝 환경변수 설정 중..."
cat > .env.production << EOF
REACT_APP_API_BASE_URL=http://${SERVER_IP}:3004
HOST=0.0.0.0
PORT=3005
EOF

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 개발 서버로 실행하는 경우
if [ "$1" = "dev" ]; then
    echo "🔄 개발 서버 모드로 실행..."
    HOST=0.0.0.0 PORT=3005 REACT_APP_API_BASE_URL=http://${SERVER_IP}:3004 npm start
else
    # 프로덕션 빌드
    echo "🔨 프로덕션 빌드 중..."
    CI=false REACT_APP_API_BASE_URL=http://${SERVER_IP}:3004 npm run build
    
    # Nginx 설정 파일 생성
    echo "🌐 Nginx 설정 파일 생성..."
    cat > stepai-admin.nginx << EOF
server {
    listen 3005;
    server_name _;
    
    root $(pwd)/build;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://${SERVER_IP}:3004;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
    
    # 방화벽 포트 열기
    echo "🔓 방화벽 포트 3005 열기..."
    sudo ufw allow 3005 2>/dev/null || sudo firewall-cmd --permanent --add-port=3005/tcp 2>/dev/null || true
    sudo ufw reload 2>/dev/null || sudo firewall-cmd --reload 2>/dev/null || true
    
    echo "✅ StepAI Admin 빌드 완료!"
    echo "📁 빌드 파일: $(pwd)/build"
    echo "🌐 Nginx 설정: $(pwd)/stepai-admin.nginx"
    echo ""
    echo "다음 명령어로 Nginx에 설정을 적용하세요:"
    echo "sudo cp stepai-admin.nginx /etc/nginx/sites-available/"
    echo "sudo ln -s /etc/nginx/sites-available/stepai-admin.nginx /etc/nginx/sites-enabled/"
    echo "sudo nginx -t && sudo systemctl reload nginx"
fi

echo ""
echo "🎉 배포 완료!"
echo "🌐 외부 접근: http://${SERVER_IP}:3005"