FROM python:3.10

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -y && apt upgrade -y \
    && apt-get install -y postgresql-client \
    && pip install --upgrade pip \
    && pip install django daphne redis \
    && pip install django-cors-headers \
    && pip install django-allauth requests dj-rest-auth djangorestframework-simplejwt django-cors-headers channels \
    && pip install djangorestframework djangorestframework-simplejwt 

WORKDIR /chatco

COPY requirements.txt /chatco/

RUN pip install --no-cache-dir -r /chatco/requirements.txt

RUN pip install redis channels channels_redis django-allauth requests dj-rest-auth djangorestframework-simplejwt django-cors-headers

WORKDIR /chatco

CMD ["bash", "-c", "python manage.py makemigrations && python manage.py migrate && python manage.py runserver 0.0.0.0:8001"]