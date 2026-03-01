#!/bin/sh

echo "Proxy-Setup: running certificate setup..."
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/${TLS_CERT_FILE}"
KEY_FILE="$CERT_DIR/${TLS_KEY_FILE}"

mkdir -p $CERT_DIR

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Proxy-Setup: generating new self-signed certificate..."

  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $KEY_FILE \
    -out $CERT_FILE \
    -subj "/C=DE/ST=BW/L=HN/O=transcendence/CN=localhost"

  chmod 600 "$KEY_FILE"
  echo "Proxy-Setup: certificate generated."
else
  echo "Proxy-Setup: certificate already exists."
fi

echo "Proxy-Setup: generating nginx config from template..."
TEMPLATE="/etc/nginx/templates/default.conf.template"
TARGET="/etc/nginx/conf.d/default.conf"
envsubst '${PROXY_HTTP_PORT} ${PROXY_HTTPS_PORT} ${TLS_CERT_FILE} ${TLS_KEY_FILE} ${FRONTEND_PORT}' \
  < "$TEMPLATE" > "$TARGET"

echo "Proxy-Setup: complete. Start nginx..."
exec "$@"