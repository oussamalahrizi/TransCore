from channels.generic.websocket import AsyncWebsocketConsumer
class TestConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.accept()
		await self.send(text_data="Connection established bye bye")
		error = self.scope.get("error_message")
		if error:
			await self.send(error, close=True)
			return
		user  = self.scope["user"]
		self.send(text_data=f"Welcome {user["username"]}")


	async def disconnect(self, close_code):
		await self.send(text_data="Connection closed")

	async def receive(self, text_data):
		await self.send(text_data=f"Received from client: {text_data}")
