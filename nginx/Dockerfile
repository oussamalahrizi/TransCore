FROM debian:bullseye

RUN apt update && apt upgrade -y && apt install nginx curl -y


COPY conf/nginx.conf /etc/nginx/nginx.conf

ENTRYPOINT [ "nginx", "-g", "daemon off;" ]