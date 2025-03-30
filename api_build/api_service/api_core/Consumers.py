import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils import _Cache
from asgiref.sync import sync_to_async
from core.asgi import queue_publisher
from channels.layers import get_channel_layer
import httpx

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
		self.cache.redis.set(self.user["id"], json.dumps({"status" : "offline"}))
		await sync_to_async(self.cache.set_user_online)(self.user["id"])
		await self.channel_layer.group_add(self.group_name, self.channel_name)
		print(f"{self.user['username']} connected")
		await self.send_friends()

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
		await sync_to_async(self.cache.set_user_offline)(self.user['id'])
		print(f"{self.user['username']} disconnected")
		await self.send_friends()


	async def disconnect_user(self, event):
		print("disconnect user consumer", event)
		# if self.cache.get_user_status(self.user["id"]) == "online":
		# 	await sync_to_async(self.cache.set_user_offline)(self.user['id'])
		await self.close(code=event.get('code'), reason=event.get("message"))

	async def send_notification(self, event):
		data = {
			'type' : "notification",
			'message' : event["message"],
		}
		if event.get("color"):
			data["color"] = event["color"]
		await self.send(text_data=json.dumps(data))


	async def invite_accepted(self, event):
		game_id = event["game_id"]
		await self.send(json.dumps({
			"type" : "invite_accepted",
			"game_id" : game_id
		}))
		
	async def match_found(self, event):
		data =  {
			"type" : "match_found",
			'game_id' : event["game_id"],
			'game' : event['game']
		}
		await self.send(json.dumps(data))

	async def cancel_game(self, event):
		await self.send(json.dumps({
			"type" : 'cancel_game'
		}))
	
	async def status_update(self, event):
		print("status update event")
		data = {
			"type" : "status_update",
		}
		print("received status update from queue for user : ", self.user["username"])
		print(event["status"])
		self.cache.set_user_status(self.user["id"], event["status"])
		await self.send(json.dumps(data))
		await self.send_friends()

	async def refresh_friends(self, event):
		await self.send(text_data=json.dumps({
			'type' : "refresh_friends"
		}))
	
	async def update_info(self, event):
		await self.send(text_data=json.dumps({
			'type' : "update_info"
		}))
		await self.send_friends()

	async def send_friends(self):
		try:
			timeout = httpx.Timeout(5.0, read=5.0)
			async with httpx.AsyncClient(timeout=timeout) as client:
				response = await client.get(
					f"{"http://auth-service/api/auth/internal/friends/"}{self.user["id"]}/"
					)
				response.raise_for_status()
				friends = response.json()
				for f in friends:
					status = self.cache.get_user_status(f["id"])
					if status == "offline":
						continue
					group = f"notification_{f["id"]}"
					await self.channel_layer.group_send(group, {
						"type" : "refresh_friends"
					})
		except(httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError):
			raise Exception("Failed to fetch user friends")
		except httpx.HTTPStatusError as e:
			if e.response.status_code == httpx.codes.NOT_FOUND:
				raise Exception("User Not found")
			raise Exception("Internal server error")
		except Exception as e:
			await self.send(json.dumps({
				"type" :  "notification",
				'message' : "Error fetching friends"
			}))
		

	async def invite(self, event):
		from_user = event["from"]
		await self.send(json.dumps({
			"type" : "invite",
			"from" : from_user,
			'from_id' : event["from_id"]
		}))
	

	async def tr_update(self, event):
		await self.send(json.dumps({
			'type' : 'tr_update'
		}))
	
	async def tr_end(self, event):
		await self.send(json.dumps({
			'type' : 'tr_end',
			'winner' : event['winner'],
			'loser' : event['loser'],
			'result' : event['result'],
		}))