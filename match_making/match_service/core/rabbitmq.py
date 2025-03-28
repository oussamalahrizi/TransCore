from aio_pika import connect, Message, Connection, IncomingMessage
import asyncio
import json

class RabbitmqBase:

    def __init__(self, host, port, queue_name):
        self.connection : Connection = None
        self.channel = None
        self.queue = None
        self.closing = False
        self.host = host
        self.port = port
        self.queue_name = queue_name
            
    async def connect(self):
        while not self.closing:
            try:
                self.connection = await connect(
                    host=self.host,
                    port=self.port,
                    loop=asyncio.get_event_loop()
                )
                self.connection.close_callbacks.add(self.reconnect)
                self.channel = await self.connection.channel()
                await self.channel.set_qos(prefetch_count=1)
                self.queue = await self.channel.declare_queue(self.queue_name, durable=True)
                print(f"Connection established with queue : {self.queue_name}.")
                self.closing = False
                break
            except Exception as e:
                print(f"Connection error : {e}")
                await asyncio.sleep(2)
    
    async def reconnect(self, *args, **kwargs):
        if not self.closing:
            print("reconnecting...")
            await self.connect()
            print("Done")

    async def run(self):
        await self.connect()
    
    async def publish(self, data : dict):
        raise NotImplementedError()

    async def stop(self):
        if not self.closing:
            self.closing = True
            print("Stopping")
            if self.connection and not self.connection.is_closed:
                await self.channel.close()
                await self.connection.close()
            print("Stopped")

class APIPub(RabbitmqBase):
    
    async def publish(self, data : dict):
        message = Message(
            json.dumps(data).encode(),
            delivery_mode=1,
            content_type="application/json")
        await self.channel.default_exchange.publish(message=message, routing_key=self.queue.name)
        print("api publisher : pusblished!")

class NotificationPub(RabbitmqBase):
    
    async def publish(self, data : dict):
        message = Message(
            json.dumps(data).encode(),
            delivery_mode=1,
            content_type="application/json")
        await self.channel.default_exchange.publish(message=message, routing_key=self.queue.name)




"""
    generate id store in cache for 60 secs,
    send game id in notification to both players
    /pong/game_id=123
    ws://localhost:8000/?game_id=123&token=token
    oussama ilyass
    ilyass_oussama
    {
        ilyass_oussama : [ilyass, oussama]
        
    }
    /tictac/game_id=123
    /check_game/ check game with game id if its valid

    {
        type : "regular" | "tournament",
        tournament_id : uuid | null,
        player1 : uuid,
        player2 : uuid,
        game_id : uuid,
        gametype : "pong" | "tictac"
    }
    
    /find_match/
    tournament design :
    the tournament schedule randomly players 4 players example:
    player x vs player y => (x and y vary about any current match on the tournament)
        sends message through rabbitmq to establish a game id to be sent to game service
        game service stores the game result with additional type as tournament with tournament name




    game db schema for each game (pong/tictac):
    game model : {
        type : "regular" | "single" | "tournament",
        game_id : uuid,
        player1 : uuid,
        player2 : uuid,
        tournament_id : uuid | null, (type has to be tournament for this to not be null)
        winner : reference of winning player uuid,
    }
    player model : {
        player_id : uuid,
        # any additional stats
        win streak : unsigned int,
    }
    game service has to report if the game type is tournament to the tournament service,
    tournament services receives the info from game service like this :
    {
        match id : uuid,
        winner : uuid,
        tournament id : uuid,
    }
    then advance to the next round

    matchmaking consumer : 
        - listens on the following urls : 
            /find_match
            /check_game
        - listens on the broker:
            the tournament service has to publish a json object to the matchmaking service
            {
                player1 : uuid,
                player2 : uuid,
                tournament_id : uuid,
                game_type : "pong" | "tictac"
            }
            so the matchmaking service generates a game id to store in its cache, then we notify the
            concerning players

        tournament db schema :
        {
            game type : "pong" | "tictac",
            winner: uuid,
        }
        
        {
            pong queue : user_id
        }
"""

