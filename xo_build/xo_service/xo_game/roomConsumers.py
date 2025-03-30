import json
from channels.generic.websocket import AsyncWebsocketConsumer
from xo_game.models import Match
from asgiref.sync import sync_to_async
from .cache import Game_Cache
import uuid
from .models import Player, Match
import asyncio
from core.publisher import publishers

queue = publishers[0]

async def publishQueue(data : dict):
    await queue.publish(data)

async def send_game_over(game_id, winner):
    body = {
            'type' : "game_over",
            'data' : {
                'game_id' : game_id,
                'match_type' : "regular",
                'game_type' : "tic",
                'winner' : winner

            }
        }
    await publishQueue(body)
    print("GAME SENT GAME OVER")


class Consumer(AsyncWebsocketConsumer):
    cache = Game_Cache

    async def connect(self):

        await self.accept()
        error = self.scope.get('error_message')
        if error:
            print(f"Error: {error}")
            await self.close(code=4001, reason=error)
            return
        # send event to matchmaking

        self.user = self.scope['user']
        self.user_id = self.user['id']
        self.username = self.user['username']
        self.game_id = self.scope['game_id']

        print(f"Room ID: {self.game_id}")

        game_data = self.cache.get(self.game_id)
        # Check if room exists

        if not game_data:
            self.cache.set(
                self.game_id,
                {"roomId": str(uuid.uuid4()), "players": [], "board": [""] * 9, "turn": 0, "game_state": "WAIT"},
            )
            game_data = self.cache.get(self.game_id)


        if len(game_data["players"]) >= 2:
            await self.close(code=4001, reason="Game is full")
            return
        
        if self.user_id in game_data["players"]:
            await self.close(code=4001, reason="You are already in the game")
            return
        
        game_data["players"].append(self.user_id)

        self.cache.set(self.game_id, game_data)

        self.room_group_name = f"game_{game_data["roomId"]}"

        # Join the WebSocket group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        print(f"User {self.user_id} connected to room {self.game_id}")

        if len(game_data["players"]) == 2:
            game_data = self.cache.get(self.game_id)
            game_data["game_state"] = "PLAY"
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "start_game"}
            )
            self.cache.set(self.game_id, game_data)


    async def disconnect(self, code):

        print(f"Disconnect code: {code}")
        # if (code != 4001):
        #     # send event to matchmaking
        #     pass
        

        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

            game_data = self.cache.get(self.game_id)

            if game_data:

                if game_data["game_state"] == "WAIT":
                    game_data["players"].remove(self.user_id)
                    self.cache.set(self.game_id, game_data)
                    return

                self.cache.delete(self.game_id)

                if game_data["game_state"] == "PLAY":
                    winner_id = None

                    for id in game_data["players"]:
                        if id != self.user_id:
                            winner_id = id

                    print(f"Winner ID: {winner_id}")
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "game_end",
                            "winner": winner_id,
                            "position": [],
                        },
                    )

                    await self.save_resault(winner_id, self.user_id)
                    

    async def receive(self, text_data):
        game_data = self.cache.get(self.game_id)

        if not game_data:
            return

        if game_data["game_state"] != "PLAY":
            return

        try:
            data = json.loads(text_data)

            position = int(data["position"])

            if position < 1 or position > 9:
                raise Exception("Invalid move")

            if not self.isMyTurn(game_data):
                raise Exception("Not your turn")

            if game_data["board"][position - 1] != "":
                raise Exception("Position already taken")

            game_data["board"][position - 1] = game_data["turn"]

            game_data["turn"] = 0 if game_data["turn"] == 1 else 1

            self.cache.set(self.game_id, game_data)

            await self.channel_layer.group_send(
                self.room_group_name, {"type": "game_move", "position": position}
            )

            await self.check_winner()

        except Exception as e:
            print(e)
            await self.send(
                text_data=json.dumps({"action": "error", "message": e.args[0]})
            )

    async def start_game(self, event):
        game_data = self.cache.get(self.game_id)
        if not game_data:
            await self.close()
            return

        turn = self.isMyTurn(game_data)
        
        await self.send(
            text_data=json.dumps(
                {
                    "action": "start_game",
                    "message": "Game started",
                    "turn": turn,
                    "players": game_data["players"],
                    "id": self.user_id,
                    "opp_id": game_data["players"][0 if self.user_id != game_data["players"][0] else 1],
                }
            )
        )

    async def game_move(self, event):
        game_data = self.cache.get(self.game_id)

        position = event["position"]

        if not game_data:
            await self.close()
            return

        turn = self.isMyTurn(game_data)

        await self.send(
            text_data=json.dumps(
                {
                    "action": "game_move",
                    "message": "Game move",
                    "turn": turn,
                    "players": game_data["players"],
                    "position": position,
                    "me": not turn,
                }
            )
        )

    def isMyTurn(self, game_data):
        user_id = self.user_id

        user_turn_id = game_data["players"][game_data["turn"]]

        return user_id == user_turn_id

    async def game_end(self, event):
        game_data = self.cache.get(self.game_id)

        if game_data:
            game_data["game_state"] = "OVER"
            self.cache.set(self.game_id, game_data)

        user_id = self.user_id

        winner_id = event["winner"]

        position = event["position"]

        await self.send(
            text_data=json.dumps(
                {
                    "action": "game_over",
                    "winner": user_id == winner_id,
                    "position": position,
                }
            )
        )

        # wait for 5 seconds before closing the connection
        # await asyncio.sleep(5)
        # await self.close()

    async def check_winner(self):
        game_data = self.cache.get(self.game_id)

        if not game_data:
            await self.close()
            return

        # check rows and columns and diagonals

        combinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ]

        game_board = game_data["board"]

        for a, b, c in combinations:
            if game_board[a] == game_board[b] == game_board[c] and game_board[a] != "":
                winner_id = game_data["players"][game_board[a]]
                losser_id = game_data["players"][0 if game_board[a] == 1 else 1]

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_end",
                        "winner": winner_id,
                        "position": [a + 1, b + 1, c + 1],
                    },
                )

                await self.save_resault(winner_id, losser_id)

                return

        if "" not in game_board:
            self.cache.set(
                self.game_id,
                {
                    "players": game_data["players"],
                    "board": [""] * 9,
                    "turn": game_data["turn"],
                    "game_state": "PLAY",
                }
            )  # Store in Redis for 60 secs

            await self.channel_layer.group_send(
                self.room_group_name, {"type": "start_game"}
            )

    async def save_resault(self, winner_id, losser_id):
        asyncio.create_task(send_game_over(self.game_id, winner_id))

        try:
            player1_id = winner_id
            player2_id = losser_id
            winner_id = winner_id

            # Get or create players (database queries)
            player1 = await sync_to_async(Player.objects.get_or_create)(player_id=player1_id)
            player2 = await sync_to_async(Player.objects.get_or_create)(player_id=player2_id)
            winner = await sync_to_async(Player.objects.get_or_create)(player_id=winner_id)

            # Update player stats (database operations)
            player1[0].matches_won += 1
            player1[0].score += 20
            player2[0].matches_lost += 1
            player2[0].score -= 20

            # Save player stats
            await sync_to_async(player1[0].save)()
            await sync_to_async(player2[0].save)()

            # Create match record (database operation)
            await sync_to_async(Match.objects.create)(
                player1=player1[0],
                player2=player2[0],
                winner=winner[0],
            )

        except Exception as e:
            print("Error saving match:", e)
            await self.send(text_data=json.dumps({
                'action': 'error',
                'message': 'Error saving match'
            }))