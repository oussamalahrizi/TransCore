FROM debian:bullseye

RUN apt update && apt upgrade -y && apt install nginx curl -y


COPY conf/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/images
RUN chmod -R 755 /var/images

ENTRYPOINT [ "nginx", "-g", "daemon off;" ]