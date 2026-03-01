FROM nginx:1.29.5-alpine

RUN apk add --no-cache openssl

COPY default.conf /etc/nginx/conf.d/default.conf

COPY cert-setup.sh /cert-setup.sh
RUN chmod +x /cert-setup.sh

ENTRYPOINT [ "/cert-setup.sh" ]
CMD [ "nginx", "-g", "daemon off;" ]