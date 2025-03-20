# chat/consumers.py
import json
import logging
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message
from channels.exceptions import DenyConnection
import httpx
logger = logging.getLogger(__name__)

USER_BY_USERNAME_URL = "http://auth-service/api/auth/internal/username/"

async def fetch_user_by_username(username: str):
    try:
        timeout = httpx.Timeout(5.0, read=5.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(f"{USER_BY_USERNAME_URL}{username}/")
            response.raise_for_status()
            return response.json()
    except (httpx.ConnectError, httpx.ReadTimeout, httpx.HTTPError) as e:
        raise DenyConnection("Failed to fetch receipent info form auth")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == httpx.codes.NOT_FOUND:
            logger.error(f"User not found: {user_id}")
            raise DenyConnection("User Not Found.")
        logger.error(f"HTTP error fetching user info: {e}")
        raise DenyConnection("Failed to fetch user info form auth")
    except:
        raise DenyConnection("Failed to fetch user info form auth")

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = self.room_group_name = self.user = self.chat_with_user_id = None

    async def connect(self):
        try:
            await self.accept()
            self.user = self.scope.get("user")
            if not self.user or "id" not in self.user:
                await self.close(code=4002 if not self.user else 4003, reasaon="User not found or invalid.")
                return
            other = self.scope['url_route']['kwargs'].get('username')
            try:
                if not other:
                    await self.close(code=4002 if not self.user else 4003, reason="Receipent not found or invalid.")
                    return
                self.other = await fetch_user_by_username(other)
            except DenyConnection as e:
                await self.close(code=4002 if not self.user else 4003, reason=str(e))
                return
            
            await self.setup_room(self.other['id'])
            await self.send(json.dumps({
                "type": "user_info",
                "user_id": self.user["id"],
                "roomname": self.room_name  
            }))            
        
        except Exception as e:
            logger.error(f"Connection error: {e}")
            await self.close(code=4000, reason="Unexpected error.")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data["type"] == "message":
                await self.handle_message(data["message"])
        except Exception as e:
            logger.error(f"Message processing error: {e}")
            await self.send(json.dumps({"error": "Message processing failed."}))

    async def setup_room(self, recipient_id):
        self.chat_with_user_id = recipient_id
        user1_id, user2_id = sorted([self.user["id"], recipient_id])
        self.room_name = f"chat_{user1_id}_{user2_id}"
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        logger.info(f"Connected to room: {self.room_name}")

    async def handle_message(self, message):
        if not message or not message.strip():
            logger.warning("Empty message received. Ignoring.")
            await self.send(json.dumps({"error": "Message cannot be empty."}))
            return

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        await self.save_message(self.user["id"], self.chat_with_user_id, message, self.room_name, timestamp)
        
        await self.publish_notification(self.user["id"], self.chat_with_user_id, message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.message", "message": message, "sender_id": self.user["id"], "timestamp": timestamp}
        )


    async def publish_notification(self, sender_id, recipient_id, message):
        """
        Publish a notification to RabbitMQ in the specified format.
        """
        try:
            data = {
                "type": "send_notification",
                "data": {
                    "user_id": str(recipient_id),  
                    "message": f"New message from {sender_id}: {message}",
                },
            }
            notifspub = self.scope.get("notifspub")  
            await notifspub.publish(data)
            logger.info(f"Notification published: {data}")
        except Exception as e:
            logger.error(f"Error publishing notification: {e}")

    async def chat_message(self, event):
        data = {
            'type' : 'message',
            "message": event['message'],
            "sender_id": event['sender_id'],
            "timestamp": event['timestamp']
        }
        await self.send(json.dumps(data))

    @database_sync_to_async
    def save_message(self, sender_id, recipient_id, content, room, timestamp):
        try:
            Message.objects.create(
                sender=sender_id,
                recipient=recipient_id,
                content=content,
                room=room,
                timestamp=timestamp
            )
            logger.info(f"Message saved: sender={sender_id}, recipient={recipient_id}, room={room}")
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise e
        
    async def disconnect(self, close_code):
        if self.room_group_name:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            logger.info(f"Disconnected from room: {self.room_name}")