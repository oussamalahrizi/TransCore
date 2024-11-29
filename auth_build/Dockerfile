FROM python:3.12-bookworm

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /var/app

COPY auth_service/ .

COPY build/conf/requirements.txt .

RUN pip install -r requirements.txt

COPY build/tools/init.sh .


RUN chmod +x init.sh

ENTRYPOINT ["./init.sh"]

CMD ["./manage.py", "runserver", "0.0.0.0:8000"]