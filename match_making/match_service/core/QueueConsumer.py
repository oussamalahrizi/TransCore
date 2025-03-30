"""
    Consumer to listen on so we remove the player from the queue if disconnected
"""

from aio_pika import connect, Connection, IncomingMessage
import asyncio
import json

from .publishers import notifspub

class AsyncRabbitMQConsumer:
    def __init__(self, host, port, queue_name):
        self.host = host
        self.port = port
        self.queue_name = queue_name
        self._connection : Connection = None
        self._channel = None
        self._closing = False
        
    async def connect(self):
        while not self._closing:
            try:
                self._connection = await connect(
                    host=self.host,
                    port=self.port,
                    loop=asyncio.get_event_loop(),
                )
                self._connection.close_callbacks.add(self.reconnect)
                self._channel = await self._connection.channel()
                await self._channel.set_qos(prefetch_count=1)
                print(f"{self.queue_name} : Connection established ")
                self._closing = False
                await self.start_consuming()
                break
            except Exception as e:
                print(f"{self.queue_name} : Connection error in queue :  {e}")
                await asyncio.sleep(2)

    async def reconnect(self, param1, param2):
        if not self._closing:
            print(f"{self.queue_name} : reconnecting...")
            await self.connect()

    async def start_consuming(self):
        try:
            queue = await self._channel.declare_queue(self.queue_name, durable=True)
            await queue.consume(self.on_message)
            print(f"{self.queue_name} : Started consuming")
        except Exception as e:
            print(f"{self.queue_name} : Error while starting consuming : {e}")

    async def on_message(self, message: IncomingMessage):
            raise NotImplementedError

    async def run(self):
        await self.connect()

    async def stop(self):
        if not self._closing:
            self._closing = True
            print(f"Stopping consumer : {self.queue_name}")
            if self._connection and not self._connection.is_closed:
                await self._channel.close()
                await self._connection.close()
            print(f"Stopped {self.queue_name}")


from matchmaking.utils import Queue, tournament

from pprint import pprint

from asgiref.sync import async_to_sync

import uuid

async def generate_game( players : list[str], tr_id): 
        id = str(uuid.uuid4())
        data = {
            'players' : players,
            'match_type' : "tournament",
            'tournament_id' : tr_id
        }
        tournament.redis.set(f"pong:{id}", json.dumps(data))
        for p in players:
            body = {
                'type' : "match_found",
                'data' : {
                    "user_id" : p,
                    'game_id' : id
                }
            }
            await notifspub.publish(body)
        return id

async def send_tr_update(players : list):
    body = {
        'type' : 'tr_update',
        'data' : {
            'players' : players
        }
    }
    await notifspub.publish(body)

async def remove_loser(user_id : str, tr_id : str):
    body = {
        'type' : 'remove_tournament',
        'data' : {
            'user_id' : user_id,
            'tr_id' : tr_id
        }
    }
    await notifspub.publish(body)


async def handle_tournament(data : dict):
    print("HANDLE TOURNAMENT RESULTS")
    tr_data = tournament.fetch_ongoing(data['tournament_id'])
    if tr_data is None:
        raise Exception("Tournament data is None")


    pprint(tr_data)
    pprint(data)
    status = tr_data["status"]
    semis : list[dict] = tr_data['semis']
    # all = []
    # all.extend(semis[0]['players'])
    # all.extend(semis[1]['players'])
    # await send_tr_update(all)
    if status == 'semis':
        g_id = data['game_id']
        semis : list[dict] = tr_data['semis']
        which = 0 if semis[0]['game_id'] == g_id else 1
        tr_data['semis'][which]['result'] = data['result']
        final : dict = tr_data['final']
        final['players'].append(data['winner'])
        loser = tr_data['semis'][which]['players'][0]
        if loser == data['winner']:
            loser = tr_data['semis'][which]['players'][1]
        # await remove_loser(loser, data['tournament_id'])
        await send_tr_update([loser, data['winner']])
        if len(final['players']) < 2:
            tournament.redis.set(f"ongoing:{data['tournament_id']}",
                                json.dumps(tr_data))
            Queue.redis.delete(f'pong:{data['game_id']}')
            return
        await send_tr_update([semis[0]['players'], semis[1]['players']])
        print('HANDLING FINAL')
        tr_data['status'] = 'final'
        game_id = await generate_game(
            final['players'],
            data['tournament_id'])
        final['game_id'] = game_id
        tr_data['final'] = final
        tournament.redis.set(f"ongoing:{data['tournament_id']}",
                                json.dumps(tr_data))
        Queue.redis.delete(f'pong:{data['game_id']}')
        return
    # handle final, send all players the winner
    # combine players
    print('data final :')
    pprint(data)
    pprint(tr_data)
    players = []
    semis = tr_data['semis']
    for s in semis:
        players.extend(s['players'])
    winner = data['winner']
    loser = tr_data['final']['players'][0]
    if loser == winner:
        loser = tr_data['final']['players'][1]
    print('players : ', players)
    for p in players:
        print('publishing to : ', p)
        await notifspub.publish({
            'type' : 'tr_end',
            'data' : {
                'user_id' : p,
                'winner' : winner,
                'loser' : loser,
                'result' : data['result']
            }
        })
        await remove_loser(p, data['tournament_id'])
    Queue.redis.delete(f'pong:{data['game_id']}')
    tournament.redis.delete(f'ongoing:{data['tournament_id']}')

class QueueConsumer(AsyncRabbitMQConsumer):

    actions = {}
    cache = Queue

    def __init__(self, host, port, queue_name):
        self.actions = {
            'remove_pqueue' : self.remove_pqueue,
            'game_over' : self.game_over
        }
        super().__init__(host, port, queue_name)

    async def remove_pqueue(self, data : dict):
        user_id = data.get('user_id')
        self.cache.remove_player(user_id)
    
    async def game_over(self, data : dict):
        print("received game over :")
        match_type = data.get("match_type")
        game_type = data.get("game_type")
        game_id =  data.get("game_id")
        if match_type == "tournament":
            await handle_tournament(data)
            return
        print("NORMAL GAME : ", game_id, game_type)
        game_data = self.cache.get_game_info(game_id, game_type)
        if not game_data:
            return
        print("DATA : ", game_data)

        players = game_data.get("players")
        for p in players:
            body = {
                'type' : "update_status",
                'data' : {
                    "user_id" : p,
                    "status" : "online"
                }
            }
            await notifspub.publish(body)
        ## proceed to delete
        res = self.cache.redis.delete(f"{game_type}:{game_id}")
        print("deleted ?", res)

    async def on_message(self, message):
        try:
            body : dict = json.loads(message.body.decode())
            type = body.get('type')
            if type not in self.actions:
                print("type is not in actions")
                await message.reject()
                return
            await self.actions[type](body.get("data"))
            await message.ack()
        except json.JSONDecodeError:
            print(f"{self.queue_name} : invalid json data")
        # except Exception as e:
        #     print(f"{self.queue_name} : Error processing the message : {e}")
        #     await message.reject()
