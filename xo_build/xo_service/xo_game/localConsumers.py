import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from .cache import Game_Cache

class Consumer(AsyncWebsocketConsumer):
    cache = Game_Cache
    async def connect(self):
        await self.accept()
        error = self.scope.get('error_message')
        print(f"Error: {error}")
        if error:
            await self.close(code=4001, reason=error)
            return
        
        self.user = self.scope['user']
        self.user_id = self.user['id']
        self.username = self.user['username']

        print(f"username -> {self.username}")

        # match making
        
        self.room_id = str(uuid.uuid4())  # Generate unique room ID
        self.user_id = "me"
        self.cache.set(
            self.room_id,
            {
                "players": [self.user_id, "Op"],
                "board": [""] * 9,
                "turn": 0,
                "game_state": "PLAY",
            },
            
        )


        await self.start_game({})

    async def disconnect(self, code):
        if (code == 4001):
            return

        # match making
        if hasattr(self, "room_id"):
            self.cache.delete(self.room_id)

    async def receive(self, text_data):
        game_data = self.cache.get(self.room_id)

        if not game_data:
            return

        if game_data["game_state"] != "PLAY":
            return

        try:
            data = json.loads(text_data)

            position = int(data["position"])

            if position < 1 or position > 9:
                raise Exception("Invalid move")

            if game_data["board"][position - 1] != "":
                raise Exception("Position already taken")

            game_data["board"][position - 1] = game_data["turn"]

            game_data["turn"] = 0 if game_data["turn"] == 1 else 1

            self.cache.set(self.room_id, game_data)

            await self.game_move({"position": position})

            await self.check_winner()

        except Exception as e:
            print(e)
            await self.send(
                text_data=json.dumps({"action": "error", "message": e.args[0]})
            )

    async def start_game(self, event):
        game_data = self.cache.get(self.room_id)

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
                }
            )
        )

    async def game_move(self, event):
        game_data = self.cache.get(self.room_id)

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
        game_data = self.cache.get(self.room_id)

        if not game_data:
            self.close()
            return

        user_id = self.user_id

        winner_id = event["winner"]

        position = event["position"]

        game_data["game_state"] = "OVER"

        self.cache.set(self.room_id, game_data)

        await self.send(
            text_data=json.dumps(
                {
                    "action": "game_over",
                    "winner": user_id == winner_id,
                    "position": position,
                }
            )
        )

        await self.close()


    async def check_winner(self):
        game_data = self.cache.get(self.room_id)

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

                await self.game_end(
                    {
                        "winner": winner_id,
                        "position": [a + 1, b + 1, c + 1],
                    }
                )

                return

        if "" not in game_board:
            self.cache.set(
                self.room_id,
                {
                    "players": game_data["players"],
                    "board": [""] * 9,
                    "turn": game_data["turn"],
                    "game_state": "PLAY",
                },
                
            )  # Store in Redis for 60 secs

            await self.start_game({})
