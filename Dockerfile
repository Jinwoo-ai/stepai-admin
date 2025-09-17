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

# serve 패키지 전역 설치
RUN npm install -g serve

# 포트 설정
EXPOSE $PORT

# 정적 파일 서빙
CMD ["sh", "-c", "serve -s build -l $PORT"]