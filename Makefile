up:
	@mkdir -p /tmp/users_data
	@mkdir -p /tmp/redis_cache1_aof
	@mkdir -p /tmp/redisinsight
	@docker compose -f ./docker-compose.yml up -d
down:
	@docker compose -f ./docker-compose.yml down
fclean:
	@docker compose -f ./docker-compose.yml down --volumes --rmi all
	@sudo rm -rf /tmp/users_data
	@sudo rm -rf /tmp/redis_cache1_aof
re: down up

build: fclean up
	
.PHONY: up down fclean re build
