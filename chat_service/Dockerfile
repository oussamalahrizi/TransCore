FROM python:3.12-bookworm
# ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
# RUN apt update -y && apt upgrade -y \
#     && apt-get install -y postgresql-client \
#     && pip install --upgrade pip \
#     && pip install django daphne redis \
#     && pip install django-cors-headers \
#     && pip install django-allauth requests dj-rest-auth djangorestframework-simplejwt django-cors-headers channels \
#     && pip install djangorestframework djangorestframework-simplejwt 

WORKDIR /chatco

COPY requirements.txt /chatco/

RUN pip install -r requirements.txt

# RUN pip install redis channels channels_redis django-allauth requests dj-rest-auth djangorestframework-simplejwt django-cors-headers


COPY ./init.sh /bin/init.sh

RUN chmod +x /bin/init.sh

ENTRYPOINT [ "/bin/init.sh" ]

# CMD ["bash", "-c", "sleep 4 && python manage.py makemigrations && python manage.py migrate && python manage.py runserver 0.0.0.0:8001"]

CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8001" ,"django_chat.asgi:application", "--lifespan", "on",  "--reload"]