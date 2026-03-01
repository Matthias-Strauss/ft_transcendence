#!/bin/sh

echo "Proxy-Setup: running certificate setup..."
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/transcendence-selfsigned.crt"
KEY_FILE="$CERT_DIR/transcendence-selfsigned.key"

mkdir -p $CERT_DIR

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Proxy-Setup: generating new self-signed certificate..."

  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $KEY_FILE \
    -out $CERT_FILE \
    -subj "/C=DE/ST=BW/L=HN/O=transcendence/CN=localhost"

  echo "Proxy-Setup: certificate generated."
else
  echo "Proxy-Setup: certificate already exists."
fi

echo "Proxy-Setup: complete. Start nginx..."
exec "$@"