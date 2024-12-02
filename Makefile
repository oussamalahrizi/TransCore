up:
	@mkdir -p /tmp/users_data
	@docker compose -f ./docker-compose.yml up -d
down:
	@docker compose -f ./docker-compose.yml down
fclean:
	@docker compose -f ./docker-compose.yml down --rmi all
	@docker volume rm $$(docker volume ls -q)
	# @rm -rf /tmp/users_data
re: down up

build: fclean up
	
.PHONY: up down fclean re build