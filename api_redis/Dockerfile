FROM debian:bullseye

RUN apt update -y && apt upgrade -y

RUN apt install redis-server -y

COPY ./tools/init.sh /bin/init.sh

RUN chmod +x /bin/init.sh
RUN rm /etc/redis/redis.conf


ENTRYPOINT ["/bin/init.sh"]

CMD ["redis-server","--protected-mode", "no", "--bind", "0.0.0.0", "--port", "6379"]
