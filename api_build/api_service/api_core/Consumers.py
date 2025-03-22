import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils import _Cache
from asgiref.sync import sync_to_async
from core.asgi import queue_publisher
from channels.layers import get_channel_layer

from pprint import pprint

class OnlineConsumer(AsyncWebsocketConsumer):
	cache = _Cache

	async def connect(self):
		await self.accept()
		error = self.scope.get("error_message")
		# reject if there is an error from middleware
		if error:
			await self.close(reason=error, code=4001)
			return
		self.user = self.scope["user"]
		self.group_name = f"notification_{self.user["id"]}"
		await sync_to_async(self.cache.set_user_online)(self.user["id"])
		await self.channel_layer.group_add(self.group_name, self.channel_name)
		print(f"{self.user['username']} connected")
		friends = self.cache.get_user_data(self.user["id"]).get("auth").get("friends")
		if not friends:
			print("no friends connect")
			return
		for f in friends:
			f_status = self.cache.get_user_status(f)
			if f_status != "offline":
				print("sending to user ", f)
				group = f"notification_{f}"
				await get_channel_layer().group_send(group, {
					"type": "refresh_friends"
				})

	async def disconnect(self, code):
		if code == 4001:
			return
		if hasattr(self, 'group_name'):
			await self.channel_layer.group_discard(self.group_name, self.channel_name)
		# publish to the match making consumer to remove player from queue if player is offline
		status = self.cache.get_user_status(self.user['id'])
		if status == 'inqueue':
			body = {
				'type' : 'remove_pqueue',
				'data' : {
					'user_id' : self.user['id']
				}
			}
			await queue_publisher.publish(body)
		# TODO also notify game and tournament to remove the player
		# notify his friends to refresh the friend list
		user_data = self.cache.get_user_data(self.user["id"])
		friends = user_data.get("auth").get("friends")
		await sync_to_async(self.cache.set_user_offline)(self.user['id'])
		print(f"{self.user['username']} disconnected")
		if not friends:
			return
		for f in friends:
			f_status = self.cache.get_user_status(f)
			if f_status != "offline":
				print("sending to user ", f)
				group = f"notification_{f}"
				await get_channel_layer().group_send(group, {
					"type": "refresh_friends"
				})
	

	async def disconnect_user(self, event):
		print("disconnect user consumer", event)
		if self.cache.get_user_status(self.user["id"]) == "online":
			await sync_to_async(self.cache.set_user_offline)(self.user['id'])
		await self.close(code=event.get('code'), reason=event.get("message"))

	async def send_notification(self, event):
		data = {
			'type' : "notification",
			'message' : event["message"],
		}
		if event.get("color"):
			data["color"] = event["color"]
		await self.send(text_data=json.dumps(data))
		print("send regular notification message")
	
	async def set_user_game(self, event):
		data = {
			'type' : "ingame",
			'game_id' : event["game_id"]
		}
		await self.send(text_data=json.dumps(data))
	
	async def status_update(self, event):
		print("status update event")
		pprint(event)
		data = {
			"type" : "status_update",
			"status" : event["status"]
		}
		await self.send(json.dumps(data))

	async def refresh_friends(self, event):
		await self.send(text_data=json.dumps({
			'type' : "refresh_friends"
		}))
	
	async def update_info(self, event):
		await self.send(text_data=json.dumps({
			'type' : "update_info"
		}))
