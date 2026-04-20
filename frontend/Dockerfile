FROM node:20-alpine AS build

WORKDIR /app

ENV CI=true \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . ./
RUN npm run build

FROM nginx:1.29.5-alpine

ENV FRONTEND_PORT=3000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
