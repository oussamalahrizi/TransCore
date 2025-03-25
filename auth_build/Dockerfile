FROM python:3.12-bullseye

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive


WORKDIR /var/app


COPY build/conf/requirements.txt /var



RUN pip install -r /var/requirements.txt

COPY build/tools/init.sh /var	
RUN chmod +x /var/init.sh

RUN apt-get clean && apt-get update --fix-missing && apt-get install -y netcat

ENTRYPOINT ["../init.sh"]

CMD ["uvicorn", "--host", "0.0.0.0", "--port", "80" ,"core.asgi:application", "--lifespan", "on", "--reload"]
