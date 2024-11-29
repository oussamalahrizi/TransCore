FROM debian:bullseye

RUN apt update -y && apt upgrade -y

RUN apt install -y php \
php-cli \
php-mbstring \
php-mysql \
curl \
&& rm -rf /var/lib/apt/lists/*

RUN curl -L https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1.php \
 -o /var/www/html/index.php

RUN curl -L https://raw.githubusercontent.com/vrana/adminer/master/designs/pepa-linha/adminer.css \
 -o /var/www/html/adminer.css

ENTRYPOINT [ "php" , "-S", "0.0.0.0:80", "-t", "/var/www/html/"]