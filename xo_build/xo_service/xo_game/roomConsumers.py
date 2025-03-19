import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from xo_game.models import Match
from asgiref.sync import sync_to_async


class Consumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]

        print(f"Room ID: {self.room_id}")

        game_data = cache.get(self.room_id)
        # Check if room exists

        if not game_data:
            await self.close()
            return

        if len(game_data["players"]) >= 2:
            await self.close()
            return

        game_data["players"].append(self.scope["user"].id)

        cache.set(self.room_id, game_data, timeout=None)

        await self.accept()

        self.room_group_name = f"game_{self.room_id}"

        # Join the WebSocket group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        if len(game_data["players"]) == 2:
            game_data["game_state"] = "PLAY"
            await self.channel_layer.group_send(
                self.room_group_name, {"type": "start_game"}
            )
            cache.set(self.room_id, game_data, timeout=None)

    async def disconnect(self, code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

            game_data = cache.get(self.room_id)

            if game_data:

                if game_data["game_state"] == "WAIT":
                    game_data["players"].remove(self.scope["user"].id)
                    cache.set(self.room_id, game_data, timeout=None)
                    return

                cache.delete(self.room_id)

                if game_data["game_state"] == "PLAY":
                    winner_id = None

                    for id in game_data["players"]:
                        if id != self.scope["user"].id:
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

                    await self.save_resault(winner_id, self.scope["user"].id)

    async def receive(self, text_data):
        game_data = cache.get(self.room_id)

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

            cache.set(self.room_id, game_data, timeout=None)

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
        game_data = cache.get(self.room_id)

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
        game_data = cache.get(self.room_id)

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
        user_id = self.scope["user"].id

        user_turn_id = game_data["players"][game_data["turn"]]

        return user_id == user_turn_id

    async def game_end(self, event):
        game_data = cache.get(self.room_id)

        if game_data:
            game_data["game_state"] = "OVER"
            cache.set(self.room_id, game_data, timeout=None)

        user_id = self.scope["user"].id

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

        await self.close()

    async def check_winner(self):
        game_data = cache.get(self.room_id)

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
            cache.set(
                self.room_id,
                {
                    "players": game_data["players"],
                    "board": [""] * 9,
                    "turn": game_data["turn"],
                    "game_state": "PLAY",
                },
                timeout=None,
            )  # Store in Redis for 60 secs

            await self.channel_layer.group_send(
                self.room_group_name, {"type": "start_game"}
            )

    async def save_resault(self, winner_id, losser_id):
        try:
            match = await sync_to_async(Match.objects.create)(
                player_1_id=winner_id,
                player_2_id=losser_id,
                winner=winner_id
            )

        except Exception as e:
            print("Error saving match:", e)
            await self.send(text_data=json.dumps({
                'action': 'error',
                'message': 'Error saving match'
            }))
