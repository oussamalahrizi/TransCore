FROM debian:bullseye

RUN apt update -y && apt upgrade -y

RUN apt install redis-server -y

COPY ./tools/init.sh /bin/init.sh

RUN chmod +x /bin/init.sh

ENTRYPOINT ["/bin/init.sh"]
