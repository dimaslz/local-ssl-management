FROM nginx

RUN rm -f /etc/nginx/conf.d/default.conf

WORKDIR /var/www/html
COPY index.html /var/www/html
RUN chmod 755 /var/www/html/index.html

COPY nginx.conf /etc/nginx/conf.d/

COPY ./ssl/local.cv.dimaslz.dev-key.pem /etc/nginx/
COPY ./ssl/local.cv.dimaslz.dev-cert.pem /etc/nginx/

COPY ./ssl/local.dimaslz.io-key.pem /etc/nginx/
COPY ./ssl/local.dimaslz.io-cert.pem /etc/nginx/

COPY ./ssl/local.fito-deploy.dimaslz.dev-key.pem /etc/nginx/
COPY ./ssl/local.fito-deploy.dimaslz.dev-cert.pem /etc/nginx/

COPY ./ssl/local.dimaslz.dev_local.dimaslz.com-key.pem /etc/nginx/
COPY ./ssl/local.dimaslz.dev_local.dimaslz.com-cert.pem /etc/nginx/

COPY ./ssl/localhost-key.pem /etc/nginx/
COPY ./ssl/localhost-cert.pem /etc/nginx/

COPY nginx.conf /etc/nginx/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]