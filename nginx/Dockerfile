FROM debian:bullseye

RUN apt update && apt upgrade -y && apt install nginx openssl curl -y

RUN openssl req -x509 -newkey rsa:4096 -keyout /etc/ssl/private/olahrizi.key -out /etc/ssl/certs/olahrizi.crt -days 365 -nodes \
    -subj \
    "/C=MA/L=Benguerir/O=1337 School/CN=olahrizi.42.fr/emailAddress=olahrizi@student.1337.ma"

COPY conf/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/images
RUN chmod -R 755 /var/images

ENTRYPOINT [ "nginx", "-g", "daemon off;" ]