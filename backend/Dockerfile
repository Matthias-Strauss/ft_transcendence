FROM node:20-alpine

WORKDIR /app

ENV CI=true \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY package.json ./
COPY package-lock.json ./
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY assets ./assets

RUN npm run build

EXPOSE 8080

CMD ["sh", "-c", "npm run prisma:migrate && if [ \"$PRISMA_SEED\" = \"1\" ]; then npm run prisma:seed; fi && node dist/index.js"]
