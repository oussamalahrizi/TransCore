

up:
	@docker compose -f ./docker-compose.yml up -d

down:
	@docker compose -f ./docker-compose.yml down

clean :
	@docker compose -f ./docker-compose.yml down --volumes

fclean:
	@docker compose -f ./docker-compose.yml down --volumes --rmi all
	@docker system prune -a

re: down up

build: fclean up
	
.PHONY: up down fclean re build clean
