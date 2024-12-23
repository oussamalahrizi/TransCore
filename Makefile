up:
	@mkdir -p /tmp/users_data
	@mkdir -p /tmp/redis_cache1_aof
	@mkdir -p /tmp/redisinsight
	@docker compose -f ./docker-compose.yml up -d
down:
	@docker compose -f ./docker-compose.yml down

clean : down
	@sudo rm -rf /tmp/users_data
	@sudo rm -rf /tmp/redis_cache1_aof
	@sudo rm -rf  /tmp/redisinsight

fclean:
	@docker compose -f ./docker-compose.yml down --volumes --rmi all
	@sudo rm -rf /tmp/users_data
	@sudo rm -rf /tmp/redis_cache1_aof
	@sudo rm -rf  /tmp/redisinsight
	@docker system prune -a

re: down up

build: fclean up
	
.PHONY: up down fclean re build clean
