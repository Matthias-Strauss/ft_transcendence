FROM nginx:1.29.5-alpine

RUN apk add --no-cache openssl

COPY default.conf.template /etc/nginx/templates/default.conf.template

COPY --chmod=755 proxy-setup.sh /proxy-setup.sh

ENTRYPOINT [ "/proxy-setup.sh" ]
CMD [ "nginx", "-g", "daemon off;" ]
