FROM node:18-alpine

WORKDIR /app

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 빌드
RUN CI=false npm run build

# 포트 설정
EXPOSE $PORT

# Express 서버 시작
CMD ["node", "server.js"]