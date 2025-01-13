FROM python:3.12-bookworm

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /var/app

COPY build/conf/requirements.txt .

COPY build/tools/init.sh .

RUN chmod +x init.sh

RUN pip install -r requirements.txt

COPY api_service/ .

ENTRYPOINT ["./init.sh"]

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000" ,"core.asgi:application"]