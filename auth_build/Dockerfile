FROM python:3.12-bookworm

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /var/app

COPY build/conf/requirements.txt /var

COPY build/tools/init.sh /var	

RUN chmod +x /var/init.sh

RUN pip install -r /var/requirements.txt

ENTRYPOINT ["../init.sh"]

CMD ["./manage.py", "runserver", "0.0.0.0:80"]
