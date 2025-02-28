import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils import _Cache
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from .models import Notification

class OnlineConsumer(AsyncWebsocketConsumer):
	cache = _Cache
	user = None

	async def connect(self):
		await self.accept()
		error = self.scope.get("error_message")
		# reject if there is an error from middleware
		if error:
			await self.close(reason=error, code=4001)
			return
		self.user = self.scope["user"]
		self.group_name = f"notification_{self.user["username"]}"
		await sync_to_async(self.cache.set_user_online)(self.user["id"])
		await self.channel_layer.group_add(self.group_name, self.channel_name)

	async def disconnect(self, code):
		await sync_to_async(self.cache.set_user_offline)(self.user['id'])
		return await super().disconnect(code)
	
	async def disconnect_user(self, event):
		print("disconnect user consumer", event)
		await sync_to_async(self.cache.set_user_offline)(self.user['id'])
		await self.close(code=event.get('code'), reason=event.get("message"))

	async def send_notification(self, event):
		data = {
			'message' : event["message"]
		}
		await self.store_notfication(data['message'])
		await self.send(text_data=json.dumps(data))

	@database_sync_to_async
	def store_notfication(self, message : str):
		Notification.objects.create_notification(user_id=self.user['id'], message=message)