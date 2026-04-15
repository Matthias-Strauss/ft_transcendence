FROM node:20-alpine

WORKDIR /app

ENV CI=true \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY package.json ./
COPY package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
