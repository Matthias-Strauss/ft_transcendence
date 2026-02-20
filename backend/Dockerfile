# Backend Docker Container

FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install
RUN npm run build

EXPOSE 8080

CMD sh -c "npm run prisma:migrate && npm run prisma:seed && node dist/index.js"
