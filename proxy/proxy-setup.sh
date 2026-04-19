#!/bin/sh

echo "Proxy-Setup: running certificate setup..."
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/${TLS_CERT_FILE}"
KEY_FILE="$CERT_DIR/${TLS_KEY_FILE}"

mkdir -p $CERT_DIR

TLS_CERT_HOSTS="${TLS_CERT_HOSTS:-localhost,127.0.0.1}"
ENABLE_ADMINER="${ENABLE_ADMINER:-true}"

build_san() {
  SAN=""
  PREV_IFS="$IFS"
  IFS=','
  for host in $TLS_CERT_HOSTS; do
    host_trimmed=$(echo "$host" | xargs)
    if [ -z "$host_trimmed" ]; then
      continue
    fi

    case "$host_trimmed" in
      ''|*[!0-9.]*)
        entry="DNS:$host_trimmed"
        ;;
      *)
        entry="IP:$host_trimmed"
        ;;
    esac

    if [ -z "$SAN" ]; then
      SAN="$entry"
    else
      SAN="$SAN,$entry"
    fi
  done
  IFS="$PREV_IFS"
  echo "$SAN"
}

write_adminer_location_block() {
  case "$(printf '%s' "$ENABLE_ADMINER" | tr '[:upper:]' '[:lower:]')" in
    true)
      cat <<'EOF'
    location = /adminer {
        return 301 /adminer/;
    }

    location ^~ /adminer/ {
        proxy_pass http://adminer:8080/;

        proxy_http_version 1.1;
        proxy_set_header Host               $host;
        proxy_set_header X-Real-IP          $remote_addr;
        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host   $host;
        proxy_set_header X-Forwarded-Port   $server_port;
        proxy_set_header X-Forwarded-Proto  https;
        proxy_redirect off;
    }
EOF
      ;;
    *)
      cat <<'EOF'
    location ^~ /adminer {
        return 404;
    }
EOF
      ;;
  esac
}

get_largest_file_size_limit_bytes() {
  max_size=""

  while IFS='=' read -r name value; do
    case "$name" in
      *_MAX_FILE_SIZE_BYTES)
        case "$value" in
          ''|*[!0-9]*)
            continue
            ;;
        esac

        if [ -z "$max_size" ] || [ "$value" -gt "$max_size" ]; then
          max_size="$value"
        fi
        ;;
    esac
  done <<EOF
$(printenv)
EOF

  if [ -z "$max_size" ]; then
    max_size="${CHAT_PDF_MAX_FILE_SIZE_BYTES:-10485760}"
  fi

  echo "$max_size"
}

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Proxy-Setup: generating new self-signed certificate..."
  SAN_VALUE="$(build_san)"
  echo "Proxy-Setup: TLS_CERT_SAN = $SAN_VALUE"

  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=DE/ST=BW/L=HN/O=transcendence/CN=localhost" \
    -addext "subjectAltName=$SAN_VALUE"

  chmod 600 "$KEY_FILE"
  echo "Proxy-Setup: certificate generated."
else
  echo "Proxy-Setup: certificate already exists."
fi

echo "Proxy-Setup: generating nginx config from template..."
TEMPLATE="/etc/nginx/templates/default.conf.template"
TARGET="/etc/nginx/conf.d/default.conf"

ADMINER_LOCATION_BLOCK="$(write_adminer_location_block)"
PROXY_CLIENT_MAX_BODY_SIZE="$(get_largest_file_size_limit_bytes)"
export ADMINER_LOCATION_BLOCK PROXY_CLIENT_MAX_BODY_SIZE
echo "Proxy-Setup: adminer is $( [ "$(printf '%s' "$ENABLE_ADMINER" | tr '[:upper:]' '[:lower:]')" = "true" ] && echo enabled || echo disabled )"
echo "Proxy-Setup: client_max_body_size = $PROXY_CLIENT_MAX_BODY_SIZE bytes"

envsubst '${PROXY_HTTP_PORT} ${PROXY_HTTPS_PORT} ${TLS_CERT_FILE} ${TLS_KEY_FILE} ${FRONTEND_PORT} ${BACKEND_PORT} ${PROXY_CLIENT_MAX_BODY_SIZE} ${ADMINER_LOCATION_BLOCK}' \
  < "$TEMPLATE" > "$TARGET"

echo "Proxy-Setup: complete. Start nginx..."
exec "$@"
