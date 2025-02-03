import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer

class TestConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.accept()
		error = self.scope.get("error_message")
		if error:
			await self.close(reason=error, code=4001)
			# data = {"error" : error}
			# await self.send(text_data=json.dumps(data), close=True)
			return
		user = self.scope["user"]
		await self.send(text_data=f"Welcome {user['username']}")


	async def disconnect(self, code):
		await self.send(text_data="Connection closed")

	async def receive(self, text_data=None, bytes_data=None):
		await self.send(text_data=f"Received from client: {text_data}")
	
