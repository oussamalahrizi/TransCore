FROM debian:bullseye

RUN apt update -y && apt upgrade -y

RUN apt install redis-server -y

COPY ./tools/init.sh /bin/init.sh

RUN chmod +x /bin/init.sh

ENTRYPOINT ["/bin/init.sh"]

CMD ["redis-server","--protected-mode", "no", "--bind", "0.0.0.0", \
	 "--port", "6380", "--dir", "/data", "--save", "60", "1", \
	 "--loglevel", "notice", "--appendonly", "yes", "--appendfilename", "appendonly.aof"]
