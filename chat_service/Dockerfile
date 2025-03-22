FROM python:3.12-bullseye
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /chatco

RUN apt-get clean && apt-get update --fix-missing && apt-get install -y netcat
COPY requirements.txt /chatco/

RUN pip install -r requirements.txt



COPY ./init.sh /bin/init.sh

RUN chmod +x /bin/init.sh

ENTRYPOINT [ "/bin/init.sh" ]

CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8001" ,"django_chat.asgi:application", "--lifespan", "on",  "--reload"]